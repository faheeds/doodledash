# Doodle Dash 🎨

A competitive drawing party game for kids ages 8-13. Draw fast, vote for the funniest, let the AI judge decide.

## Tech Stack
- **Mobile**: React Native + Expo
- **Web**: Next.js 14 (Vercel)
- **Backend**: Next.js API routes on Vercel
- **Realtime**: Supabase Realtime
- **Database**: Supabase PostgreSQL
- **AI Judge**: Anthropic Claude Sonnet 4.6
- **Drawing**: react-native-skia

## Monorepo Structure
```
apps/
  web/      → Next.js web app + API routes
  mobile/   → React Native Expo app
packages/
  shared/   → Shared types and constants
supabase/
  migrations/ → Database schema
```

## Getting Started

### Prerequisites
- Node.js v20+
- Git

### Setup
1. Copy `.env.example` to `.env.local` in `apps/web` and fill in your keys
2. Copy `.env.example` to `.env` in `apps/mobile` and fill in your keys
3. Install dependencies: `npm install` in each app directory

### Run database migrations
Paste the contents of `supabase/migrations/001_initial_schema.sql` into your [Supabase SQL Editor](https://supabase.com/dashboard/project/ukhomzhkppnagttadzkv/sql/new) and click Run.

### Development
```bash
# Web
cd apps/web && npm run dev

# Mobile
cd apps/mobile && npx expo start
```

## Build Phases
- ✅ **Phase 0**: Foundation — monorepo, Vercel deploy, Supabase schema
- ⏳ **Phase 1**: Drawing MVP (single player canvas)
- ⏳ **Phase 2**: AI Judge + Moderation
- ⏳ **Phase 3**: Multiplayer Match
- ⏳ **Phase 4**: Sketchbooks 1-3 + Progression
- ⏳ **Phase 5**: Safety + Parent Dashboard
- ⏳ **Phase 6**: Polish + Beta Submission

## Live URLs
- **Web**: https://doodle-dash-9sxr77wip-doodle-dash-s-projects.vercel.app
