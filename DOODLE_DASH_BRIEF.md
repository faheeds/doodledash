DOODLE DASH — COWORK BUILD BRIEF
How To Use This Document

Do the "What You Set Up Once" section yourself (10-15 mins).
Save this entire document as DOODLE_DASH_BRIEF.md in a folder on your desktop.
Open Claude Desktop → switch to Cowork tab → create a new project called "Doodle Dash."
Add the folder to the project so Cowork can read this brief and write code in it.
Paste the "Kickoff Prompt" at the bottom into Cowork.
Cowork works phase-by-phase, pausing for approvals. You approve, it continues.


PART 1: What You Set Up Once (Before Cowork Starts)
These need a human because they involve account creation, payment, or 2FA. Each has a link and takes 1-3 minutes.
Required Accounts
AccountPurposeCostLinkGitHubCode hostingFreegithub.comVercelWeb hosting + backendFree tier fine to startvercel.comExpo (EAS)Mobile app buildsFree tier fineexpo.devApple DeveloperTestFlight/iOS$99/yeardeveloper.apple.comGoogle Play ConsoleAndroid testing$25 one-timeplay.google.com/consoleAnthropic APIAI judgePay-as-you-goconsole.anthropic.comSupabaseDatabase + auth + realtimeFree tier fine to startsupabase.comCloudflare R2 or AWS S3Drawing image storage~$0-5/mocloudflare.com
Things To Do Manually

Create a new GitHub repo called doodle-dash (private).
In Cowork settings, install the GitHub plugin and the Vercel plugin (both available in the Cowork plugin directory).
Generate API keys for: Anthropic, Supabase, Vercel, Expo. Save them in a file called secrets.txt in your project folder. Cowork will read these and put them in .env files (and never commit them).
Install Node.js (v20+) and Git on your machine. Cowork can install most things itself, but Node and Git are foundational.

Folder Structure To Create
Make this folder on your desktop:
DoodleDash/
  ├── DOODLE_DASH_BRIEF.md   ← this document
  ├── secrets.txt             ← your API keys
  └── (Cowork creates the rest)
Done. That's all the manual setup. From here, Cowork takes over.

PART 2: Product Specification
(Cowork should reference this section throughout the build.)
Game Overview
Doodle Dash is a competitive drawing party game for kids ages 8-13. 4-8 players get the same prompt, 60 seconds to draw it. AI judges score creativity, kids vote for funniest. Kids develop visual personality without artistic pressure.
Core Principles

Skill doesn't matter, personality does (AI judge rewards creativity over technical skill).
No chat, ever (emoji reactions only).
Auto-generated usernames (DragonChef47, SunnyPenguin).
Real-friend-codes only (no stranger discovery).
Cosmetics-only monetization, parent gates over $4.99.
AI moderation on every drawing before public display.

Core Match Flow

Prompt drops (3s)
Draw phase (60s)
Reveal parade (15s)
Vote phase (20s) — three categories: Most Creative, Funniest, Best Match
AI judging (5s)
Results screen (10s)

5 rounds = ~10 min match.
The 12 Sketchbooks (Levels)
#SketchbookThemeLevels1First Day DoodlesTutorial1-32Animal AnticsReal + made-up animals4-63Food FightFood with personality7-94Hero HQSuperhero design10-125Spooky-but-SillyCute Halloween13-156Around the WorldCultural celebration16-187Time TwistPast/future eras19-218Emotion LabFeelings as creatures22-249Invention JunctionSTEM creativity25-2710Story StudioMulti-panel comics29-3111Constraint CarnivalCreative limitations32-3412All-Star StudioEndgame, daily content35+
(Full prompt details and per-level mechanics are in our prior conversation; Cowork should ask if it needs the full spec.)
Drawing Tool Specs

6 brush sizes (chunky to thin)
16-color palette per level (varies by Sketchbook)
Bucket fill, eraser, undo (last 5 strokes)
One "magic stamp" per round (level-specific)
No layers, gradients, opacity (intentional simplicity)

Tech Stack
LayerTechnologyMobile appReact Native + Expo (one codebase, iOS + Android)Web companion (parent dashboard)Next.js 14 (deployed on Vercel)Backend APINext.js API routes on VercelRealtime multiplayerSupabase RealtimeDatabaseSupabase PostgresAuthSupabase Auth (email + Apple/Google sign-in)Drawing canvasreact-native-skiaImage storageCloudflare R2AI judgeAnthropic Claude API (Sonnet 4.6)AI moderationAnthropic Claude API + image classifierAnalyticsPostHog (free tier)Crash reportingSentry (free tier)CI/CDGitHub Actions → Vercel + EAS

PART 3: Phased Build Plan
Cowork should treat each phase as a milestone. After each phase, it should:

Commit and push to GitHub.
Deploy what's deployable.
Show you a working demo.
Wait for your approval before starting the next phase.

Phase 0: Foundation (Cowork's first session)
Goal: Repo set up, dependencies installed, "Hello World" deployed to Vercel.
Tasks:

Initialize git repo, connect to GitHub
Create monorepo structure (/apps/mobile, /apps/web, /packages/shared)
Initialize Next.js web app + React Native Expo app
Set up Supabase project, run schema migrations
Set up .env files from secrets.txt (never commit these)
Deploy a placeholder web page to Vercel
Get the mobile app running in Expo Go on your phone

Deliverable: Live Vercel URL showing "Doodle Dash — Coming Soon," and Expo QR code that loads a placeholder app on your phone.

Phase 1: Drawing MVP (Single Player) (Most fun, build first)
Goal: A drawable canvas. No multiplayer yet. Just: open app, see prompt, draw it, save to local gallery.
Tasks:

Build drawing canvas with react-native-skia (brushes, colors, undo, eraser, bucket fill)
Create the prompt system (start with 30 prompts from Sketchbook 1)
60-second timer UI
Local gallery (drawings saved to device)
Tutorial flow (Pip the Pencil intro)
Basic user profile (auto-generated username)

Deliverable: You can install the app via Expo Go, complete the tutorial, draw 5 prompts, see them in your gallery.

Phase 2: AI Judge + Moderation
Goal: Drawings get scored and moderated.
Tasks:

Backend endpoint: POST /api/judge — takes drawing image + prompt, returns score + feedback using Claude Sonnet 4.6
Backend endpoint: POST /api/moderate — checks drawing for inappropriate content before display
Calibrate the judge prompt to reward creativity over skill (this needs iteration)
Show judge feedback in results screen

Deliverable: After drawing, you get a score and a friendly comment like "Loved the surprise penguin!" Drawings that fail moderation get hidden with a friendly message.

Phase 3: Multiplayer Match (4-8 Players)
Goal: Real multiplayer, real-time.
Tasks:

Lobby system using Supabase Realtime (matchmaking, ready-up)
Bot players to fill empty slots (so a 1-player match still works)
Synchronized round flow (everyone sees the prompt at the same time)
Reveal parade with all drawings
Voting UI (three categories)
Results aggregation
Friend code system (real-life friends only, no public discovery)

Deliverable: Two phones can play together. You can invite a friend with a code.

Phase 4: Sketchbooks 1-3 + Progression
Goal: Real game content.
Tasks:

Sketchbook 1, 2, 3 fully built (15 levels, ~150 prompts)
Sparks (XP) and Style Stars currencies
Level unlock progression
Basic cosmetics (avatar frames, color palette themes)
Daily Doodle (one prompt/day, simple leaderboard)

Deliverable: A playable, content-rich game with the first 3 themed worlds.

Phase 5: Safety Systems + Parent Dashboard
Goal: Make it ship-safe for kids.
Tasks:

Strikes system (flagged drawings → warnings → temporary lock)
One-tap "report" button on every drawing
Parent dashboard web app (login with parent email, see kid's playtime, friend list, recent drawings)
COPPA compliance review (parental consent flow for under-13)
Privacy policy + terms of service pages

Deliverable: Parent can sign up, see their kid's activity. Reporting works end-to-end.

Phase 6: Polish + Beta Submission
Goal: Ready for TestFlight + Google Play internal testing.
Tasks:

All sound effects, animations, polish
Onboarding tuning
App icon + screenshots + store listing copy
iOS build via EAS, submit to TestFlight
Android build via EAS, upload to Google Play Internal Testing
Crash reporting + analytics live

Deliverable: Beta build live on TestFlight. You install it on your phone via TestFlight invite.

Phase 7+: Sketchbooks 4-12, Tournaments, Themed Weeks
(Future phases. Ship Phase 6 first, get real-kid feedback, then iterate.)

PART 4: How Cowork Should Handle Specific Things
Approval mode: Use "Ask before acting" — Cowork pauses before:

Pushing to GitHub for the first time
Deploying to Vercel
Submitting builds to TestFlight or Google Play
Spending money (e.g., if any API call is non-trivial)
Modifying anything in secrets.txt

For most code edits and local commands, it can proceed without asking.
Git workflow: Cowork should:

Create a branch for each phase (phase-1-drawing-mvp, etc.)
Make commits with clear messages every meaningful step
Open a PR at the end of each phase for you to review
Merge to main only after your approval

Deployment:

Web (Next.js): Auto-deploys to Vercel on every push to main. Cowork should run vercel deploy to verify after merging.
Mobile: Cowork runs eas build --platform ios and eas build --platform android. EAS handles the cloud build. Cowork then runs eas submit after your approval. You will need to enter your Apple ID password / 2FA the first time.

Secrets: Never commit secrets.txt or .env* files. Cowork should add these to .gitignore immediately in Phase 0.
Testing: Cowork should write tests as it goes (Vitest for backend, React Native Testing Library for mobile). Each phase ends with npm test passing.

PART 5: The Kickoff Prompt
When you're ready, paste this into Cowork:

Hi Claude. I want you to build Doodle Dash, a competitive drawing game for kids ages 8-13. The full spec is in DOODLE_DASH_BRIEF.md in this project folder. Read it carefully before starting.
Today, please complete Phase 0: Foundation only. Do not start Phase 1 until I approve Phase 0.
Phase 0 tasks:

Read secrets.txt and confirm we have all the API keys we need. List anything missing.
Initialize the git repo and connect to my GitHub repo doodle-dash.
Set up the monorepo structure: /apps/mobile (Expo), /apps/web (Next.js), /packages/shared.
Set up Supabase project schema (just the basic tables for now: users, matches, drawings).
Configure .env files from secrets.txt. Add .env* and secrets.txt to .gitignore.
Deploy a "Doodle Dash — Coming Soon" page to Vercel.
Get the Expo app showing a placeholder home screen on my phone.
Commit and push everything. Open a PR for me to review.

Use "Ask before acting" mode. Pause before:

First push to GitHub
First Vercel deploy
Anything that costs money or modifies secrets

Walk me through your plan first, then start. After Phase 0, summarize what's done and wait for me to say "Phase 1 go."


PART 6: What To Expect In Practice

Phase 0 will take roughly 30-90 mins of Cowork time, with maybe 4-5 approval clicks from you.
Phase 1 is the biggest single milestone (drawing MVP). Expect 2-4 hours of Cowork time, possibly across multiple sessions.
Phase 6 (TestFlight) is the one you can't fully automate. Apple requires you to manually approve the app in App Store Connect, add testers, and go through Apple's beta review (1-3 day wait).
Total realistic timeline to a TestFlight beta with the first 3 Sketchbooks playable: 3-6 weeks of part-time work, depending on how much approval friction there is.