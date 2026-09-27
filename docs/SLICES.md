# LyricLearn — Campaign slice plan (authored 2026-09-27)

Research base: Turborepo (apps/web Next.js + packages/core,ui) with real
pages (songs list, song detail + learn flow, vocab, progress) but logic
lives inside page/client components — no extracted lib, no tests. The
quality-gate CI workflow exists and must stay green.

## S1 — foundation: test rig + first extraction (START HERE)
- Add vitest to apps/web (+ test script); CI gate picks it up.
- Survey components/ for the vocab/learn logic; extract ONE pure module
  (candidate: vocabulary/word-tracking) into lib/ with tests.
- Accept: vitest green, next build green, no page behavior change.

## S2 — songs data layer
Types + storage for songs/lyrics (lib/songs.ts) with tests; pages
consume the module.

## S3 — learn-flow scoring
Line-reveal/progress/scoring logic extracted from the learn flow into
pure solvers + tests (mirrors the avatar-engine pattern).

## S4 — progress stats
Per-song + aggregate progress (lib/progress.ts) with tests.

## S5 — polish
Copy pass + a11y labels on the extracted surfaces.

Rules: tests green before every commit; pull --rebase; never force-push.
