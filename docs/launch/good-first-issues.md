# Good first issues (ready to paste into GitHub)

Label each one `good first issue` (and `enhancement` or `docs`).

---

## 1. Add a date-range picker component
**Why:** most business apps filter lists by date ("this month", "last 7 days").
**What:** a `DateRange` component in `src/components/` with presets (Today, Last 7 days, This month, Last month, Custom) that reads and writes `?from=&to=` search params. It uses shadcn `popover`, plus plain `<input type="date">` for the custom range.
**Done when:** it's used on an example page, works at 390 px and in dark mode, and has no CSP errors in `npm run test:e2e`.

## 2. Scaffolding for translatable strings
**Why:** many apps need a second language later (e.g. Urdu, Arabic). Preparing strings early makes that cheap.
**What:** a tiny `t()` helper in `src/lib/i18n.ts` with an English dictionary, used in the auth pages. Documented in AGENTS.md. Include an RTL note (`dir="rtl"`, logical Tailwind classes such as `ms-`/`me-`).
**Done when:** the auth pages render the same as before and `npm run check` passes.

## 3. CSV export helper
**Why:** owners always ask to "download this list in Excel".
**What:** `toCsv(rows, columns)` in `shared/csv.ts` (escaping commas, quotes and newlines), plus a `downloadCsv()` browser helper. Unit tests for escaping.
**Done when:** the tests cover commas, quotes, newlines and UTF-8 (a BOM for Excel).

## 4. An example Cron Trigger
**Why:** scheduled jobs (reminders, cleanup) are a common next step, and they're free on Workers.
**What:** a commented `triggers.crons` entry in `wrangler.jsonc` and a `scheduled()` handler in `worker/index.ts` that deletes expired rows from `verification` and `rate_limit`. A test calls the handler directly.
**Done when:** `npx wrangler deploy --dry-run` succeeds and the test passes.

## 5. README translation
**Why:** Flarekit's first users include developers who read Urdu or Hindi first.
**What:** `docs/README.ur.md` (or another language you know well), with the Quick start and Deploy sections, linked from the main README.
**Done when:** the commands are copied exactly and the links work.
