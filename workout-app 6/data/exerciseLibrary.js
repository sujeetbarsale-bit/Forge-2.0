// Exercise library organized by muscle group. Every exercise is bodyweight-first
// and home-friendly (a chair, a towel, water bottles, or a resistance band cover
// the optional bits). Nothing here is gendered — the same list works for anyone.
//
// Each exercise carries a "pattern" tag matching a simple line-art illustration
// in the frontend (public/icons.js), so the app can show a visual instructional
// cue next to the name instead of just text.

const library = {
  chest: [
    { name: "Push-ups", sets: 4, reps: "10-15", restSeconds: 60, notes: "Knee push-ups if needed", pattern: "pushup" },
    { name: "Incline push-ups (hands on chair/couch)", sets: 3, reps: "10-15", restSeconds: 60, pattern: "pushup" },
    { name: "Wide push-ups", sets: 3, reps: "10-12", restSeconds: 60, pattern: "pushup" },
    { name: "Decline push-ups (feet on chair)", sets: 3, reps: "8-12", restSeconds: 60, pattern: "pushup" },
  ],
  back: [
    { name: "Superman hold", sets: 4, reps: "20-30 sec hold", restSeconds: 45, pattern: "superman" },
    { name: "Reverse snow angels", sets: 3, reps: "12-15", restSeconds: 45, pattern: "superman" },
    { name: "Towel rows (under a table edge)", sets: 3, reps: "12-15", restSeconds: 60, notes: "Or resistance band rows", pattern: "row" },
    { name: "Prone Y-raises", sets: 3, reps: "12", restSeconds: 45, pattern: "superman" },
    { name: "Bird-dog", sets: 3, reps: "10 per side", restSeconds: 45, pattern: "birddog" },
  ],
  shoulders: [
    { name: "Pike push-ups", sets: 4, reps: "8-12", restSeconds: 60, pattern: "pike" },
    { name: "Lateral raises (water bottles/dumbbells)", sets: 4, reps: "12-15", restSeconds: 45, pattern: "raise" },
    { name: "Front raises", sets: 3, reps: "12-15", restSeconds: 45, pattern: "raise" },
    { name: "Arm circles", sets: 2, reps: "30 sec each direction", restSeconds: 30, pattern: "raise" },
    { name: "Wall/table handstand hold (assisted)", sets: 3, reps: "15-20 sec", restSeconds: 60, notes: "Optional, skip if unsure", pattern: "hold" },
  ],
  biceps: [
    { name: "Band/backpack bicep curls", sets: 4, reps: "12-15", restSeconds: 45, pattern: "curl" },
    { name: "Hammer curls (water bottles/dumbbells)", sets: 3, reps: "12-15", restSeconds: 45, pattern: "curl" },
    { name: "Concentration curls", sets: 3, reps: "10-12 per side", restSeconds: 45, pattern: "curl" },
  ],
  triceps: [
    { name: "Diamond push-ups", sets: 3, reps: "8-12", restSeconds: 60, pattern: "pushup" },
    { name: "Chair dips", sets: 3, reps: "10-15", restSeconds: 45, pattern: "dip" },
    { name: "Triceps kickbacks (band/light weight)", sets: 3, reps: "12-15", restSeconds: 45, pattern: "row" },
    { name: "Overhead triceps extension (light weight)", sets: 3, reps: "12-15", restSeconds: 45, pattern: "raise" },
  ],
  forearms: [
    { name: "Wrist curls (light weight/book)", sets: 3, reps: "15-20", restSeconds: 30, pattern: "wristcurl" },
    { name: "Reverse wrist curls", sets: 3, reps: "15-20", restSeconds: 30, pattern: "wristcurl" },
    { name: "Farmer's carry (heavy bags, around the room)", sets: 3, reps: "30-40 sec", restSeconds: 45, pattern: "carry" },
    { name: "Towel wring twist", sets: 3, reps: "15 per direction", restSeconds: 30, pattern: "wristcurl" },
  ],
  legs: [
    { name: "Bodyweight squats", sets: 4, reps: "15-20", restSeconds: 60, pattern: "squat" },
    { name: "Reverse lunges", sets: 3, reps: "10 per leg", restSeconds: 60, pattern: "lunge" },
    { name: "Glute bridges", sets: 3, reps: "15-20", restSeconds: 45, pattern: "bridge" },
    { name: "Wall sit", sets: 3, reps: "30-45 sec hold", restSeconds: 45, pattern: "hold" },
    { name: "Calf raises", sets: 3, reps: "20", restSeconds: 30, pattern: "calf" },
    { name: "Bulgarian split squat (rear foot on chair)", sets: 3, reps: "10 per leg", restSeconds: 60, pattern: "lunge" },
  ],
  core: [
    { name: "Plank", sets: 4, reps: "30-60 sec hold", restSeconds: 45, pattern: "plank" },
    { name: "Bicycle crunches", sets: 4, reps: "20 total", restSeconds: 45, pattern: "twist" },
    { name: "Leg raises", sets: 3, reps: "12-15", restSeconds: 45, pattern: "legraise" },
    { name: "Russian twists", sets: 3, reps: "20 total", restSeconds: 45, pattern: "twist" },
    { name: "Side plank", sets: 3, reps: "20-30 sec per side", restSeconds: 45, pattern: "sideplank" },
    { name: "Mountain climbers", sets: 3, reps: "20 total", restSeconds: 45, pattern: "mountainclimber" },
    { name: "Plank shoulder taps", sets: 3, reps: "20 total taps", restSeconds: 45, pattern: "plank" },
  ],
};

const MUSCLE_GROUPS = Object.keys(library);

const MUSCLE_GROUP_LABELS = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  legs: "Legs",
  core: "Core",
};

// The default day -> muscle group combo. Users can override any day's groups
// (and even pick specific exercises within them) from the Customize panel.
const defaultDayGroups = {
  sunday: { groups: [], isRestDay: true },
  monday: { groups: ["chest", "triceps"] },
  tuesday: { groups: ["back", "biceps"] },
  wednesday: { groups: ["legs", "core"] },
  thursday: { groups: ["chest", "shoulders"] },
  friday: { groups: ["biceps", "triceps", "forearms"] },
  saturday: { groups: ["core"] },
};

function titleForGroups(groups) {
  if (!groups || groups.length === 0) return "Rest Day";
  return groups.map((g) => MUSCLE_GROUP_LABELS[g] || g).join(" & ");
}

// Build the full exercise list for a set of muscle groups. Optionally filter
// down to a specific subset of exercise names (used for custom plans where
// the user picked individual moves, not just whole groups).
function buildWorkout(groups, exerciseNameFilter) {
  const exercises = [];
  groups.forEach((group) => {
    const groupExercises = library[group] || [];
    groupExercises.forEach((ex) => {
      if (!exerciseNameFilter || exerciseNameFilter.includes(ex.name)) {
        exercises.push({ ...ex, group });
      }
    });
  });
  return exercises;
}

module.exports = {
  library,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  defaultDayGroups,
  titleForGroups,
  buildWorkout,
};
