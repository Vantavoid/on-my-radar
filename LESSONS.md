# On My Radar — Lessons Learned

This file is updated by the weekly audit (Sundays). The Newsdesk agent reads it before each edition to incorporate feedback.

---

## How This Works
1. Sunday audit runs, analyzes the past week's editions
2. `nextWeekFocus` directive from the audit gets appended here
3. Monday's Newsdesk run reads this file and adjusts accordingly
4. Over time, the pipeline self-improves based on accumulated lessons

---

## Weekly Directives

### Directive — 2026-06-11 (manual)

**Source URLs must be the actual story, never a listing page.**

- A `sourceUrl` of `cbsnews.com/tag/plane-crash` (or any `/tag/`, `/category/`, `/topic/`, `/search`, `/section`, `/author`, or bare homepage URL) is FORBIDDEN — it drops the reader on a feed, not the article. Lee flagged a LaGuardia jet/fire-truck story that linked to a CBS tag page instead of the report.
- The Newsdesk now drops listing-page URLs from Brave results before you see them (`isListingPageUrl`), so candidates should already be clean — but if you only have a listing URL for a story, **drop the story** rather than link the listing. A missing item beats a broken link. B2B-quality bar.

### Directive — 2026-04-10 (manual)

**Freshness is everything. ATCs come here for news from the past 24–48h, not last week.**

- Hard cap: no story older than 48h from the brief date. If a story is undated or clearly old, skip it entirely.
- Iran/Gulf airspace closures and military activity affecting civil aviation are HIGH PRIORITY right now. Search specifically for these — they directly affect routing decisions and are exactly what controllers want to know about.
- X search is your early-warning system. Run it FIRST. Videos of airspace incidents or diversions have high value — always try to find an `xPostUrl` for stories involving active airspace events.

**Jobs: working controllers only, current listings only.**

- EXPERIENCED/RATED ATCOs only. No trainees, no bursaries, no cadets, no students.
- Posting date preference: prefer listings posted in the last 30 days, but
  an undated listing whose snippet clearly describes a CURRENT opening (uses
  present tense, names a specific role, mentions "apply now" / "closing date"
  / "we are recruiting" / "vacancy") is acceptable. Set `posted: null` in
  that case. Don't reject solely because a date isn't stamped.
- Never re-list a job that appeared in any recent edition (the ALREADY LISTED JOBS block tells you what to skip).
- TARGET: 3–8 verified, experienced-controller listings per edition. If
  search results contain 4+ snippets mentioning current openings, you must
  surface at least 2–3 of them. Empty `jobs: []` is a regression — Lee has
  flagged the lack of listings as a recurring problem.

### Week of Tue Apr 07 2026 00:00:00 GMT+0200 (Central Africa Time)

Restore core content pipeline immediately — ingest at least 5 verified articles per edition from primary sources (NTSB, SACAA, BEA) before publication, and populate jobs listings with a minimum of 3 current ATC-relevant vacancies.

### Week of Sun Apr 12 2026 00:00:00 GMT+0200 (Central Africa Time)

Diagnose and resolve the content pipeline failure immediately — no articles or jobs have been published across 5 consecutive editions, indicating a systemic ingestion, parsing, or publishing fault that must be fixed before any editorial quality work is meaningful.

### Week of Sun Apr 19 2026 00:00:00 GMT+0200 (Central Africa Time)

Restore the content pipeline immediately — populate every edition with a minimum of 5 audited articles sourced from primary safety authorities (NTSB, SACAA, BEA) and at least 3 verified ATC job listings before publication.
