---
id: prototype-spec
title: Prototype Spec
category: Prototype
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

You want a **clickable-prototype-ready spec** for "Ask Northlight" (the
natural-language query box from the PRD task) that a product designer could
hand to Figma / a frontend engineer could build a throwaway prototype from
in under a week — no backend, mocked data is fine.

Produce:
1. **Core user flow** as a numbered step-by-step sequence (entry point →
   query input → result state → follow-up/refinement state → error/empty
   state). Cover at least 5 discrete screen/states.
2. **For each state**: what's on screen (components, not visual design —
   e.g. "query input with placeholder text + 3 example-question chips"),
   and the primary and secondary actions available.
3. **Explicit edge cases the prototype must handle**: ambiguous query,
   no-data-available, and a query the system can't answer.
4. **One annotated example** — a concrete sample question ("which
   onboarding step has the highest drop-off this month?") walked through
   the flow end to end with sample output content.
5. A short "what this prototype is deliberately NOT testing" note (e.g.,
   real data accuracy, load performance).

## Output format

Markdown. Use a numbered list for the flow and a sub-heading per state.
Length: 500–750 words. Write for a solo product designer who will build the
prototype alone — be concrete enough that they don't have to ping you with
follow-up questions for the core flow.
