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

## S3 — learn-flow scoring (shipped 2026-09-29)
Line-reveal/progress/scoring logic extracted from the learn flow into
pure solvers + tests (mirrors the avatar-engine pattern).
Shipped as lib/learn.ts: deterministic length-preserving line masking
(full / first-letters / hidden), pinned guess normalization (NFC,
lowercase, typographic apostrophes folded, punctuation becomes word
separators, accents never transliterated), session progression with
first-try credit (1.0 first try / 0.5 otherwise, rounded 0-100) and
mastery mapping into SongState (applyMastery). The plan's "extract from
the learn flow" assumption was off — the page was a placeholder card
grid — so the engine was authored fresh and the learn page now runs a
real minimal session (cue, guess input, hint after 2 misses,
tap-to-reveal fallback, running score, completion screen) persisting
mastered lines via songs-storage.

## S4 — progress stats (shipped 2026-09-29)
Per-song + aggregate progress (lib/progress.ts) with tests.
songProgress maps a SongState onto pinned mastery tiers over learned-line
percentage — 'new' (0) / 'started' (>0, <50%) / 'partial' (>=50%, <100%) /
'mastered' (100%) — counts only indices that exist in the song's lyrics
(stale persisted indices are ignored), passes `updatedAt` through as a
nullable lastPracticed (0 = never practiced), and never reads the clock.
aggregateProgress sums across the catalog (songsStarted/songsMastered/
totalLinesLearned/overallPct, rounded like every other percentage here);
vocabulary stays a sibling field composed verbatim from computeProgress —
lyrics and vocabulary are reported side by side, never force-merged. The
progress page is now real: aggregate header, per-song rows with progress
bars and last-practiced dates (links into the learn flow), and an empty
state when nothing is stored yet.

## S5 — polish
Copy pass + a11y labels on the extracted surfaces.

Rules: tests green before every commit; pull --rebase; never force-push.
