const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readDB, writeDB } = require("../db");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();
const SESSION_LIFETIME = "3h"; // auto-logout after 3 hours for security

function suggestUsernames(base, db) {
  const taken = new Set(db.users.map((u) => u.username.toLowerCase()));
  const cleanBase = base.replace(/[^a-zA-Z0-9_]/g, "") || "user";
  const candidates = [
    `${cleanBase}${new Date().getFullYear()}`,
    `${cleanBase}_1`,
    `${cleanBase}${Math.floor(Math.random() * 90 + 10)}`,
    `${cleanBase}_${Math.floor(Math.random() * 900 + 100)}`,
    `the_real_${cleanBase}`,
  ];
  const suggestions = [];
  for (const c of candidates) {
    if (!taken.has(c.toLowerCase()) && !suggestions.includes(c)) suggestions.push(c);
    if (suggestions.length >= 3) break;
  }
  let guard = 0;
  while (suggestions.length < 3 && guard < 50) {
    const c = `${cleanBase}${Math.floor(Math.random() * 10000)}`;
    if (!taken.has(c.toLowerCase()) && !suggestions.includes(c)) suggestions.push(c);
    guard++;
  }
  return suggestions;
}

router.post("/register", async (req, res) => {
  const { username, password, passwordHint } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  if (passwordHint && passwordHint.length > 200) {
    return res.status(400).json({ error: "Password hint is too long." });
  }

  const db = readDB();
  const existing = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (existing) {
    return res.status(409).json({
      error: "That username is already taken.",
      suggestions: suggestUsernames(username, db),
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    username,
    passwordHash,
    passwordHint: passwordHint ? passwordHint.trim() : null,
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  writeDB(db);

  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: SESSION_LIFETIME });
  res.json({ token, username: newUser.username, isNewUser: true });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const db = readDB();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: SESSION_LIFETIME });
  res.json({ token, username: user.username, isNewUser: false });
});

// Lightweight self-service recovery: look up the hint the user set at signup
// to jog their memory. Note: this app has no email/SMS, so there's no identity
// verification beyond knowing the username — fine for a small personal/friends
// app, but worth knowing if this ever grows into something more public.
router.post("/password-hint", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username is required." });

  const db = readDB();
  const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "No account found with that username." });
  }
  res.json({ found: true, hint: user.passwordHint || null });
});

router.post("/reset-password", async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ error: "Username and new password are required." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const db = readDB();
  const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "No account found with that username." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  writeDB(db);
  res.json({ success: true });
});

module.exports = router;
