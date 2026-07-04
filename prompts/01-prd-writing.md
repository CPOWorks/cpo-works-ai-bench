---
id: prd-writing
title: PRD Writing
category: PRD
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

Write a **Product Requirements Document (PRD)** for a new feature:
**"Ask Northlight" — a natural-language query box that lets any SMB user type
a question like "which onboarding step has the highest drop-off this month?"
and get a chart + a one-sentence explanation, without building a dashboard
manually.**

Your PRD must include:
1. Problem statement (tied to the churn/support signal above)
2. Goals and explicit non-goals
3. Target user / primary persona
4. Success metrics (with a stated method for measuring each — not just names)
5. Scope for a v1 (what ships first) vs. explicitly deferred scope
6. Key risks/open questions (e.g., data accuracy of NL-to-query, cost of
   LLM calls at scale, abuse/misuse)
7. A rough phased rollout plan (not a full project plan — just phases)

## Output format

Plain Markdown, structured with headers. Target length: 600–900 words. Do not
pad with generic filler ("in today's fast-paced world...") — every sentence
should carry information a real CPO would use to make a decision or brief
the team.
