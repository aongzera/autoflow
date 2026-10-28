# AutoFlow

Internal tool for a car repair shop's office staff. Mechanics and the owner only use LINE; AutoFlow captures the photos they send to LINE groups, files them against the right insurance claim, and prepares them for upload to the insurer's EMCS system.

## What it does

- **LINE webhook ingest** – verifies the LINE signature, downloads each image promptly, stores it in Cloudflare R2 and records a `Photo` row (idempotent on redelivery).
- **Photo router** – staff type a plate number in the LINE group, then send photos; they auto-attach to the matching open claim within a 10-minute sliding window. Ambiguous or unmatched photos go to an inbox for manual assignment.
- **Claim records** – customers, vehicles, insurers and claims, kept separate from the EMCS claim.

See [autoflow-user-stories.md](autoflow-user-stories.md) for the full stories and [autoflow-sprint-plan.md](autoflow-sprint-plan.md) for the plan.

## Tech stack

| Part | Stack |
| --- | --- |
| `client/` | React 19, TypeScript, Vite, Tailwind CSS 4, React Router |
| `server/` | Node, Express 5, TypeScript, Prisma 7 (PostgreSQL), LINE Messaging API, Cloudflare R2 (S3 SDK) |

## Getting started

Requires Node.js and a PostgreSQL database.

```bash
# server
cd server
npm install
# create .env with the variables below
npx prisma migrate deploy
npx prisma generate    # Prisma 7 does not regenerate the client automatically
npm run dev            # http://localhost:3000

# client (in another terminal)
cd client
npm install
npm run dev
```

### Server environment variables (`server/.env`)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (pooled, used by the app) |
| `DIRECT_URL` | Direct PostgreSQL connection (used by Prisma migrations) |
| `LINE_CHANNEL_SECRET` | Verifies LINE webhook signatures |
| `CHANNEL_ACCESS_TOKEN` | LINE Messaging API token (downloads images, sends replies) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Cloudflare R2 credentials |
| `R2_BUCKET` | Name of the R2 bucket photos are uploaded to |

The LINE webhook endpoint is `POST /webhooks`; the REST API lives under `/api/v1`.

### Testing the LINE webhook locally

LINE can only call a public HTTPS URL, so expose your local server with a tunnel:

```bash
cd server && npm run dev
cloudflared tunnel --url http://localhost:3000     # in another terminal
```

Paste `https://<tunnel-host>/webhooks` into the **Webhook URL** field of your LINE Messaging API channel, press **Verify**, and send a photo to the bot. The quick-tunnel URL changes every time it restarts, so update it in the LINE console each session.

Notes:

- The `@aws-sdk/client-s3` version is pinned to `3.726.1`; newer versions (3.729.0+) break against R2.
- `/webhooks` is mounted before `express.json()` on purpose: the signature check needs the raw request body.
- Photos are stored in R2 under `line/<messageId>.jpg`; the `Photo` row keeps that key in `storageUrl`, not the file.

## Status

Work in progress (MVP target: October).
