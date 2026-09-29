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

## S5 — polish (shipped 2026-09-29)
Copy pass + a11y labels on the extracted surfaces.
"Coming soon" stub copy removed everywhere it survived (landing feature
grid, songs list, song detail, vocabulary) and replaced with copy that
describes the real surfaces; brand casing unified to "LyricLearn"
(landing h1); landing gained its own metadata title, with a title
template in layout.tsx. A11y: every page renders its content inside a
<main> landmark; decorative gradients and emoji are aria-hidden; back
links carry specific aria-labels ("Back to home", "Back to <song>");
the learn page announces line/score changes and check feedback via
aria-live="polite" (completion card included) and the cue-mode toggle
exposes aria-pressed; progress bars gained aria-valuetext (percent +
tier) and per-song rows concise link names. Flagged, deliberately not
changed: --ios-label3 (#8E8E93) on --ios-bg2 is ~3.3:1 — passes only for
large text, so the 12-15px secondary copy is an AA contrast miss that
needs a token decision; the learn guess input sets outline:'none' with
no replacement focus indicator; songs/[id] and vocab still render the
placeholder card grids from lib (retiring placeholderSongCards/
placeholderVocabCards is a data-layer slice, not polish). Campaign
plan complete: S1-S5 shipped.

Rules: tests green before every commit; pull --rebase; never force-push.
