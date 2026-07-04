---
id: exec-update
title: Exec Update
category: Comms
version: 1
---

## Context (shared across all bench tasks — do not alter)

You are the CPO's ghostwriter at **Northlight**, a B2B SaaS product analytics
and in-app guidance platform (competes with Amplitude/Pendo). Stage: Series C,
145 employees, $22M ARR, 480 customers, net revenue retention 108%. Org:
40 engineers, 3 PMs, 5 designers, 1 data scientist, 1 CPO.

Recent signals:
- Churn is concentrated in the SMB tier (60% of logo churn, 15% of revenue),
  and the #1 verbatim complaint in support tickets is "building a dashboard
  takes too long / requires our data team."
- A competitor, "Lumen," just launched an "auto-insight" feature (AI
  auto-generates dashboards from a plain-English question) and is getting
  analyst and Twitter/X buzz.
- Enterprise prospects increasingly ask for SOC2 Type II (in progress, ~6
  weeks out) and SSO/SAML (already shipped).
- Series D conversations start in ~9 months; the board wants a credible AI
  narrative.

Treat all of the above as ground truth. Do not invent additional company
facts (metrics, customer names, financials) beyond what's stated here — if
you need an assumption, flag it explicitly as an assumption.

## Task

Write your **monthly product update for the executive team / board packet**
(CEO, CFO, VP Sales, VP Eng, and the board will read this). This month:
- The SMB onboarding redesign (in progress) is 3 weeks behind its original
  ship date due to an unplanned data-model migration.
- SOC2 Type II audit is on track for completion in ~6 weeks.
- You made the roadmap tradeoff call to delay the AI "Ask Northlight"
  feature by one quarter in favor of the onboarding fix (assume this
  decision was already made and communicated verbally — this update is the
  written record).
- One enterprise deal ($180K ACV) is stalled specifically on the missing
  admin audit-log feature.

Your update must:
1. Lead with the headline / so-what, not a chronological log.
2. Give a honest, non-defensive explanation of the onboarding delay —
   including what caused it and what you're doing about it.
3. Reconnect the AI-delay decision to strategy so it doesn't read as
   "deprioritized AI" to a board worried about AI competitiveness.
4. Flag the stalled $180K deal and what's needed to unblock it.
5. End with a short "what to expect next month" section.

## Output format

Plain Markdown, 350–500 words, in the register of a written exec/board
update (not a slide deck, not a chat message). Use short sections/bullets
where that aids scanability, but this is a narrative update, not a raw
status table.
