# Changelog — moviePortal

---

## Session: 2026-10-24

### Human Understanding
The movie search was silently doing nothing when Elasticsearch crashed or returned an error — users would just get an empty results page with no explanation. We fixed it so the app automatically falls back to searching the regular database whenever Elasticsearch has any problem (crash, timeout, error response, or just no results).

We also found that the database sync script was using hardcoded passwords directly in the code (a security risk if the file is ever shared), and the recommendations page had a bug where it was asking for a column that doesn't exist in the database.

---

### Technical Changes

#### Commit `1b9eb2b` — 2026-10-24
**ES HTTP 500 now falls back to Postgres; search fallback tests**

| File | Change |
|------|--------|
| `app/api/movies/search/route.ts` | Added `if (!esRes.ok) throw new Error(...)` — previously only network exceptions triggered the catch block; a 500 response from ES would silently return empty results |
| `app/api/movies/search/route.ts` | ES URL now reads from `process.env.ELASTICSEARCH_URL` with `localhost:9200` fallback |
| `__tests__/search-route.test.ts` | New file — 5 Jest tests covering: ES 200 ok, ES 500, ES 503, connection refused (ECONNREFUSED), AbortError timeout |
| `package.json` | Added `jest`, `ts-jest`, `@types/jest` dev dependencies; added `"test"` script |
| `README.md` | Removed "Enterprise Architecture", "production-ready, highly scalable" — replaced with accurate description; clarified ES indexing is a manual one-shot batch script |

---

#### Commit `abd45b6` — 2026-10-24
**ES URL env var, recommendations SQL columns, sync-elastic hardcoded credentials**

| File | Change |
|------|--------|
| `sync-elastic.js` | DB credentials (`user`, `host`, `database`, `password`, `port`) now read from env vars (`DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`) — previously hardcoded as `keycloak`/`password`/`moviedb` |
| `sync-elastic.js` | Each index request now checks `indexRes.ok` before counting as success — previously a failed HTTP request was counted as success |
| `sync-elastic.js` | ES URL reads from `ELASTICSEARCH_URL` env var |
| `app/api/movies/recommendations/route.ts` | Replaced all `average_rating` references with `vote_average` to match the actual `movies` table schema — the old column name caused GROUP BY and ORDER BY errors at runtime |
| `app/api/movies/recommendations/route.ts` | TMDB mapping now uses `vote_average` key consistently |

---

#### Commit `7910f37` — 2026-10-24
**clearTimeout leak, empty ES fallback, TMDB error handling, test coverage**

| File | Change |
|------|--------|
| `app/api/movies/search/route.ts` | Moved `clearTimeout(timeoutId)` into a `finally` block — previously only ran on the happy path; if fetch threw, the timer leaked |
| `app/api/movies/search/route.ts` | Added empty-hits fallback: if ES returns 200 but zero results, triggers Postgres search — useful when ES index is stale or not yet populated |
| `app/api/movies/search/route.ts` | TMDB regional and people fetches now log `401` (bad API key) and `429` (rate limit) explicitly instead of silently ignoring non-200 responses |
| `__tests__/search-route.test.ts` | Test helper updated to mirror production fix (finally + empty-hits branch); 6th test added for empty ES hits → Postgres fallback (6 tests total) |

---

### Required Environment Variables

```env
ELASTICSEARCH_URL=http://localhost:9200
TMDB_API_KEY=<your TMDB key>
DB_USER=postgres
DB_HOST=localhost
DB_NAME=moviedb
DB_PASSWORD=<your password>
DB_PORT=5432
```

---

### Previous Commits (pre-session)

| Commit | Description |
|--------|-------------|
| `646b5e6` | Initial project upload |
| `f1f9de7` | README with operation guide and file architecture |
| `60831ac` | First commit |
