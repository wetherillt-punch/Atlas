# ATLAS — Deployment Guide

## What this is
A focused financial command center: expense tracking, BHA time/invoicing, task management. 
One URL. One screen. Everything you need for your CPA and your sanity.

## Deploy in 10 minutes

### 1. Create a GitHub repo
```bash
# From wherever you keep projects:
mkdir atlas && cd atlas
# Copy all the files from this delivery into this folder
git init
git add .
git commit -m "ATLAS v1"
```

Push to GitHub:
```bash
gh repo create atlas --private --push
# OR manually create on github.com and:
git remote add origin https://github.com/YOUR_USERNAME/atlas.git
git push -u origin main
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI if you don't have it:
npm i -g vercel

# Link and deploy:
vercel link
vercel --prod
```

### 3. Add Vercel Postgres
1. Go to https://vercel.com/dashboard
2. Select your ATLAS project
3. Go to **Storage** tab → **Create Database** → **Postgres**
4. Follow the prompts (free tier is fine)
5. This auto-sets `POSTGRES_URL` and related env vars

### 4. Seed the database
```bash
# After Postgres is connected, pull env vars locally:
vercel env pull .env.local

# Install dependencies and run seed:
npm install
node lib/db-setup.mjs
```

### 5. Redeploy
```bash
vercel --prod
```

Done. Your ATLAS is live.

## What's included

- **Dashboard**: Financial overview across all entities, alerts, gaps, critical tasks
- **Expenses**: Full ledger, filter by entity, recurring expense verification
- **BHA Hours**: Time tracking, unbilled totals, one-click invoice generation
- **Tasks**: By project, click to complete, priority-sorted
- **Invoice Page**: Clean, printable, professional. Print → Save as PDF → email to client.

## File structure
```
atlas/
├── app/
│   ├── layout.js          — Root layout
│   ├── page.js            — Main dashboard (all tabs)
│   ├── globals.css        — Styles
│   ├── invoice/[id]/
│   │   └── page.js        — Printable invoice view
│   └── api/
│       ├── expenses/route.js  — CRUD expenses
│       ├── time/route.js      — CRUD time entries
│       ├── invoices/route.js  — Create invoices
│       ├── invoices/[id]/route.js — Invoice detail + status update
│       └── tasks/route.js     — CRUD tasks
├── lib/
│   └── db-setup.mjs       — Database schema + seed data
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

## Environment variables
```
# Auto-set by Vercel Postgres:
POSTGRES_URL=...
POSTGRES_PRISMA_URL=...
POSTGRES_URL_NON_POOLING=...
POSTGRES_USER=...
POSTGRES_HOST=...
POSTGRES_PASSWORD=...
POSTGRES_DATABASE=...
```

No API keys needed for v1. Calendar integration (Phase 2) will add Google OAuth.

## Future: Google Calendar (Phase 2)
After you've used v1 for 2 weeks and confirmed you want calendar integration:
1. Create Google Cloud project
2. Enable Calendar API
3. Create OAuth credentials
4. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Vercel env
5. I'll build the NextAuth integration and BHA meeting detection

## Updating
To change anything — add categories, modify entities, update recurring expenses:
1. Edit the relevant file
2. `git add . && git commit -m "update" && git push`
3. Vercel auto-deploys on push

To update the database seed or schema:
1. Edit `lib/db-setup.mjs`
2. Run `node lib/db-setup.mjs` locally (with .env.local)
