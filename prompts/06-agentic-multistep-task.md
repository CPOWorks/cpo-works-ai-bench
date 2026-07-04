---
id: agentic-multistep-task
title: Agentic Multi-step Task
category: Agentic
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

## Raw inputs (messy, as pulled from three different internal tools)

**A. Support ticket export (last 30 days, top complaint themes, unsorted):**
```
theme,ticket_count,avg_csat,plan_tier
"dashboard setup too slow",188,2.1,SMB
"missing SSO option",4,3.0,Enterprise
"export to CSV broken",61,2.8,SMB
"want role-based permissions",22,3.4,Enterprise
"onboarding checklist confusing",145,2.3,SMB
"pricing confusion at renewal",37,3.1,Mid-Market
```

**B. Funnel snapshot (self-serve signup → activated, last 60 days):**
```
step,users_entering,users_completing
signup_form,2400,2400
email_verified,2400,2050
first_data_source_connected,2050,1230
first_dashboard_created,1230,410
week1_return_visit,410,301
```

**C. Competitor snippet (unverified, pulled from a sales call note, do not
treat as confirmed fact):**
"Lumen rep reportedly told our prospect their auto-insight feature is
'included free at every tier' and 'set up in under 2 minutes.'"

## Task — perform all steps, in order, showing your work for each

1. **Triage**: From input A, identify the single highest-impact SMB-tier
   complaint theme, using a simple impact score you define (state your
   formula) that combines ticket volume and CSAT severity. Show the
   calculation.
2. **Diagnose**: From input B, compute the conversion rate for each funnel
   step and identify the single biggest drop-off point. State the
   percentage.
3. **Connect**: Explain, in 2-3 sentences, whether the biggest support
   complaint (step 1) and the biggest funnel drop-off (step 2) point to the
   same underlying problem or two different problems — and say which is
   true and why.
4. **Handle the unverified claim**: Decide how much weight input C should
   get in your recommendation, given it's unverified secondhand
   information. State your reasoning explicitly rather than silently
   ignoring or silently trusting it.
5. **Recommend**: Give one specific, scoped product recommendation for next
   sprint that addresses the root cause identified in step 3.
6. **Draft the artifact**: Write a 4-line Slack update to the product team
   announcing this recommendation, referencing the actual numbers from
   steps 1-2.

## Output format

Markdown with a clearly numbered section per step (1-6). Do not skip steps
or merge them — the scoring rubric checks each step's reasoning
individually. Show numeric work, not just conclusions.
