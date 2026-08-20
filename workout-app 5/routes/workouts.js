const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { readDB, writeDB } = require("../db");
const { requireAuth } = require("../middleware/auth");
const {
  library,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  defaultDayGroups,
  titleForGroups,
  buildWorkout,
} = require("../data/exerciseLibrary");

const router = express.Router();
const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_LABELS = {
  sunday: "Sunday", monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday",
};

// Selfie proof uploads — required to mark a day complete.
const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const selfieStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `proof-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});
const uploadSelfie = multer({
  storage: selfieStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext) || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});

function toDateKey(d) {
  return d.toISOString().slice(0, 10);
}
function dayKeyFor(d) {
  return DAY_KEYS[d.getDay()];
}
function getWeekStartKey(d) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return toDateKey(monday);
}

function validateDayPlan(dayPlan) {
  if (!dayPlan || typeof dayPlan !== "object") return false;
  if (dayPlan.isRestDay) return true;
  if (!Array.isArray(dayPlan.groups) || dayPlan.groups.length === 0) return false;
  return dayPlan.groups.every((g) => MUSCLE_GROUPS.includes(g));
}

// Resolve a given date's workout, in priority order:
// 1. a saved custom plan for that exact date
// 2. the user's own weekly schedule for that day-of-week (if they've set one)
// 3. the app's global default schedule for that day-of-week
function resolveWorkout(db, userId, dateKey, dayKey) {
  const custom = db.customPlans.find((p) => p.userId === userId && p.date === dateKey);
  if (custom) {
    return { isRestDay: false, title: custom.title, exercises: custom.exercises, isCustom: true, source: "date" };
  }

  const userSchedule = db.userSchedules.find((s) => s.userId === userId);
  if (userSchedule && userSchedule.days && userSchedule.days[dayKey]) {
    const dayPlan = userSchedule.days[dayKey];
    if (dayPlan.isRestDay) {
      return { isRestDay: true, title: "Rest Day", exercises: [], isCustom: false, source: "weekly" };
    }
    return {
      isRestDay: false,
      title: titleForGroups(dayPlan.groups),
      exercises: buildWorkout(dayPlan.groups),
      isCustom: false,
      source: "weekly",
    };
  }

  const def = defaultDayGroups[dayKey];
  if (def.isRestDay) {
    return { isRestDay: true, title: "Rest Day", exercises: [], isCustom: false, source: "app-default" };
  }
  return {
    isRestDay: false,
    title: titleForGroups(def.groups),
    exercises: buildWorkout(def.groups),
    isCustom: false,
    source: "app-default",
  };
}

// GET the exercise library, so the frontend can render pickers
router.get("/library", requireAuth, (req, res) => {
  res.json({
    groups: MUSCLE_GROUPS.map((key) => ({
      key,
      label: MUSCLE_GROUP_LABELS[key],
      exercises: library[key],
    })),
  });
});

// GET today's (or any given date's) workout, including which exercises were checked off
router.get("/today", requireAuth, (req, res) => {
  const now = req.query.date ? new Date(req.query.date) : new Date();
  const dayKey = dayKeyFor(now);
  const dateKey = toDateKey(now);
  const db = readDB();

  const workout = resolveWorkout(db, req.userId, dateKey, dayKey);
  const log = db.logs.find((l) => l.userId === req.userId && l.date === dateKey);
  const checked = db.exerciseChecks
    .filter((c) => c.userId === req.userId && c.date === dateKey && c.done)
    .map((c) => c.exerciseName);

  res.json({
    date: dateKey,
    day: DAY_LABELS[dayKey],
    title: workout.title,
    isRestDay: workout.isRestDay,
    isCustom: workout.isCustom,
    exercises: workout.exercises,
    completed: !!(log && log.completed),
    proofImageUrl: log && log.completed ? log.proofImageUrl : null,
    checkedExercises: checked,
  });
});

// ---------- Per-day custom plan (overrides one specific date) ----------

router.post("/customize", requireAuth, (req, res) => {
  const { muscleGroups, exerciseNames } = req.body;
  const dateKey = req.body.date || toDateKey(new Date());

  if (!Array.isArray(muscleGroups) || muscleGroups.length === 0) {
    return res.status(400).json({ error: "Pick at least one muscle group." });
  }
  const invalid = muscleGroups.filter((g) => !MUSCLE_GROUPS.includes(g));
  if (invalid.length) {
    return res.status(400).json({ error: `Unknown muscle group: ${invalid.join(", ")}` });
  }

  const exercises = buildWorkout(muscleGroups, exerciseNames && exerciseNames.length ? exerciseNames : null);
  if (exercises.length === 0) {
    return res.status(400).json({ error: "That selection has no exercises in it." });
  }

  const db = readDB();
  const existingIndex = db.customPlans.findIndex(
    (p) => p.userId === req.userId && p.date === dateKey
  );
  const plan = {
    userId: req.userId,
    date: dateKey,
    muscleGroups,
    title: titleForGroups(muscleGroups) + " (custom)",
    exercises,
  };
  if (existingIndex >= 0) db.customPlans[existingIndex] = plan;
  else db.customPlans.push(plan);
  writeDB(db);

  res.json({ success: true, plan });
});

router.delete("/customize", requireAuth, (req, res) => {
  const dateKey = (req.body && req.body.date) || toDateKey(new Date());
  const db = readDB();
  db.customPlans = db.customPlans.filter(
    (p) => !(p.userId === req.userId && p.date === dateKey)
  );
  writeDB(db);
  res.json({ success: true });
});

// ---------- Personal weekly schedule (which body part on which day, every week) ----------

// GET the user's weekly schedule, prefilled with the app default if they haven't set one yet
router.get("/weekly-schedule", requireAuth, (req, res) => {
  const db = readDB();
  const existing = db.userSchedules.find((s) => s.userId === req.userId);
  if (existing) {
    return res.json({ days: existing.days, isCustom: true });
  }
  // Prefill with the app-wide default so the editor starts from something sensible
  const days = {};
  DAY_KEYS.forEach((k) => {
    const def = defaultDayGroups[k];
    days[k] = def.isRestDay ? { isRestDay: true, groups: [] } : { isRestDay: false, groups: def.groups };
  });
  res.json({ days, isCustom: false });
});

// POST save/replace the user's weekly schedule. Always editable, even after being saved as "standard".
router.post("/weekly-schedule", requireAuth, (req, res) => {
  const { days } = req.body;
  if (!days || typeof days !== "object") {
    return res.status(400).json({ error: "A schedule for each day is required." });
  }
  for (const key of DAY_KEYS) {
    if (!validateDayPlan(days[key])) {
      return res.status(400).json({ error: `Invalid plan for ${DAY_LABELS[key]}. Pick a rest day or at least one muscle group.` });
    }
  }
  const cleanDays = {};
  DAY_KEYS.forEach((k) => {
    cleanDays[k] = days[k].isRestDay
      ? { isRestDay: true, groups: [] }
      : { isRestDay: false, groups: days[k].groups };
  });

  const db = readDB();
  const idx = db.userSchedules.findIndex((s) => s.userId === req.userId);
  if (idx >= 0) db.userSchedules[idx].days = cleanDays;
  else db.userSchedules.push({ userId: req.userId, days: cleanDays });
  writeDB(db);

  res.json({ success: true, days: cleanDays });
});

// DELETE the user's weekly schedule, reverting to the app-wide default
router.delete("/weekly-schedule", requireAuth, (req, res) => {
  const db = readDB();
  db.userSchedules = db.userSchedules.filter((s) => s.userId !== req.userId);
  writeDB(db);
  res.json({ success: true });
});

// ---------- Per-exercise checkboxes (what you actually did that day) ----------

router.post("/exercise-check", requireAuth, (req, res) => {
  const { exerciseName, done } = req.body;
  const dateKey = req.body.date || toDateKey(new Date());
  if (!exerciseName) return res.status(400).json({ error: "exerciseName is required." });

  const db = readDB();
  const log = db.logs.find((l) => l.userId === req.userId && l.date === dateKey);
  if (log && log.completed) {
    return res.status(400).json({ error: "This day is already submitted and the checklist is locked." });
  }

  const existing = db.exerciseChecks.find(
    (c) => c.userId === req.userId && c.date === dateKey && c.exerciseName === exerciseName
  );
  if (existing) existing.done = !!done;
  else db.exerciseChecks.push({ userId: req.userId, date: dateKey, exerciseName, done: !!done });
  writeDB(db);
  res.json({ success: true });
});

// ---------- Completion (selfie required as proof, then locked in) ----------

router.post(
  "/complete",
  requireAuth,
  (req, res, next) => {
    uploadSelfie.single("selfie")(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  (req, res) => {
    const dateKey = (req.body && req.body.date) || toDateKey(new Date());
    const db = readDB();

    let log = db.logs.find((l) => l.userId === req.userId && l.date === dateKey);

    if (log && log.completed) {
      return res.json({ success: true, date: dateKey, proofImageUrl: log.proofImageUrl });
    }

    if (!req.file) {
      return res.status(400).json({ error: "A selfie is required as proof to mark today complete." });
    }

    const proofImageUrl = `/uploads/${req.file.filename}`;
    if (log) {
      log.completed = true;
      log.proofImageUrl = proofImageUrl;
      log.completedAt = new Date().toISOString();
    } else {
      db.logs.push({
        userId: req.userId,
        date: dateKey,
        completed: true,
        proofImageUrl,
        completedAt: new Date().toISOString(),
      });
    }
    writeDB(db);
    res.json({ success: true, date: dateKey, proofImageUrl });
  }
);

// ---------- Streak / badges / calendar ----------

function computeStats(db, userId) {
  const userLogs = db.logs.filter((l) => l.userId === userId);
  const completedDates = new Set(userLogs.filter((l) => l.completed).map((l) => l.date));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function isRestDayFor(userId, d) {
    const dk = dayKeyFor(d);
    const userSchedule = db.userSchedules.find((s) => s.userId === userId);
    if (userSchedule && userSchedule.days && userSchedule.days[dk]) {
      return !!userSchedule.days[dk].isRestDay;
    }
    return !!defaultDayGroups[dk].isRestDay;
  }

  let streak = 0;
  const freezesUsedByWeek = {};
  const cursor = new Date(today);

  if (!isRestDayFor(userId, cursor) && !completedDates.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const dKey = toDateKey(cursor);

    if (isRestDayFor(userId, cursor)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (completedDates.has(dKey)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    const weekKey = getWeekStartKey(cursor);
    const used = freezesUsedByWeek[weekKey] || 0;
    if (used < 1) {
      freezesUsedByWeek[weekKey] = used + 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }

  const badges = [];
  const weekBuckets = {};
  for (const l of userLogs) {
    if (!l.completed) continue;
    const wk = getWeekStartKey(new Date(l.date));
    weekBuckets[wk] = (weekBuckets[wk] || 0) + 1;
  }
  for (const [weekStart, count] of Object.entries(weekBuckets)) {
    if (count >= 6) badges.push(weekStart);
  }
  badges.sort();

  const calendar = [];
  const gridCursor = new Date(today);
  gridCursor.setDate(gridCursor.getDate() - 34);
  for (let i = 0; i < 35; i++) {
    const dKey = toDateKey(gridCursor);
    calendar.push({
      date: dKey,
      isRestDay: isRestDayFor(userId, gridCursor),
      completed: completedDates.has(dKey),
      isFuture: gridCursor > today,
    });
    gridCursor.setDate(gridCursor.getDate() + 1);
  }

  const todayCompleted = completedDates.has(toDateKey(today));

  return { streak, badges, totalBadges: badges.length, calendar, todayCompleted };
}

router.get("/stats", requireAuth, (req, res) => {
  const db = readDB();
  res.json(computeStats(db, req.userId));
});

module.exports = { router, computeStats };
