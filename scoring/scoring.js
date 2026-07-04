// Blind rubric scoring UI. Runs entirely client-side (open index.html
// directly in a browser, no server / no build step, no network calls).
//
// Safety-by-design: the user selects a *run folder* (produced by
// scripts/run-models.js). That folder also contains mapping.secret.json
// (which reveals the real model behind each model_A/B/C label). This file
// never reads or displays any file whose name matches /mapping|secret/i,
// so the human scorer never sees which real model produced which output.

// Keep this in sync with /config/rubric.json. Duplicated here (rather than
// fetched) because this page is designed to run as a plain local file
// (file://), where fetch() of sibling repo files is blocked by the browser.
const RUBRIC = {
  version: 1,
  scale: { min: 1, max: 5 },
  dimensions: [
    { id: "task_fit", label: "Task Fit & Completeness", description: "Does it fully address the brief? Are all requested elements present?" },
    { id: "strategic_judgment", label: "Strategic Judgment", description: "Is prioritization/tradeoff reasoning sound? Real product judgment, not generic advice?" },
    { id: "clarity_structure", label: "Clarity & Structure", description: "Well organized, scannable, free of padding or filler?" },
    { id: "actionability", label: "Actionability", description: "Are next steps, owners, decision points concrete enough to act on?" },
    { id: "voice_fit", label: "Voice & Audience Fit", description: "Is the tone/register right for the stated audience?" },
    { id: "rigor_accuracy", label: "Rigor & Accuracy", description: "No hallucinated facts/numbers; internally consistent; assumptions flagged as assumptions." },
  ],
  notesLabel: "Free-form notes (what worked, what didn't)",
};

const SENSITIVE_NAME_RE = /mapping|secret/i;

const state = {
  runId: null,
  tasks: [], // { taskId, title, category, promptText, candidates: [{label, output, error}] }
  activeTaskId: null,
  scores: {}, // scores[taskId][label] = { dims: {dimId: n}, notes: "" }
  scorerName: "",
};

const el = {
  fileInput: document.getElementById("folder-input"),
  emptyState: document.getElementById("empty-state"),
  taskList: document.getElementById("task-list"),
  taskView: document.getElementById("task-view"),
  runLabel: document.getElementById("run-label"),
  downloadBtn: document.getElementById("download-btn"),
  scorerNameInput: document.getElementById("scorer-name"),
  statusBar: document.getElementById("status-bar"),
};

el.fileInput.addEventListener("change", handleFolderSelected);
el.downloadBtn.addEventListener("click", downloadResults);
el.scorerNameInput.addEventListener("input", (e) => {
  state.scorerName = e.target.value;
  persistToLocalStorage();
});

async function handleFolderSelected(event) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  const byRelPath = new Map();
  for (const file of files) {
    const rel = file.webkitRelativePath || file.name;
    const parts = rel.split("/");
    const withoutRoot = parts.slice(1).join("/"); // drop the selected folder name itself
    if (SENSITIVE_NAME_RE.test(parts[parts.length - 1])) {
      continue; // never read mapping.secret.json or similar, even if selected
    }
    byRelPath.set(withoutRoot, file);
  }

  const manifestFile = byRelPath.get("manifest.json");
  if (!manifestFile) {
    alert("Couldn't find manifest.json at the root of the selected folder. Select a runs/<runId> folder.");
    return;
  }

  const manifest = JSON.parse(await manifestFile.text());
  const tasks = [];

  for (const taskMeta of manifest.tasks) {
    const promptFile = byRelPath.get(`${taskMeta.taskId}/prompt.md`);
    const promptText = promptFile ? await promptFile.text() : "(prompt.md not found)";

    const candidates = [];
    for (const label of taskMeta.labels) {
      const f = byRelPath.get(`${taskMeta.taskId}/${label}.json`);
      if (!f) continue;
      const data = JSON.parse(await f.text());
      candidates.push({ label, output: data.output || "", error: data.error || null });
    }
    // Shuffle display order only (does not affect the saved label), so the
    // scorer can't unconsciously learn a positional pattern across tasks.
    shuffleInPlace(candidates);

    tasks.push({
      taskId: taskMeta.taskId,
      title: taskMeta.title,
      category: taskMeta.category,
      promptText,
      candidates,
    });
  }

  state.runId = manifest.runId;
  state.tasks = tasks;
  state.activeTaskId = tasks[0]?.taskId || null;

  loadFromLocalStorage();
  render();
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function getScoreEntry(taskId, label) {
  state.scores[taskId] ||= {};
  state.scores[taskId][label] ||= { dims: {}, notes: "" };
  return state.scores[taskId][label];
}

function computeOverall(dims) {
  const values = RUBRIC.dimensions.map((d) => dims[d.id]).filter((v) => typeof v === "number");
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function localStorageKey() {
  return `cpo-ai-bench-scores:${state.runId}`;
}

function persistToLocalStorage() {
  if (!state.runId) return;
  localStorage.setItem(
    localStorageKey(),
    JSON.stringify({ scores: state.scores, scorerName: state.scorerName })
  );
}

function loadFromLocalStorage() {
  const raw = localStorage.getItem(localStorageKey());
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.scores = parsed.scores || {};
    state.scorerName = parsed.scorerName || "";
    el.scorerNameInput.value = state.scorerName;
  } catch {
    // ignore corrupt local storage
  }
}

function taskCompletion(task) {
  const total = task.candidates.length * RUBRIC.dimensions.length;
  if (total === 0) return { done: 0, total: 0 };
  let done = 0;
  for (const c of task.candidates) {
    const entry = state.scores[task.taskId]?.[c.label];
    if (!entry) continue;
    done += RUBRIC.dimensions.filter((d) => typeof entry.dims[d.id] === "number").length;
  }
  return { done, total };
}

function render() {
  el.emptyState.classList.toggle("hidden", state.tasks.length > 0);
  el.taskList.classList.toggle("hidden", state.tasks.length === 0);
  el.taskView.classList.toggle("hidden", state.tasks.length === 0);
  el.downloadBtn.disabled = state.tasks.length === 0;
  el.runLabel.textContent = state.runId ? `Run: ${state.runId}` : "";

  renderTaskList();
  renderTaskView();
  renderStatusBar();
}

function renderTaskList() {
  el.taskList.innerHTML = "";
  for (const task of state.tasks) {
    const { done, total } = taskCompletion(task);
    const btn = document.createElement("button");
    btn.className = task.taskId === state.activeTaskId ? "active" : "";
    btn.innerHTML = `<span>${escapeHtml(task.title)}</span><span class="badge">${done}/${total}</span>`;
    btn.addEventListener("click", () => {
      state.activeTaskId = task.taskId;
      render();
    });
    el.taskList.appendChild(btn);
  }
}

function renderTaskView() {
  el.taskView.innerHTML = "";
  const task = state.tasks.find((t) => t.taskId === state.activeTaskId);
  if (!task) return;

  const promptBox = document.createElement("details");
  promptBox.className = "prompt-box";
  promptBox.innerHTML = `<summary>${escapeHtml(task.title)} — frozen prompt (${escapeHtml(
    task.category
  )})</summary><pre></pre>`;
  promptBox.querySelector("pre").textContent = task.promptText;
  el.taskView.appendChild(promptBox);

  const grid = document.createElement("div");
  grid.className = "candidates";

  for (const candidate of task.candidates) {
    grid.appendChild(renderCandidateCard(task, candidate));
  }

  el.taskView.appendChild(grid);
}

function renderCandidateCard(task, candidate) {
  const entry = getScoreEntry(task.taskId, candidate.label);
  const card = document.createElement("div");
  card.className = "candidate";

  const overall = computeOverall(entry.dims);
  card.innerHTML = `
    <h3><span>${escapeHtml(candidate.label)}</span><span class="label-tag">blind</span></h3>
    ${candidate.error ? `<div class="error">Generation error: ${escapeHtml(candidate.error)}</div>` : ""}
    <div class="output"></div>
    <div class="rubric-grid" data-rubric></div>
    <div class="overall-pill" data-overall></div>
    <textarea class="notes" placeholder="${escapeHtml(RUBRIC.notesLabel)}"></textarea>
  `;
  card.querySelector(".output").textContent = candidate.output || "(no output)";

  const rubricGrid = card.querySelector("[data-rubric]");
  for (const dim of RUBRIC.dimensions) {
    const label = document.createElement("div");
    label.className = "dim-label";
    label.textContent = dim.label;
    rubricGrid.appendChild(label);

    const scaleWrap = document.createElement("div");
    scaleWrap.className = "scale-buttons";
    for (let n = RUBRIC.scale.min; n <= RUBRIC.scale.max; n++) {
      const b = document.createElement("button");
      b.textContent = String(n);
      b.className = entry.dims[dim.id] === n ? "selected" : "";
      b.addEventListener("click", () => {
        entry.dims[dim.id] = n;
        persistToLocalStorage();
        render();
      });
      scaleWrap.appendChild(b);
    }
    rubricGrid.appendChild(scaleWrap);

    const desc = document.createElement("div");
    desc.className = "dim-desc";
    desc.textContent = dim.description;
    rubricGrid.appendChild(desc);
  }

  card.querySelector("[data-overall]").textContent =
    overall !== null ? `Overall (avg): ${overall.toFixed(2)} / 5` : "Overall (avg): —";

  const notes = card.querySelector("textarea.notes");
  notes.value = entry.notes;
  notes.addEventListener("input", (e) => {
    entry.notes = e.target.value;
    persistToLocalStorage();
  });

  return card;
}

function renderStatusBar() {
  if (state.tasks.length === 0) {
    el.statusBar.textContent = "";
    return;
  }
  const totals = state.tasks.reduce(
    (acc, t) => {
      const { done, total } = taskCompletion(t);
      acc.done += done;
      acc.total += total;
      return acc;
    },
    { done: 0, total: 0 }
  );
  el.statusBar.textContent = `Progress: ${totals.done}/${totals.total} ratings entered across ${state.tasks.length} tasks.`;
}

function downloadResults() {
  const scores = [];
  for (const task of state.tasks) {
    for (const candidate of task.candidates) {
      const entry = getScoreEntry(task.taskId, candidate.label);
      scores.push({
        taskId: task.taskId,
        label: candidate.label,
        dims: entry.dims,
        overall: computeOverall(entry.dims),
        notes: entry.notes,
      });
    }
  }

  const payload = {
    runId: state.runId,
    scorer: "human",
    scorerName: state.scorerName || null,
    rubricVersion: RUBRIC.version,
    generatedAt: new Date().toISOString(),
    scores,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `human-scores-${state.runId}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
