# AutoFlow — Sprint Plan

*Solo dev. Estimates are rough **ideal focused hours** (not calendar time). Trim from the bottom of each sprint if hours run short — scope is the variable, the sprint goal is not.*

---

## Definition of Done *(applied to every story)*
- Compiles / type-checks clean.
- Happy-path test **+ at least one failure-mode test**.
- Prisma migration committed (if the schema was touched).
- Meaningful error logging on failure paths.
- Puppeteer work tested against **fixtures**, not the live portal per-story; **one** live contract check per sprint.

---

## Sprint 1 — Oct 1–14 · *Vertical Slice: LINE → EMCS*

**Sprint goal:** A photo sent in LINE with a plate gets matched to an open claim and pushed into EMCS — the full happy path, end to end.

**Capacity assumption:** ~10–15 hrs/week → ~20–30 hrs. The task total below lands near the top of that, so this sprint is *full* — freeze scope and use the trim levers if you fall behind.

### Before Oct 1 (prep — not sprint work)
- [x] EMCS push tested & working, with a real test claim to push against ✅ *(done)*
- [ ] Project structure / controllers scaffolded (kill the restart friction — day 1 should be router logic, not setup)
- [ ] LINE Messaging API channel + public webhook URL live
- [ ] Cloudflare R2 bucket + credentials ready

### F0 — LINE Webhook Ingest — *~8–12h*
- Webhook route + `x-line-signature` verification + fast 200 — 2–3h
- Async download of image binary from LINE content endpoint (before URL expires) — 2–3h
- Persist to R2 + create `Photo` row (`UNMATCHED`/`PENDING`, capture group/sender/timestamp) — 2–3h
- Idempotency guard on redelivery (dedupe by message/event id) — 1–2h
- Message-type filter (image → ingest, text → router, else ignore) — 1h

### 1a — Plate-typing routing — *~8–14h*
- Thai plate detection from text (regex/parse) — 2–4h *(highest-variance task here)*
- `RoutingSession` upsert per (group, sender) + 10-min sliding window, refresh on match — 2–3h
- Resolve plate → open claim, attach photo atomically (`photoRouting` module, flip `matchStatus`) — 2–3h
- Guard: 2+ open claims (incl. province collision) → inbox, no auto-route — 1–2h
- Bot reply: ✅ (name customer + car) / ❌ (no open claim) — 1–2h

### 1b — Minimal (cluster + persist, no UI) — *~3–4h*
- Burst clustering query: group unmatched by sender + time gap (>10 min = new burst) — 2–3h
- Confirm unmatched photos persist as `UNMATCHED` (assign-UI is next sprint) — 1h

### F3 — EMCS Photo Push (push-only, proven flow) — *~12–20h*
- `EmcsJob` enqueue on "push" (`QUEUED`) + return immediately — 2–3h
- Worker: poll `QUEUED`, run Puppeteer — 2–3h
- Wire in spike upload flow (login, plate search, iframe, photo-type dropdown, `alert()` handler) — 3–6h *(vibe draft + debug; lower because the spike is done)*
- Per-photo `emcsStatus` → `UPLOADED` on confirm; work = all `PENDING` (idempotent) — 2–3h
- Job end states `DONE`/`PARTIAL`/`FAILED` + manual-retry flag — 2–3h
- Shared-account auth + re-login on session expiry — 1–2h

**Rough total: ~31–50h.** Above a comfortable 2-week part-time budget, so treat F3 as the swing factor.

### Trim levers (if behind, cut in this order)
1. ✅/❌ bot reply polish → log instead of reply for now.
2. 1b clustering → just persist unmatched flat; move clustering to sprint 2.
3. `PARTIAL` handling → collapse to `DONE`/`FAILED` only for now.

*Demo needs only F0 + 1a + F3. Everything in 1b is a safety net, not demo-critical.*

---

## Sprint 2 — Oct 14 – Nov 7 · *Make it usable* (suggested)

**Sprint goal:** Office staff can create claims and file the photos that didn't auto-match, and the EMCS create-claim path is de-risked — moving AutoFlow from "demo" to "usable at the desk."

**Capacity assumption:** LONGER calendar (~3.5 wks) but **fewer** AutoFlow hours — SE test plan (Nov 16) and Software Architecture both peak now. Plan for ~6–10 hrs/week → ~25–35 hrs. So: fewer committed points than a normal sprint, with deliberate room for easy frontend.

### Suggested commit

**2a — Claim create (thin board + intake form)** — *easy frontend* — *~6–10h*
- Why now: sprint 1 matched against seeded claims. For real use, staff need to create a claim. This is the *easy* frontend you wanted — a form, not drag-drop.
- Tasks: create-claim form UI · POST endpoint · open-claims list view.

**1c — Assign unmatched — EASY version** — *easy frontend* — *~6–10h*
- Ship **list + click-to-assign** first, not drag-drop. Show bursts as cards, click a burst → pick a claim → assign (reuse `photoRouting`). Burst-split = select a subset.
- Polished drag-drop stays deferred to a later sprint.

**3b — CREATE_CLAIM: recon spike → implement** — *backend* — *~10–16h*
- **Timebox a ~4h recon spike first** — map the creation form (fields, Buddhist date, insurer dropdown, JSON checkbox arrays, duplicate behavior). Don't commit the build estimate until recon is done.
- Then implement + the safety guard (stop & flag on ambiguous/duplicate rather than create a bogus claim).

### Stretch (pull in only if ahead)
**1d — Wrong-assignment correction** — *~4–8h*
- Reassign/move photos, re-open `matchStatus`, `UPLOADED` guard, audit log. Safe to carry to the next sprint.

### Explicitly *not* this sprint
- Polished drag-drop inbox (easy click version covers the need for now).
- Full claim status board (that's the December feature).
- Auth / login for office staff — real gap, but park it until the core workflow is proven.
