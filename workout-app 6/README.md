# Forge — Home Workout Log

A push/pull/legs home workout app with secure per-user login, a daily schedule,
and a streak + badge reward system. Works on both mobile browsers and desktop.

## Weekly schedule

| Day | Focus |
|---|---|
| Monday | Chest & Triceps |
| Tuesday | Back & Biceps |
| Wednesday | Legs & Core |
| Thursday | Chest & Shoulders |
| Friday | Biceps, Triceps & Forearms |
| Saturday | Core |
| Sunday | Rest day |

Every exercise is bodyweight-first and works at home with no gym equipment
(a chair, a towel, water bottles, or a resistance band cover the optional bits).
The exercise list is the same for everyone — nothing gendered about push-ups.

## Customize any day

The default schedule above is just a starting point. Tap **"Customize today's
workout"** to pick any combination of muscle groups (e.g. chest + biceps) and
even uncheck specific exercises you don't want. Your custom pick applies only
to that date — every other day still follows the default schedule unless you
customize it too. "Reset to default schedule" removes the override.

## Groups: train with friends

- Create a group and share its invite code, or join a friend's group with
  their code.
- **Chat**: post text or a progress selfie (photo). Only group members can
  see or post in a group's chat — membership is checked on every request.
- **Leaderboard**: see each member's current streak, badge count, and whether
  they've completed today's workout yet — a shared view of the group's
  productivity, not just your own.
- **Manage**: the person who created a group can rename it and remove members
  at any time from the group's "Manage" tab.

## Proof-of-workout selfies

Marking a day complete now requires uploading a selfie as proof — tap "Upload
selfie to complete," pick or take a photo, and that locks the day in as done.
There's no undo once it's submitted, so a completed day stays completed (the
whole point of requiring proof). Each exercise also shows a small line-art
illustration of the movement next to its name, and the dashboard opens with a
rotating daily motivational line to nudge you into starting. Completing a day
now also triggers a small fireworks celebration on screen.

## Your own weekly plan

Right after creating an account, you're prompted to build your own weekly
plan: pick which muscle group(s) to train on each day, or mark any day a rest
day. This becomes your personal default — it's always editable afterward from
the "My Plan" tab, even after you save it as your standard, and you can reset
it back to the app's built-in schedule anytime. A specific date can still be
overridden further with "Customize today's workout," which takes priority
over your weekly plan for just that one day.

## Exercise-level tracking and instructions

Each exercise in today's list has a checkbox on the left so you can tick off
exactly which ones you did, independent of the overall day completion. Tap an
exercise's name to open a detail view with a larger illustration, its sets/
reps/rest, and a short step-by-step "how to do it" guide.

## History at a glance

Both the streak track and the 5-week calendar grid are clickable — tap any
past day to see exactly what was scheduled, which exercises were checked off,
and the proof selfie from that day (if it was completed).

## Session security

You're automatically logged out after 3 hours for security, both on the
server (the login token itself expires) and in the browser (a timer checks
and logs you out even if you leave a tab open). You'll need to log back in
after that.

## Signing up with a taken username

If the username you want during sign-up is already in use, the app tells you
right away and suggests a few similar usernames that are available, which you
can tap to fill in automatically.

## Password hint and reset

When creating an account, you can optionally set a password hint (like "my
first bike's name") to jog your memory later. On the login screen, "Forgot
your password?" lets you look up that hint by username and then set a new
password directly. Note: since this app has no email or SMS system, there's
no identity verification beyond knowing the username — that's a fine
trade-off for a small personal or friends app, but worth knowing if you ever
open this up more broadly.

## Locked checklist after submission

Once you upload your proof selfie and a day is marked complete, the exercise
checkboxes for that day lock — you can't go back and edit which exercises you
checked off. This is enforced both in the UI and on the server, so it can't be
bypassed by calling the API directly.

## Getting around

Tap the "FORGE" logo in the top-left corner from anywhere in the app —
mid-chat, inside a modal, on the My Plan tab — and it takes you straight back
to today's workout.

## Usernames and passwords

Usernames are fully case-insensitive — "Sujeet," "sujeet," and "SUJEET" are
all the same account, both when logging in and when checking if a username is
already taken. Password fields (login, sign-up, and reset) all have a 👁 toggle
to show what you've typed before submitting.

## AI Plan Assistant

On the "My Plan" tab, describe a goal in plain language — "reduce belly fat,"
"build overall strength," "get toned for summer" — and click Generate. It
calls Claude to build a tailored 7-day split from the app's existing exercise
categories, along with a short explanation of why it chose that split. Nothing
is saved automatically — the suggestion just fills in the plan builder below,
which you can still tweak before clicking "Save as my standard plan."

**This feature requires your own Anthropic API key.** Get one at
console.anthropic.com, then set it as an environment variable:
- **Locally**: add `ANTHROPIC_API_KEY=sk-ant-...` to your `.env` file.
- **On Render**: add it under your service's Settings → Environment tab.

Without that key set, the rest of the app works completely normally — only
the AI Plan Assistant will show a message saying it isn't configured yet.
There's a small cost per API call (Anthropic bills per use), though this
feature uses a lightweight model and a short prompt, so it's inexpensive per
generation.

## Security

- Passwords are never stored in plain text — they're hashed with **bcrypt**.
- Each session uses a **JWT token**; every workout/stats/log request checks
  that token and only ever reads or writes that user's own data.
- One person's account cannot see another person's calendar, streak, or logs.

## Reward system

- **Streak**: a running count of consecutive scheduled workout days completed.
  Rest days (Sunday) don't break it either way.
- **Streak freeze**: missing *one* scheduled day per week won't zero your streak —
  it just costs your one freeze for that week. Miss a second day in the same
  week and the streak resets, so it stays forgiving but still meaningful.
- **Weekly badges**: complete all 6 scheduled workout days in a Monday–Saturday
  week and you earn a badge for that week.
- A 5-week calendar heatmap shows completed, missed, and rest days at a glance.

## Running it locally

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
cd workout-app
npm install
cp .env.example .env      # optionally edit JWT_SECRET
npm start
```

Then open **http://localhost:3000** in your browser (or your phone's browser,
if your phone is on the same Wi-Fi network as your computer — use your
computer's local IP instead of localhost, e.g. http://192.168.1.5:3000).

Create an account the first time you open it — from then on, log in with that
username and password. Your data (users + workout logs) is stored in
`data/db.json` on the server.

## Project structure

```
workout-app/
├── server.js                  # Express app entry point
├── db.js                      # simple JSON file storage
├── middleware/auth.js         # JWT verification
├── routes/auth.js             # register / login
├── routes/workouts.js         # today's workout, custom plans, streak+badges+calendar
├── routes/groups.js           # groups, chat, selfie uploads, leaderboard
├── routes/ai.js                # AI-generated weekly plans via the Anthropic API
├── data/exerciseLibrary.js    # muscle-group exercise library + default schedule
└── public/                    # frontend (HTML/CSS/JS)
    ├── icons.js                # line-art illustrations per exercise movement
    ├── exerciseGuides.js       # step-by-step how-to instructions per movement
    └── uploads/                # uploaded selfies land here (not committed to git)
```

## Next steps you might want later

- Deploy it (Render, Railway, Fly.io) so you can reach it from your phone
  anywhere, not just on your home Wi-Fi — this also matters for groups, since
  friends need to reach the same server to chat.
- Swap the JSON file storage for a real database (Postgres/MongoDB) if you
  expect more than a handful of users.
- Chat currently refreshes every 4 seconds (polling) rather than true
  real-time; swapping in Socket.IO would make it instant if that matters to you.
- Add exercise videos/GIFs or a "why this exercise" note for each move.
