const API = "/api";
const SESSION_LIFETIME_MS = 3 * 60 * 60 * 1000; // 3 hours, matches the backend JWT expiry

// ---------- Motivational hero banner ----------
const MOTIVATIONAL_QUOTES = [
  "Small reps, big results. Let's go.",
  "Consistency beats intensity — just show up today.",
  "Your only competition is who you were yesterday.",
  "One workout won't transform you. Skipping it won't either. Do it anyway.",
  "The hardest part is starting. You've already started by opening this.",
  "Discipline is choosing between what you want now and what you want most.",
  "Every rep counts. Every day counts.",
  "Strong body, clear mind. Let's build both.",
  "You don't have to be extreme, just consistent.",
  "Future you is thanking you for this workout.",
];

function setHeroBanner() {
  const username = localStorage.getItem("forge_username") || "there";
  document.getElementById("hero-greeting").textContent = `Welcome back, ${username}`;
  const dayIndex = Math.floor(Date.now() / 86400000) % MOTIVATIONAL_QUOTES.length;
  document.getElementById("hero-quote").textContent = MOTIVATIONAL_QUOTES[dayIndex];
}

// ---------- Password show/hide toggles ----------
document.querySelectorAll(".password-toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    btn.classList.toggle("showing", !showing);
    btn.textContent = showing ? "👁" : "🙈";
  });
});

// ---------- Auth screen wiring ----------
const tabBtns = document.querySelectorAll(".tab-btn");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    if (btn.dataset.tab === "login") {
      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
    } else {
      registerForm.classList.remove("hidden");
      loginForm.classList.add("hidden");
    }
  });
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || "Login failed.";
      return;
    }
    saveSession(data.token, data.username);
    showApp(data.isNewUser);
  } catch (err) {
    errorEl.textContent = "Could not reach the server.";
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value.trim();
  const password = document.getElementById("register-password").value;
  const passwordHint = document.getElementById("register-hint").value.trim();
  const errorEl = document.getElementById("register-error");
  const suggestionsEl = document.getElementById("username-suggestions");
  errorEl.textContent = "";
  suggestionsEl.classList.add("hidden");
  suggestionsEl.innerHTML = "";

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, passwordHint }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || "Registration failed.";
      if (data.suggestions && data.suggestions.length) {
        suggestionsEl.classList.remove("hidden");
        data.suggestions.forEach((s) => {
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "suggestion-chip";
          chip.textContent = s;
          chip.addEventListener("click", () => {
            document.getElementById("register-username").value = s;
          });
          suggestionsEl.appendChild(chip);
        });
      }
      return;
    }
    saveSession(data.token, data.username);
    showApp(data.isNewUser);
  } catch (err) {
    errorEl.textContent = "Could not reach the server.";
  }
});

// ---------- Forgot password flow ----------
document.getElementById("open-forgot-btn").addEventListener("click", () => {
  document.getElementById("forgot-overlay").classList.remove("hidden");
  document.getElementById("forgot-username-form").classList.remove("hidden");
  document.getElementById("forgot-reset-section").classList.add("hidden");
  document.getElementById("forgot-username").value = "";
  document.getElementById("forgot-username-error").textContent = "";
});

document.getElementById("close-forgot-btn").addEventListener("click", () => {
  document.getElementById("forgot-overlay").classList.add("hidden");
});

let forgotUsername = "";

document.getElementById("forgot-username-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("forgot-username").value.trim();
  const errorEl = document.getElementById("forgot-username-error");
  errorEl.textContent = "";
  if (!username) return;

  try {
    const res = await fetch(`${API}/auth/password-hint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || "Could not find that account.";
      return;
    }
    forgotUsername = username;
    const hintDisplay = document.getElementById("forgot-hint-display");
    hintDisplay.innerHTML = data.hint
      ? `<span class="hint-label">Your password hint</span>${escapeHtml(data.hint)}`
      : `<span class="hint-label">No hint was set for this account</span>You can still set a new password below.`;
    document.getElementById("forgot-username-form").classList.add("hidden");
    document.getElementById("forgot-reset-section").classList.remove("hidden");
    document.getElementById("forgot-new-password").value = "";
    document.getElementById("forgot-reset-error").textContent = "";
    document.getElementById("forgot-success-msg").textContent = "";
  } catch (err) {
    errorEl.textContent = "Could not reach the server.";
  }
});

document.getElementById("forgot-reset-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const newPassword = document.getElementById("forgot-new-password").value;
  const errorEl = document.getElementById("forgot-reset-error");
  const successEl = document.getElementById("forgot-success-msg");
  errorEl.textContent = "";
  successEl.textContent = "";

  try {
    const res = await fetch(`${API}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: forgotUsername, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || "Could not reset your password.";
      return;
    }
    successEl.textContent = "Password updated! Closing this and taking you to log in…";
    setTimeout(() => {
      document.getElementById("forgot-overlay").classList.add("hidden");
      document.getElementById("login-username").value = forgotUsername;
      document.getElementById("login-password").value = "";
      document.getElementById("login-password").focus();
    }, 1200);
  } catch (err) {
    errorEl.textContent = "Could not reach the server.";
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("forge_token");
  localStorage.removeItem("forge_username");
  localStorage.removeItem("forge_login_time");
  location.reload();
});

function saveSession(token, username) {
  localStorage.setItem("forge_token", token);
  localStorage.setItem("forge_username", username);
  localStorage.setItem("forge_login_time", Date.now().toString());
}

function getToken() {
  return localStorage.getItem("forge_token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// ---------- Screen switching ----------
function showApp(isNewUser) {
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("app-screen").classList.remove("hidden");
  document.getElementById("username-display").textContent =
    localStorage.getItem("forge_username") || "";
  setHeroBanner();
  loadToday();
  loadStats();
  startSessionTimer();
  if (isNewUser) openOnboarding();
}

// ---------- Auto-logout after 3 hours for security ----------
let sessionTimer = null;
function startSessionTimer() {
  if (sessionTimer) clearInterval(sessionTimer);
  checkSessionExpiry();
  sessionTimer = setInterval(checkSessionExpiry, 60 * 1000);
}
function checkSessionExpiry() {
  const loginTime = parseInt(localStorage.getItem("forge_login_time") || "0", 10);
  if (!loginTime) return;
  if (Date.now() - loginTime > SESSION_LIFETIME_MS) {
    alert("You've been logged out after 3 hours for security. Please log in again.");
    handleAuthExpired();
  }
}

// ---------- Home button (Forge logo) ----------
document.getElementById("home-btn").addEventListener("click", () => {
  document.querySelectorAll(".overlay").forEach((o) => o.classList.add("hidden"));

  document.querySelectorAll(".main-tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector('.main-tab-btn[data-view="today-view"]').classList.add("active");
  MAIN_VIEWS.forEach((v) => document.getElementById(v).classList.add("hidden"));
  document.getElementById("today-view").classList.remove("hidden");

  currentGroupId = null;
  if (chatPollTimer) clearInterval(chatPollTimer);
  const groupDetail = document.getElementById("group-detail-panel");
  const groupsList = document.getElementById("groups-list-panel");
  if (groupDetail) groupDetail.classList.add("hidden");
  if (groupsList) groupsList.classList.remove("hidden");

  loadToday();
  loadStats();
});

// ---------- Today's workout ----------
const completeBtn = document.getElementById("complete-btn");
const selfieInput = document.getElementById("selfie-input");
let todayIsRest = false;
let todayExercisesData = []; // cached so the exercise-detail modal can look up notes/pattern

async function loadToday() {
  const res = await fetch(`${API}/workout/today`, { headers: authHeaders() });
  if (res.status === 401) return handleAuthExpired();
  const data = await res.json();

  document.getElementById("today-day").textContent = data.day;
  document.getElementById("today-title").textContent = data.title;
  todayIsRest = data.isRestDay;
  todayExercisesData = data.exercises;

  const restMsg = document.getElementById("rest-day-message");
  const list = document.getElementById("exercise-list");
  list.innerHTML = "";

  if (data.isRestDay) {
    restMsg.classList.remove("hidden");
  } else {
    restMsg.classList.add("hidden");
    const checkedSet = new Set(data.checkedExercises || []);
    const locked = data.completed; // no edits allowed once a day is submitted with proof
    data.exercises.forEach((ex) => {
      const li = document.createElement("li");
      const iconSvg = getExerciseIcon(ex.pattern);
      li.innerHTML = `
        <input type="checkbox" class="ex-checkbox" ${checkedSet.has(ex.name) ? "checked" : ""} ${locked ? "disabled" : ""} title="${locked ? "Locked — this day is already submitted" : "Mark this exercise done"}" />
        <span class="ex-main">
          <span class="ex-icon">${iconSvg}</span>
          <span class="ex-name">
            <button type="button" class="ex-name-btn">${ex.name}</button>
            ${ex.notes ? `<span class="ex-notes">${ex.notes}</span>` : ""}
          </span>
        </span>
        <span class="ex-scheme">${ex.sets}×${ex.reps} · ${ex.restSeconds}s rest</span>
      `;
      const checkbox = li.querySelector(".ex-checkbox");
      if (!locked) {
        checkbox.addEventListener("change", () => toggleExerciseCheck(ex.name, checkbox.checked));
      }
      li.querySelector(".ex-name-btn").addEventListener("click", () => openExerciseDetail(ex));
      list.appendChild(li);
    });
  }

  const pill = document.getElementById("status-pill");
  const proofBox = document.getElementById("completed-proof");
  const proofThumb = document.getElementById("proof-thumb");

  if (data.isRestDay) {
    pill.textContent = "Rest";
    pill.classList.remove("done");
    completeBtn.classList.add("hidden");
    proofBox.classList.add("hidden");
  } else if (data.completed) {
    pill.textContent = "Done";
    pill.classList.add("done");
    completeBtn.classList.add("hidden"); // no undo — once proven, it's locked in
    proofBox.classList.remove("hidden");
    if (data.proofImageUrl) proofThumb.src = data.proofImageUrl;
  } else {
    pill.textContent = "Not done yet";
    pill.classList.remove("done");
    completeBtn.classList.remove("hidden");
    proofBox.classList.add("hidden");
  }
}

async function toggleExerciseCheck(exerciseName, done) {
  await fetch(`${API}/workout/exercise-check`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ exerciseName, done }),
  });
}

// ---------- Exercise detail modal ----------
function openExerciseDetail(ex) {
  document.getElementById("ex-detail-name").textContent = ex.name;
  document.getElementById("ex-detail-icon").innerHTML = getExerciseIcon(ex.pattern);
  document.getElementById("ex-detail-scheme").textContent = `${ex.sets} sets × ${ex.reps} · ${ex.restSeconds}s rest between sets`;
  document.getElementById("ex-detail-notes").textContent = ex.notes || "";
  const stepsList = document.getElementById("ex-detail-steps");
  stepsList.innerHTML = "";
  getExerciseGuide(ex.pattern).forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    stepsList.appendChild(li);
  });
  document.getElementById("exercise-detail-overlay").classList.remove("hidden");
}
document.getElementById("close-exercise-detail-btn").addEventListener("click", () => {
  document.getElementById("exercise-detail-overlay").classList.add("hidden");
});

// ---------- Fireworks celebration ----------
function triggerFireworks() {
  const layer = document.getElementById("fireworks-layer");
  const colors = ["#ff5a1f", "#4fd1c5", "#f2c94c", "#edede7", "#ff8a5c"];
  const bursts = 3;
  for (let b = 0; b < bursts; b++) {
    setTimeout(() => {
      const originX = 20 + Math.random() * 60;
      const originY = 25 + Math.random() * 35;
      const particleCount = 24;
      for (let i = 0; i < particleCount; i++) {
        const p = document.createElement("div");
        p.className = "firework-particle";
        const angle = (Math.PI * 2 * i) / particleCount;
        const distance = 60 + Math.random() * 60;
        p.style.left = `${originX}vw`;
        p.style.top = `${originY}vh`;
        p.style.setProperty("--fx", `${Math.cos(angle) * distance}px`);
        p.style.setProperty("--fy", `${Math.sin(angle) * distance}px`);
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        layer.appendChild(p);
        setTimeout(() => p.remove(), 1200);
      }
    }, b * 250);
  }
}

completeBtn.addEventListener("click", () => {
  selfieInput.value = "";
  selfieInput.click();
});

selfieInput.addEventListener("change", async () => {
  const file = selfieInput.files[0];
  if (!file) return;
  const errorEl = document.getElementById("complete-error");
  errorEl.textContent = "";
  completeBtn.disabled = true;
  completeBtn.textContent = "Uploading…";

  const formData = new FormData();
  formData.append("selfie", file);

  try {
    const res = await fetch(`${API}/workout/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }, // let the browser set the multipart boundary
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || "Could not complete today's workout.";
      completeBtn.disabled = false;
      completeBtn.textContent = "📸 Upload selfie to complete";
      return;
    }
    await loadToday();
    await loadStats();
    triggerFireworks();
  } catch (err) {
    errorEl.textContent = "Could not reach the server.";
    completeBtn.disabled = false;
    completeBtn.textContent = "📸 Upload selfie to complete";
  }
});

// ---------- Streak + calendar ----------
async function loadStats() {
  const res = await fetch(`${API}/workout/stats`, { headers: authHeaders() });
  if (res.status === 401) return handleAuthExpired();
  const data = await res.json();

  const streakCountEl = document.getElementById("streak-count");
  streakCountEl.textContent = data.streak;
  streakCountEl.classList.toggle("hot", data.streak >= 3);
  document.getElementById("badge-count").textContent = data.totalBadges;

  // Streak track: show the last 7 days from the calendar data
  const track = document.getElementById("streak-track");
  track.innerHTML = "";
  const last7 = data.calendar.slice(-7);
  last7.forEach((day) => {
    const node = document.createElement("div");
    node.className = "streak-node";
    if (day.isRestDay) node.classList.add("rest");
    else if (day.completed) node.classList.add("lit");
    const d = new Date(day.date);
    node.textContent = d.toLocaleDateString(undefined, { weekday: "narrow" });
    node.addEventListener("click", () => openDayDetail(day.date));
    track.appendChild(node);
  });

  // Calendar grid
  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";
  data.calendar.forEach((day) => {
    const cell = document.createElement("div");
    cell.className = "cal-day";
    if (day.isFuture) cell.classList.add("future");
    else if (day.isRestDay) cell.classList.add("rest");
    else if (day.completed) cell.classList.add("done");
    else cell.classList.add("missed");
    cell.title = day.date;
    if (!day.isFuture) cell.addEventListener("click", () => openDayDetail(day.date));
    grid.appendChild(cell);
  });
}

// ---------- Day detail modal (click a calendar cell or streak node) ----------
async function openDayDetail(dateKey) {
  const res = await fetch(`${API}/workout/today?date=${dateKey}`, { headers: authHeaders() });
  if (!res.ok) return;
  const data = await res.json();

  document.getElementById("day-detail-title").textContent = data.title;
  const dateObj = new Date(dateKey);
  document.getElementById("day-detail-date").textContent =
    `${data.day}, ${dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` +
    (data.completed ? " · ✅ Completed" : data.isRestDay ? " · Rest day" : " · Not completed");

  const body = document.getElementById("day-detail-body");
  body.innerHTML = "";

  if (data.isRestDay) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Rest day — no workout scheduled.";
    body.appendChild(p);
  } else {
    const checkedSet = new Set(data.checkedExercises || []);
    data.exercises.forEach((ex) => {
      const row = document.createElement("div");
      row.className = "day-detail-row";
      row.innerHTML = `
        <span class="day-detail-check ${checkedSet.has(ex.name) ? "done" : ""}">${checkedSet.has(ex.name) ? "✓" : ""}</span>
        <span>${ex.name} — ${ex.sets}×${ex.reps}</span>
      `;
      body.appendChild(row);
    });
    if (data.completed && data.proofImageUrl) {
      const img = document.createElement("img");
      img.className = "day-detail-proof";
      img.src = data.proofImageUrl;
      img.alt = "Proof selfie for this day";
      body.appendChild(img);
    }
  }

  document.getElementById("day-detail-overlay").classList.remove("hidden");
}
document.getElementById("close-day-detail-btn").addEventListener("click", () => {
  document.getElementById("day-detail-overlay").classList.add("hidden");
});

function handleAuthExpired() {
  localStorage.removeItem("forge_token");
  localStorage.removeItem("forge_username");
  localStorage.removeItem("forge_login_time");
  if (sessionTimer) clearInterval(sessionTimer);
  location.reload();
}

// ---------- Main tab switching (Today / My Plan / Groups) ----------
const MAIN_VIEWS = ["today-view", "plan-view", "groups-view"];
document.querySelectorAll(".main-tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".main-tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    MAIN_VIEWS.forEach((v) => document.getElementById(v).classList.add("hidden"));
    document.getElementById(btn.dataset.view).classList.remove("hidden");
    if (btn.dataset.view === "groups-view") loadGroups();
    if (btn.dataset.view === "plan-view") loadWeeklyPlan();
  });
});

// ---------- Customize today's workout ----------
let libraryData = null;
let selectedGroups = new Set();
let uncheckedExercises = new Set(); // exercises explicitly deselected within a selected group

document.getElementById("open-customize-btn").addEventListener("click", async () => {
  document.getElementById("customize-overlay").classList.remove("hidden");
  document.getElementById("customize-error").textContent = "";
  if (!libraryData) {
    const res = await fetch(`${API}/workout/library`, { headers: authHeaders() });
    libraryData = await res.json();
  }
  selectedGroups = new Set();
  uncheckedExercises = new Set();
  renderGroupChips();
  renderExercisePicker();
});

document.getElementById("close-customize-btn").addEventListener("click", () => {
  document.getElementById("customize-overlay").classList.add("hidden");
});

function renderGroupChips() {
  const wrap = document.getElementById("group-chips");
  wrap.innerHTML = "";
  libraryData.groups.forEach((g) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "group-chip" + (selectedGroups.has(g.key) ? " selected" : "");
    chip.textContent = g.label;
    chip.addEventListener("click", () => {
      if (selectedGroups.has(g.key)) selectedGroups.delete(g.key);
      else selectedGroups.add(g.key);
      renderGroupChips();
      renderExercisePicker();
    });
    wrap.appendChild(chip);
  });
}

function renderExercisePicker() {
  const wrap = document.getElementById("custom-exercise-picker");
  wrap.innerHTML = "";
  libraryData.groups
    .filter((g) => selectedGroups.has(g.key))
    .forEach((g) => {
      const block = document.createElement("div");
      block.className = "custom-group-block";
      const heading = document.createElement("h4");
      heading.textContent = g.label;
      block.appendChild(heading);
      g.exercises.forEach((ex) => {
        const row = document.createElement("label");
        row.className = "custom-ex-row";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !uncheckedExercises.has(ex.name);
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) uncheckedExercises.delete(ex.name);
          else uncheckedExercises.add(ex.name);
        });
        row.appendChild(checkbox);
        row.appendChild(document.createTextNode(`${ex.name} (${ex.sets}×${ex.reps})`));
        block.appendChild(row);
      });
      wrap.appendChild(block);
    });
}

document.getElementById("save-custom-btn").addEventListener("click", async () => {
  const errorEl = document.getElementById("customize-error");
  errorEl.textContent = "";
  if (selectedGroups.size === 0) {
    errorEl.textContent = "Pick at least one muscle group.";
    return;
  }
  const exerciseNames = [];
  libraryData.groups
    .filter((g) => selectedGroups.has(g.key))
    .forEach((g) => {
      g.exercises.forEach((ex) => {
        if (!uncheckedExercises.has(ex.name)) exerciseNames.push(ex.name);
      });
    });

  const res = await fetch(`${API}/workout/customize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ muscleGroups: Array.from(selectedGroups), exerciseNames }),
  });
  const data = await res.json();
  if (!res.ok) {
    errorEl.textContent = data.error || "Could not save your workout.";
    return;
  }
  document.getElementById("customize-overlay").classList.add("hidden");
  await loadToday();
  await loadStats();
});

document.getElementById("reset-custom-btn").addEventListener("click", async () => {
  await fetch(`${API}/workout/customize`, {
    method: "DELETE",
    headers: authHeaders(),
    body: JSON.stringify({}),
  });
  document.getElementById("customize-overlay").classList.add("hidden");
  await loadToday();
  await loadStats();
});

// ---------- Weekly plan builder (reused for onboarding + My Plan tab) ----------
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS_UI = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
  friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

async function ensureLibraryLoaded() {
  if (!libraryData) {
    const res = await fetch(`${API}/workout/library`, { headers: authHeaders() });
    libraryData = await res.json();
  }
  return libraryData;
}

// Renders a 7-day builder into `container`, seeded from `initialDays`.
// Returns a function getPlan() that reads the current selections back out.
function renderPlanBuilder(container, initialDays) {
  container.innerHTML = "";
  const state = {};
  DAY_ORDER.forEach((day) => {
    const src = initialDays[day] || { isRestDay: false, groups: [] };
    state[day] = { isRestDay: !!src.isRestDay, groups: new Set(src.groups || []) };
  });

  DAY_ORDER.forEach((day) => {
    const row = document.createElement("div");
    row.className = "plan-day-row";

    const head = document.createElement("div");
    head.className = "plan-day-head";
    head.innerHTML = `
      <span class="plan-day-name">${DAY_LABELS_UI[day]}</span>
      <label class="rest-toggle">
        <input type="checkbox" ${state[day].isRestDay ? "checked" : ""} />
        Rest day
      </label>
    `;
    row.appendChild(head);

    const chipRow = document.createElement("div");
    chipRow.className = "plan-chip-row";
    chipRow.style.display = state[day].isRestDay ? "none" : "flex";

    libraryData.groups.forEach((g) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "plan-chip" + (state[day].groups.has(g.key) ? " selected" : "");
      chip.textContent = g.label;
      chip.addEventListener("click", () => {
        if (state[day].groups.has(g.key)) state[day].groups.delete(g.key);
        else state[day].groups.add(g.key);
        chip.classList.toggle("selected");
      });
      chipRow.appendChild(chip);
    });
    row.appendChild(chipRow);

    const restCheckbox = head.querySelector('input[type="checkbox"]');
    restCheckbox.addEventListener("change", () => {
      state[day].isRestDay = restCheckbox.checked;
      chipRow.style.display = restCheckbox.checked ? "none" : "flex";
    });

    container.appendChild(row);
  });

  return function getPlan() {
    const days = {};
    DAY_ORDER.forEach((day) => {
      days[day] = state[day].isRestDay
        ? { isRestDay: true, groups: [] }
        : { isRestDay: false, groups: Array.from(state[day].groups) };
    });
    return days;
  };
}

function planHasAtLeastOneTrainingDay(days) {
  return Object.values(days).some((d) => !d.isRestDay && d.groups.length > 0);
}
function planIsFullyValid(days) {
  return Object.values(days).every((d) => d.isRestDay || d.groups.length > 0);
}

// ---------- My Plan tab ----------
let planGetter = null;

async function loadWeeklyPlan() {
  await ensureLibraryLoaded();
  const res = await fetch(`${API}/workout/weekly-schedule`, { headers: authHeaders() });
  if (res.status === 401) return handleAuthExpired();
  const data = await res.json();
  planGetter = renderPlanBuilder(document.getElementById("plan-builder"), data.days);
  document.getElementById("plan-saved-msg").textContent = "";
  document.getElementById("plan-error").textContent = "";
}

// ---------- AI Plan Assistant ----------
document.getElementById("ai-generate-btn").addEventListener("click", async () => {
  const goal = document.getElementById("ai-goal-input").value.trim();
  const errorEl = document.getElementById("ai-plan-error");
  const rationaleBox = document.getElementById("ai-rationale-box");
  const btn = document.getElementById("ai-generate-btn");
  errorEl.textContent = "";
  rationaleBox.classList.add("hidden");

  if (!goal) {
    errorEl.textContent = "Tell it your goal first — e.g. \"reduce belly fat.\"";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Thinking…";

  try {
    await ensureLibraryLoaded();
    const res = await fetch(`${API}/ai/plan`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ goal }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || "Could not generate a plan right now.";
      return;
    }
    // Refresh the builder below with the AI's suggestion — nothing is saved
    // until the user clicks "Save as my standard plan" themselves.
    planGetter = renderPlanBuilder(document.getElementById("plan-builder"), data.days);
    document.getElementById("plan-saved-msg").textContent = "";
    document.getElementById("plan-error").textContent = "";
    if (data.rationale) {
      rationaleBox.textContent = data.rationale;
      rationaleBox.classList.remove("hidden");
    }
  } catch (err) {
    errorEl.textContent = "Could not reach the server.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Generate";
  }
});

document.getElementById("plan-save-btn").addEventListener("click", async () => {
  const errorEl = document.getElementById("plan-error");
  const savedEl = document.getElementById("plan-saved-msg");
  errorEl.textContent = "";
  savedEl.textContent = "";
  const days = planGetter();
  if (!planIsFullyValid(days)) {
    errorEl.textContent = "Every day needs to be either a rest day or have at least one muscle group picked.";
    return;
  }
  const res = await fetch(`${API}/workout/weekly-schedule`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ days }),
  });
  const data = await res.json();
  if (!res.ok) {
    errorEl.textContent = data.error || "Could not save your plan.";
    return;
  }
  savedEl.textContent = "Saved — this is now your standard weekly plan. You can still edit it anytime.";
  await loadToday();
  await loadStats();
});

document.getElementById("plan-reset-btn").addEventListener("click", async () => {
  await fetch(`${API}/workout/weekly-schedule`, { method: "DELETE", headers: authHeaders() });
  document.getElementById("plan-saved-msg").textContent = "Reset to the app's default schedule.";
  document.getElementById("plan-error").textContent = "";
  await loadWeeklyPlan();
  await loadToday();
  await loadStats();
});

// ---------- Onboarding (shown once, right after first signup) ----------
let onboardingGetter = null;

async function openOnboarding() {
  await ensureLibraryLoaded();
  const res = await fetch(`${API}/workout/weekly-schedule`, { headers: authHeaders() });
  const data = await res.json();
  onboardingGetter = renderPlanBuilder(document.getElementById("onboarding-builder"), data.days);
  document.getElementById("onboarding-error").textContent = "";
  document.getElementById("onboarding-overlay").classList.remove("hidden");
}

document.getElementById("onboarding-skip-btn").addEventListener("click", () => {
  document.getElementById("onboarding-overlay").classList.add("hidden");
});

document.getElementById("onboarding-save-btn").addEventListener("click", async () => {
  const errorEl = document.getElementById("onboarding-error");
  errorEl.textContent = "";
  const days = onboardingGetter();
  if (!planIsFullyValid(days)) {
    errorEl.textContent = "Every day needs to be either a rest day or have at least one muscle group picked.";
    return;
  }
  const res = await fetch(`${API}/workout/weekly-schedule`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ days }),
  });
  const data = await res.json();
  if (!res.ok) {
    errorEl.textContent = data.error || "Could not save your plan.";
    return;
  }
  document.getElementById("onboarding-overlay").classList.add("hidden");
  await loadToday();
  await loadStats();
});

// ---------- Groups: list, create, join ----------
let currentGroupId = null;
let currentGroupIsAdmin = false;
let chatPollTimer = null;

document.getElementById("create-group-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("new-group-name").value.trim();
  if (!name) return;
  const res = await fetch(`${API}/groups/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  if (res.ok) {
    document.getElementById("new-group-name").value = "";
    loadGroups();
  }
});

document.getElementById("join-group-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const inviteCode = document.getElementById("join-group-code").value.trim();
  if (!inviteCode) return;
  const res = await fetch(`${API}/groups/join`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ inviteCode }),
  });
  const data = await res.json();
  if (res.ok) {
    document.getElementById("join-group-code").value = "";
    loadGroups();
  } else {
    alert(data.error || "Could not join that group.");
  }
});

async function loadGroups() {
  const res = await fetch(`${API}/groups/mine`, { headers: authHeaders() });
  if (res.status === 401) return handleAuthExpired();
  const data = await res.json();
  const list = document.getElementById("groups-list");
  list.innerHTML = "";
  if (data.groups.length === 0) {
    list.innerHTML = `<p class="hint">No groups yet — create one or join a friend's with their invite code.</p>`;
  }
  data.groups.forEach((g) => {
    const card = document.createElement("div");
    card.className = "group-card";
    card.innerHTML = `
      <div>
        <div class="g-name">${g.name}</div>
        <div class="g-meta">${g.memberCount} member${g.memberCount === 1 ? "" : "s"} · code: ${g.inviteCode}</div>
      </div>
      <span>›</span>
    `;
    card.addEventListener("click", () => openGroup(g.id, g.name, g.inviteCode));
    list.appendChild(card);
  });
}

function openGroup(id, name, inviteCode) {
  currentGroupId = id;
  document.getElementById("groups-list-panel").classList.add("hidden");
  document.getElementById("group-detail-panel").classList.remove("hidden");
  document.getElementById("group-detail-name").textContent = name;
  document.getElementById("group-invite-display").textContent = `Invite code: ${inviteCode}`;
  switchGroupTab("chat");
  loadChat();
  if (chatPollTimer) clearInterval(chatPollTimer);
  chatPollTimer = setInterval(() => {
    if (currentGroupId && !document.getElementById("group-chat-tab").classList.contains("hidden")) {
      loadChat();
    }
  }, 4000);
}

document.getElementById("back-to-groups-btn").addEventListener("click", () => {
  currentGroupId = null;
  if (chatPollTimer) clearInterval(chatPollTimer);
  document.getElementById("group-detail-panel").classList.add("hidden");
  document.getElementById("groups-list-panel").classList.remove("hidden");
  loadGroups();
});

document.querySelectorAll(".group-tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchGroupTab(btn.dataset.gtab));
});

function switchGroupTab(tab) {
  document.querySelectorAll(".group-tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector(`.group-tab-btn[data-gtab="${tab}"]`).classList.add("active");
  document.getElementById("group-chat-tab").classList.toggle("hidden", tab !== "chat");
  document.getElementById("group-leaderboard-tab").classList.toggle("hidden", tab !== "leaderboard");
  document.getElementById("group-manage-tab").classList.toggle("hidden", tab !== "manage");
  if (tab === "leaderboard") loadLeaderboard();
  if (tab === "chat") loadChat();
  if (tab === "manage") loadGroupManage();
}

async function loadChat() {
  if (!currentGroupId) return;
  const res = await fetch(`${API}/groups/${currentGroupId}/messages`, { headers: authHeaders() });
  if (!res.ok) return;
  const data = await res.json();
  const me = localStorage.getItem("forge_username");
  const wrap = document.getElementById("chat-messages");
  const wasAtBottom = wrap.scrollTop + wrap.clientHeight >= wrap.scrollHeight - 20;
  wrap.innerHTML = "";
  data.messages.forEach((m) => {
    const div = document.createElement("div");
    div.className = "chat-msg" + (m.username === me ? " mine" : "");
    const time = new Date(m.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    div.innerHTML = `
      <div class="chat-meta">${m.username} · ${time}</div>
      <div class="chat-bubble">
        ${m.text ? `<div>${escapeHtml(m.text)}</div>` : ""}
        ${m.imageUrl ? `<img src="${m.imageUrl}" alt="Progress selfie" />` : ""}
      </div>
    `;
    wrap.appendChild(div);
  });
  if (wasAtBottom) wrap.scrollTop = wrap.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById("chat-image").addEventListener("change", () => {
  const file = document.getElementById("chat-image").files[0];
  document.getElementById("chat-image-name").textContent = file ? `Attached: ${file.name}` : "";
});

document.getElementById("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentGroupId) return;
  const textInput = document.getElementById("chat-text");
  const imageInput = document.getElementById("chat-image");
  const text = textInput.value.trim();
  const file = imageInput.files[0];
  if (!text && !file) return;

  const formData = new FormData();
  if (text) formData.append("text", text);
  if (file) formData.append("image", file);

  const res = await fetch(`${API}/groups/${currentGroupId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` }, // no Content-Type: let the browser set the multipart boundary
    body: formData,
  });
  if (res.ok) {
    textInput.value = "";
    imageInput.value = "";
    document.getElementById("chat-image-name").textContent = "";
    loadChat();
  }
});

async function loadLeaderboard() {
  if (!currentGroupId) return;
  const res = await fetch(`${API}/groups/${currentGroupId}/leaderboard`, { headers: authHeaders() });
  if (!res.ok) return;
  const data = await res.json();
  const wrap = document.getElementById("leaderboard-list");
  wrap.innerHTML = "";
  data.members.forEach((m) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <span class="lb-name">${m.username}</span>
      <span class="lb-stats">
        <span class="lb-today-pip ${m.completedToday ? "done" : ""}" title="${m.completedToday ? "Done today" : "Not done today"}"></span>
        ${m.badges} badge${m.badges === 1 ? "" : "s"}
        <span class="lb-streak">${m.streak}🔥</span>
      </span>
    `;
    wrap.appendChild(row);
  });
}

// ---------- Group management: rename + remove members (admin/creator only) ----------
async function loadGroupManage() {
  if (!currentGroupId) return;
  const res = await fetch(`${API}/groups/${currentGroupId}`, { headers: authHeaders() });
  if (!res.ok) return;
  const data = await res.json();
  currentGroupIsAdmin = data.isAdmin;

  const renameInput = document.getElementById("rename-group-input");
  renameInput.value = data.name;
  renameInput.disabled = !data.isAdmin;
  document.querySelector("#rename-group-form button").disabled = !data.isAdmin;

  const note = document.getElementById("manage-permission-note");
  note.textContent = data.isAdmin
    ? "You created this group, so you can rename it and remove members."
    : "Only the group's creator can rename it or remove members.";

  const memberList = document.getElementById("member-list");
  memberList.innerHTML = "";
  const me = localStorage.getItem("forge_username");
  data.members.forEach((m) => {
    const row = document.createElement("div");
    row.className = "member-row";
    const isCreator = m.id === data.createdBy;
    row.innerHTML = `
      <span>${m.username}${m.username === me ? " (you)" : ""} ${isCreator ? '<span class="admin-tag">· creator</span>' : ""}</span>
    `;
    if (data.isAdmin && !isCreator) {
      const btn = document.createElement("button");
      btn.className = "remove-member-btn";
      btn.textContent = "Remove";
      btn.addEventListener("click", () => removeMember(m.id, m.username));
      row.appendChild(btn);
    }
    memberList.appendChild(row);
  });
}

document.getElementById("rename-group-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentGroupId || !currentGroupIsAdmin) return;
  const name = document.getElementById("rename-group-input").value.trim();
  if (!name) return;
  const res = await fetch(`${API}/groups/${currentGroupId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (res.ok) {
    document.getElementById("group-detail-name").textContent = data.name;
  } else {
    alert(data.error || "Could not rename the group.");
  }
});

async function removeMember(userId, username) {
  if (!confirm(`Remove ${username} from this group?`)) return;
  const res = await fetch(`${API}/groups/${currentGroupId}/remove-member`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (res.ok) {
    loadGroupManage();
  } else {
    alert(data.error || "Could not remove that member.");
  }
}

// ---------- Boot ----------
if (getToken()) {
  showApp(false);
}
