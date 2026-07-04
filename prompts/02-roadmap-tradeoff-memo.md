---
id: roadmap-tradeoff-memo
title: Roadmap Tradeoff Memo
category: Roadmap
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

Engineering capacity for next quarter is fixed at **roughly 3 senior-engineer-
quarters** (i.e., you can fund one of the options below, not all three).
Write a **roadmap tradeoff memo** to the exec team recommending which one to
fund next quarter, choosing among:

- **Option A — "Ask Northlight"**: the NL-query/auto-insight feature (AI
  narrative + competitive parity with Lumen).
- **Option B — SMB Onboarding Overhaul**: rebuild the SMB self-serve
  onboarding flow to directly cut the #1 churn complaint.
- **Option C — SOC2 Type II hardening + enterprise admin controls**
  (audit logs, granular roles): unblocks a set of stalled enterprise deals.

Your memo must:
1. State a clear recommendation up front (not buried at the end).
2. Give the tradeoff reasoning for each option: expected impact, who it
   helps, key risk, and rough confidence level.
3. Explicitly say what you are choosing *not* to do this quarter and why
   that's an acceptable near-term cost.
4. Address the board/Series D pressure honestly — including if your
   recommendation is *not* the AI feature, explain how you'd still tell a
   credible AI story.
5. Name what would change your recommendation (a decision-reversal
   trigger/threshold).

## Output format

Plain Markdown memo, 400–600 words, written for a CEO + CFO + VP Eng
audience who will read it in under 3 minutes. Use a short "Recommendation"
line at the top, then structured reasoning below.
