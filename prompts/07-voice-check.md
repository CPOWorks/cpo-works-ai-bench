---
id: voice-check
title: Voice Check
category: Voice
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

## Reference voice sample (the CPO's actual writing — match this voice)

> "Look, I'll be straight with you: we said Q2 for SSO and we're not going
> to make it, full stop. Here's exactly why, here's what I'm doing about
> it, and here's the new date I'd actually bet money on. I'd rather tell
> you that once than tell you 'soon' four times.
>
> One more thing — I know the instinct here is to add a caveat to every
> sentence. Resist it. If we're not sure, say we're not sure, once,
> clearly, and move on. Nobody's ever complained that an update was too
> direct."

## Task

Using the reference voice sample above as your style guide, rewrite the
following bland, hedge-heavy draft announcement into the CPO's actual voice.
Keep every factual claim in the draft — do not add or remove information,
only change how it's said.

**Draft to rewrite:**

> "We wanted to provide a brief update regarding the status of the SOC2
> Type II certification initiative. As many of you may be aware, this has
> been a priority for several quarters, and we believe we are generally
> on track, though there could potentially be some minor adjustments to
> the timeline depending on various factors that may arise during the
> audit process. We anticipate that things should hopefully be finalized
> in the coming weeks, and we will try to keep everyone updated as
> appropriate. In the meantime, we appreciate everyone's patience and
> understanding as we work through this together as a team."

## Output format

1. The rewritten announcement (Markdown, under 120 words).
2. A short "## Voice notes" section (3-5 bullets) naming the *specific*
   patterns you removed (hedging phrases, passive voice, filler) and the
   *specific* patterns you added to match the reference sample. Be precise
   — "made it more direct" is not an acceptable bullet.
