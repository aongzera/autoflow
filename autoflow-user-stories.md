# AutoFlow — User Stories

> **Actor note:** The real users are the **three office staff**. Mechanics and the shop owner will not use software — they use LINE and paper only. Stories are written from the office-staff seat except where a mechanic's LINE behavior is what drives the requirement.
>
> **How matching actually works (important):** A `RoutingSession` is keyed per `(lineGroupId, lineSenderId)`. So typing a plate only auto-matches **that same sender's** following photos. When the office types a plate and then sends photos, those match. Mechanic photos (a different sender, no plate) do **not** match the office's session — they fall to the inbox and get assigned by drag (1c). That's why 1a and 1c are both heavily used.
>
> **What "open" means:** A claim is **open from the moment office staff create it** (2a) and stays open until it's ended — reaching the **`DONE`** stage, or being `CANCELLED` or soft-deleted. Only open claims are valid match targets (1a/1c) and only open claims count toward the "2+ open claims" guard.

---

## MVP (target: October)

### F0 — LINE Webhook Ingest *(foundation — nothing else works without it)*

**As** office staff,
**I want** every photo sent in our LINE groups captured and stored automatically the moment it arrives,
**so that** no photo is ever lost and all of them are available for the router to file.

**Acceptance Criteria:**
- The webhook endpoint verifies the `x-line-signature` header and rejects unsigned or forged requests (401) before doing any work.
- It responds **200 immediately** (within LINE's timeout), then does the download/persist work asynchronously — LINE only cares that the POST was received.
- The image binary is downloaded from LINE's content endpoint **promptly**, because the content URL is short-lived and expires.
- The image is persisted to **Cloudflare R2** and a `Photo` row is created (`matchStatus = UNMATCHED`, `emcsStatus = PENDING`), capturing `lineGroupId`, `lineSenderId`, and timestamp for later routing and burst clustering.
- **Idempotent on redelivery:** LINE may retry a webhook; the same message/event id must not create a duplicate photo.
- Only image messages are ingested here; text messages are passed to the router for plate detection (1a), other message types are ignored.

---

### F1 — LINE Photo Router

#### 1a. Office staff — plate-typing flow
**As** office staff,
**I want** to type a plate number in the LINE group and then send my photos,
**so that** they auto-attach to the right open claim without manual filing.

**Acceptance Criteria:**
- A plate-text message opens a `RoutingSession` for that sender in that group (unique per group+sender; a new plate upserts / overwrites the old session).
- Photos from that same sender within the sliding **10-minute** window auto-attach to the resolved claim; each matched photo refreshes the window.
- The bot replies in the group: **✅** naming the customer and car when the plate matches an open claim, or **❌** when there is no open claim for that plate.
- **Guard:** if a plate is ambiguous — **two or more open claims**, including the same plate number registered in different provinces — photos are never auto-routed; they go to the inbox instead (auto-matching the wrong claim fails dangerously; the inbox fails safely). No province prompt is needed — ambiguity just falls to the inbox.

---

#### 1b. Mechanics — no-plate flow
**As a** mechanic,
**I want** to just send photos in LINE without typing anything,
**so that** I don't have to change how I already work.

**Acceptance Criteria:**
- Photos with no active routing session fall into the **unmatched inbox**, clustered into **bursts** by `lineSenderId` and time gap (new burst when the gap exceeds ~10 min).
- Mechanics never handle any correction step — the inbox is an office-only surface.
- Degrades gracefully: overlapping or interrupted bursts still cluster into something reviewable rather than being dropped.

---

#### 1c. Office staff — assign unmatched bursts
**As** office staff,
**I want** to drag a whole unmatched burst onto an open claim,
**so that** mechanic photos that arrived without a plate still get filed, without anyone re-sending.

**Acceptance Criteria:**
- The inbox shows **bursts** (whole clusters, e.g. "ช่าง · 14:32 · 8 photos"), so a burst is assigned in one drag, not photo-by-photo.
- Dropping a burst onto an open claim re-matches every photo in it and appends them (flips `matchStatus`); the burst leaves the inbox.
- A burst can be **split**: if one cluster actually contains photos of two different cars, office staff can select a subset (or pull individual photos out) and assign each part to its own claim; the remainder stays in the inbox.
- Claims themselves are created separately by office staff at intake (see 2a) — dragging assigns to an **existing** open claim, it does not create one.

---

#### 1d. Office staff — correct a wrong assignment
**As** office staff,
**I want** to move photos off a claim they were wrongly attached to — onto the right claim or back to the inbox,
**so that** a mis-route (the design's single most dangerous failure) can always be undone safely.

**Acceptance Criteria:**
- Any matched photo or burst can be reassigned to a different open claim, or sent back to the unmatched inbox (re-opening `matchStatus` to `UNMATCHED`).
- Works for both auto-matched (1a) and manually dragged (1c) photos.
- For a photo **not yet pushed** to EMCS, this is a pure local re-file.
- **Guard for already-pushed photos:** if a photo is already `UPLOADED` to EMCS, moving it locally would desync from EMCS — so reassignment is blocked (consistent with 2c); the fix has to happen in EMCS.
- The action is logged (who moved what, when), since wrong-claim assignment has insurance/legal consequences.

---

### F2 — Claim Record *(AutoFlow's own record — distinct from the EMCS claim)*

#### 2a. Create (at intake)
**As** office staff,
**I want** to open a claim record (customer, vehicle/plate, insurer) when a car comes in,
**so that** there is an open claim for the router to match photos against.

**Acceptance Criteria:**
- A claim is created by office staff via the thin claim board — it is **not** auto-created from an incoming photo.
- The record captures plate, customer/vehicle, timestamp, and insurer when known — enough to later drive the EMCS push.
- Until an open claim exists for a plate, photos for that plate get **❌** / fall to the inbox.

---

#### 2b. Update (append photos + advance stage)
**As** office staff,
**I want** matched photos to append to the existing open claim, and to move the claim through its stages myself,
**so that** one case stays as one record and I stay in control of where it sits in the process.

**Acceptance Criteria:**
- Matched photos (from routing in 1a or a dragged burst in 1c) append to the open claim for that plate.
- Each photo carries its own `matchStatus` (routing side) and `emcsStatus` (push side), which advance **automatically** as the pipelines run.
- **Claim stage transitions are manual for now** — office staff move a claim from one stage to the next by hand; nothing (not even an EMCS-push confirmation) advances the claim stage on its own. (Auto-advancement can be revisited later.)
- Appending never overwrites metadata captured at creation.

---

#### 2c. Soft delete
**As** office staff,
**I want** to soft-delete a claim (mistakes, duplicates, test entries),
**so that** it disappears from my working views without losing the data or breaking anything attached to it.

**Acceptance Criteria:**
- **Blocked after EMCS sync:** soft-delete is refused (not even offered) if the claim has an `emcsClaimRef` or any photo already `UPLOADED` to EMCS — hiding it locally while EMCS still holds the data would desync AutoFlow from the insurer's system. Such a claim is closed via the `CANCELLED` stage or handled in EMCS directly, never soft-deleted.
- Soft delete sets a flag/timestamp (e.g. `deletedAt`) rather than removing the row — the record is retained in the database for audit, but **there is no restore UI**: soft-delete is hide-only from the office's side (recovery, if ever needed, is a developer/DB task).
- Soft-deleted claims are hidden from the default claim board, lists, and are **not valid match targets** for the router (a deleted claim can't be auto-matched or dragged onto).
- **Distinct from the `CANCELLED` stage:** `CANCELLED` is a business outcome (dead deal you still want to see in history); soft delete is "remove from view," for records that shouldn't have existed.
- A soft-deleted claim no longer counts toward the "2+ open claims" guard in 1a — so deleting a duplicate unblocks auto-routing for that plate.
- Photos attached to a soft-deleted claim are **hidden along with the claim** (they stay linked, not detached to the inbox).

> **Implementation note:** Since a *soft* delete won't trigger the `Photo` `onDelete: SetNull` FK rule, hiding is handled explicitly — the photos keep their `claimId` and are filtered out of views by the claim's `deletedAt`, rather than being nulled or re-queued. Handle this in the same `photoRouting.ts` path.

---

### F3 — EMCS Photo Push *(Puppeteer worker)*

**As** office staff,
**I want** to click "push" and have the worker upload a claim's pending photos into EMCS for me,
**so that** I stop downloading from LINE and re-uploading by hand.

**Acceptance Criteria:**
- Clicking push inserts an `EmcsJob` row (`QUEUED`) and returns immediately; a separate worker process polls the table and does the browser work.
- **Push is per stage:** office pushes a stage's photos as they become ready, so one claim is pushed several times over its life (EMCS is touched ~5× per claim). Each push is its own `EmcsJob` covering only that claim's still-`PENDING` photos, so the per-stage granularity falls out of the idempotency rule below for free; the claim view shows how much has been pushed so far.
- The worker defines its work as "all photos still `PENDING`" (queried at run time, not a fixed list baked into the job) and flips each photo to `UPLOADED` the instant EMCS confirms it — so retries never double-upload (**idempotent**).
- The Puppeteer flow handles the real EMCS gauntlet: multi-screen login, plate-based search to reach the encrypted claim URL, the iframe upload panel, the required photo-type dropdown, and the JS `alert()` confirmation.
- The worker authenticates with a **single shared shop EMCS account** (one login for the whole shop, not per-staff); credentials are held as a server-side secret and the worker re-logs in automatically when the EMCS session expires. (Trade-off: EMCS actions aren't attributable to an individual staff member — acceptable for now, but note it against the deferred auth/roles work.)
- Thai specifics handled without manual correction: Buddhist-calendar offset (+543), Thai insurer dropdown values, JSON arrays for checkbox fields.
- A job ends `DONE`, `PARTIAL`, or `FAILED`; on failure (session timeout, plate not found) it flags for **manual retry** rather than dying silently.
- **Fallback:** if EMCS blocks automation, the worker prepares everything and opens EMCS at the right page for a human to click upload.

> **Scope note:** The original MVP was **`PUSH_PHOTOS` only**, refusing a push when the claim had no `emcsClaimRef`. **Decision: `CREATE_CLAIM` is IN the October MVP** — the worker creates the EMCS claim itself when one doesn't exist yet, and the old "refuse push if no `emcsClaimRef`" block is removed. Trade-off to respect: creating a claim in the insurer's system is heavier and less reversible than a photo upload, so this path needs careful failure handling (below).

#### 3b. Create the EMCS claim via Puppeteer *(now in MVP)*
**As** office staff,
**I want** the worker to create the claim in EMCS when it doesn't exist yet,
**so that** I never have to open EMCS myself to start a claim before photos can go up.

**Acceptance Criteria:**
- When a claim has no `emcsClaimRef`, the worker drives EMCS's own claim-creation form (same Thai-specifics handling as above) and stores the returned reference.
- Only after a reference exists does the push proceed — this replaces the old "refuse push if no `emcsClaimRef`" behavior.
- **Safety:** if creation fails or is ambiguous (e.g. EMCS already has a claim for that plate), the job stops and flags for manual handling rather than risk creating a duplicate claim in the insurer's system.

---

## Later

### 4. Claim Status Board *(full version — postponed to December)*
**As the** owner or office staff,
**I want** a visual board showing where each claim stands (photos received → routed → pushed → confirmed) with a priority flag,
**so that** I can see stuck claims at a glance without asking staff or digging through LINE.

**Acceptance Criteria:**
- Rolls up per-photo `matchStatus` / `emcsStatus` to a claim-level status.
- `isPriority` flag, set by office on the owner's verbal instruction (his priority-control surface).
- The **thin** claim CRUD needed just to hang photos and push jobs on is already in the MVP (via F2) — this story is the richer visual board only.

---

### 5. Intake & Document Generator *(post-MVP — F4, value uncertain)*
**As** office staff,
**I want** claim data turned into the shop's printed paperwork automatically,
**so that** intake produces structured data and ready-to-sign documents instead of loose paper.

**Acceptance Criteria:**
- Pre-filled PDFs (intake form, appointment slip, job sheet) generated from claim data via **pdf-lib**.
- Customer e-signature captured on iPad Safari via **signature_pad** (legally valid under Thailand's Electronic Transactions Act §9), with a paper-print fallback.
- Vehicle-condition snapshot (scratches marked on a body diagram + signature) for complaint / liability protection.

> **Note:** You flagged F4 as uncertain — whether it actually speeds intake up vs. just adding a digitize-then-file step. Worth validating with staff before building.
