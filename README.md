# Sawtooth Assessment App

Online cognitive tests for Sawtooth Brain Health Institute. Clients take the tests at home in a browser
while a clinician watches over a video call. Clinicians sign in to a dashboard to set up test sequences
and review results.

Built with TypeScript, React, Vite and Tailwind CSS, with Supabase for the database, sign-in, storage
and server functions.

## Getting started

Needs Node 24 and npm.

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase URL and publishable key
npm run dev
```

## Commands

```bash
npm run dev         # local dev server
npm run build       # production build
npm test            # unit tests (scoring and test wording)
npm run typecheck   # TypeScript check
npm run lint        # ESLint
```

## Where things are

- `src/client/`: the client's screens (opened from a link)
- `src/dashboard/`: the clinicians' dashboard
- `src/cognitive-tests/`: one folder per cognitive test, with its spec, wording, screens and scoring
- `src/shared/`: code used by both sides
- `supabase/`: database migrations and server functions

## Docs

- [CLAUDE.md](CLAUDE.md): how the app is built and the rules it follows
- [docs/ROADMAP.md](docs/ROADMAP.md): build phases and the current step
- [docs/DECISIONS.md](docs/DECISIONS.md): why things are the way they are
