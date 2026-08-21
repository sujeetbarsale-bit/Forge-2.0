const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } = require("../data/exerciseLibrary");

const router = express.Router();

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

function buildPrompt(goal) {
  const groupList = MUSCLE_GROUPS.map((g) => `"${g}" (${MUSCLE_GROUP_LABELS[g]})`).join(", ");
  return `You are a home-workout scheduling assistant. A user has described their fitness goal below. Build them a 7-day weekly training schedule using ONLY these muscle group keys: ${groupList}.

User's goal: "${goal}"

Rules:
- Every day (monday through sunday) must appear in your answer.
- Each day is either a rest day, or has 1-3 muscle groups from the list above.
- Include at least 1 rest day and no more than 6 training days.
- Tailor the emphasis to their stated goal (e.g. more "core" and frequent full-body days for fat-loss-oriented goals, more even split across all groups for general strength/shape goals, avoid overloading the same group on consecutive days where reasonable).
- Do not invent muscle groups outside the list given.

Respond with ONLY raw JSON, no markdown code fences, no commentary, matching exactly this shape:
{
  "days": {
    "monday": {"isRestDay": false, "groups": ["chest","triceps"]},
    "tuesday": {"isRestDay": false, "groups": ["back","biceps"]},
    "wednesday": {"isRestDay": true, "groups": []},
    "thursday": {"isRestDay": false, "groups": ["legs","core"]},
    "friday": {"isRestDay": false, "groups": ["shoulders","core"]},
    "saturday": {"isRestDay": false, "groups": ["core"]},
    "sunday": {"isRestDay": true, "groups": []}
  },
  "rationale": "One short paragraph (2-3 sentences) explaining why this schedule fits their goal."
}`;
}

function extractJson(text) {
  // Models sometimes wrap JSON in code fences despite instructions — strip if present.
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

function validatePlan(days) {
  if (!days || typeof days !== "object") return false;
  for (const key of DAY_KEYS) {
    const d = days[key];
    if (!d || typeof d !== "object") return false;
    if (d.isRestDay) continue;
    if (!Array.isArray(d.groups) || d.groups.length === 0 || d.groups.length > 3) return false;
    if (!d.groups.every((g) => MUSCLE_GROUPS.includes(g))) return false;
  }
  return true;
}

router.post("/plan", requireAuth, async (req, res) => {
  const goal = (req.body.goal || "").trim();
  if (!goal) {
    return res.status(400).json({ error: "Tell us your goal first — e.g. \"reduce belly fat\" or \"build overall strength\"." });
  }
  if (goal.length > 300) {
    return res.status(400).json({ error: "That goal description is a bit long — try summarizing it in a sentence or two." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "AI plan generation isn't configured on this server yet. An ANTHROPIC_API_KEY environment variable needs to be set.",
    });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 600,
        messages: [{ role: "user", content: buildPrompt(goal) }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic API error:", response.status, errBody);
      return res.status(502).json({ error: "The AI planning service couldn't be reached right now. Try again in a moment." });
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === "text");
    if (!textBlock) {
      return res.status(502).json({ error: "The AI response didn't include a usable plan. Try again." });
    }

    let parsed;
    try {
      parsed = extractJson(textBlock.text);
    } catch (e) {
      console.error("Failed to parse AI plan JSON:", textBlock.text);
      return res.status(502).json({ error: "Couldn't understand the AI's response. Try rephrasing your goal or try again." });
    }

    if (!validatePlan(parsed.days)) {
      return res.status(502).json({ error: "The AI produced an invalid plan. Try again, or rephrase your goal." });
    }

    // Normalize shape so groups is always [] on rest days
    const days = {};
    DAY_KEYS.forEach((k) => {
      const d = parsed.days[k];
      days[k] = d.isRestDay ? { isRestDay: true, groups: [] } : { isRestDay: false, groups: d.groups };
    });

    res.json({
      days,
      rationale: typeof parsed.rationale === "string" ? parsed.rationale.slice(0, 800) : "",
    });
  } catch (err) {
    console.error("AI plan generation failed:", err);
    res.status(500).json({ error: "Something went wrong generating your plan. Please try again." });
  }
});

module.exports = router;
