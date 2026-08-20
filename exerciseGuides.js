// Step-by-step technique cues per movement pattern, shown in the exercise detail
// modal alongside the line-art illustration. Written at the pattern level since
// most variations within a pattern (e.g. wide push-ups vs push-ups) share the
// same core technique.

const EXERCISE_GUIDES = {
  pushup: [
    "Start in a high plank, hands slightly wider than shoulder-width.",
    "Keep your body in one straight line from head to heels — don't let your hips sag or pike up.",
    "Bend your elbows to lower your chest toward the floor.",
    "Push back up to the start without locking your elbows out hard.",
  ],
  plank: [
    "Rest on your forearms and toes, elbows under your shoulders.",
    "Squeeze your glutes and core to keep a straight line from head to heels.",
    "Don't let your hips drop or rise — imagine balancing a cup of water on your lower back.",
    "Breathe steadily and hold for the target time.",
  ],
  squat: [
    "Stand with feet shoulder-width apart, toes slightly turned out.",
    "Push your hips back and bend your knees as if sitting into a chair.",
    "Keep your chest up and knees tracking over your toes, not caving in.",
    "Go as low as comfortable, then drive through your heels to stand back up.",
  ],
  lunge: [
    "Stand tall, then step one leg back (or forward) into a split stance.",
    "Lower your back knee toward the floor, keeping your front knee over your ankle.",
    "Keep your torso upright throughout the movement.",
    "Push through your front heel to return to standing, then switch legs.",
  ],
  bridge: [
    "Lie on your back, knees bent, feet flat on the floor hip-width apart.",
    "Squeeze your glutes and press through your heels to lift your hips up.",
    "Form a straight line from shoulders to knees at the top — don't overextend your lower back.",
    "Lower back down with control and repeat.",
  ],
  curl: [
    "Stand tall holding your weight (or band) with palms facing forward.",
    "Keep your elbows pinned close to your sides throughout.",
    "Curl the weight up toward your shoulders, squeezing at the top.",
    "Lower slowly and with control — don't let it drop.",
  ],
  raise: [
    "Stand with a slight bend in your knees, weight in each hand.",
    "Keep a soft bend in your elbows as you lift your arms out or forward.",
    "Raise to about shoulder height — no higher — leading with your elbows.",
    "Lower with control rather than letting gravity do it.",
  ],
  row: [
    "Hinge forward at the hips with a flat back, or loop a band/towel around a stable anchor.",
    "Pull your elbows back and squeeze your shoulder blades together.",
    "Keep your core braced so your lower back doesn't round.",
    "Return to the start with control.",
  ],
  dip: [
    "Sit on the edge of a sturdy chair, hands gripping the edge beside your hips.",
    "Walk your feet out and lower your hips toward the floor by bending your elbows.",
    "Keep your elbows pointing backward, not flaring out to the sides.",
    "Push back up until your arms are straight, without locking out hard.",
  ],
  wristcurl: [
    "Sit and rest your forearm on your thigh or a table, wrist hanging off the edge.",
    "Hold a light weight or book with your palm facing up.",
    "Curl your wrist up slowly, then lower it back down under control.",
    "Keep the movement slow — this is a small muscle group, so control matters more than speed.",
  ],
  carry: [
    "Pick up a weight (or heavy bag) in each hand at your sides.",
    "Stand tall with your shoulders back and core braced.",
    "Walk at a steady pace, keeping the weights from swinging.",
    "Set down with control when the time or distance is up.",
  ],
  hold: [
    "Get into the target position (e.g. wall sit or handstand hold).",
    "Keep your breathing steady rather than holding your breath.",
    "Brace your core and hold the position for the target duration.",
    "Ease out of the position with control rather than collapsing.",
  ],
  calf: [
    "Stand tall, feet hip-width apart, near a wall for balance if needed.",
    "Rise up onto the balls of your feet as high as you can.",
    "Pause briefly at the top and squeeze your calves.",
    "Lower back down slowly rather than dropping.",
  ],
  superman: [
    "Lie face down with arms extended in front of you.",
    "Simultaneously lift your arms, chest, and legs a few inches off the floor.",
    "Squeeze your glutes and lower back at the top of the movement.",
    "Lower back down with control.",
  ],
  birddog: [
    "Start on hands and knees, wrists under shoulders, knees under hips.",
    "Extend one arm forward and the opposite leg back at the same time.",
    "Keep your hips and shoulders square to the floor — avoid twisting.",
    "Hold briefly, return to start, then switch sides.",
  ],
  pike: [
    "Start in a high plank, then walk your feet toward your hands to raise your hips.",
    "Your body should form an inverted V shape.",
    "Bend your elbows to lower the top of your head toward the floor.",
    "Push back up through your hands to the starting pike position.",
  ],
  twist: [
    "Sit with your knees bent, leaning back slightly, feet on or near the floor.",
    "Keep your chest lifted and core engaged rather than rounding your back.",
    "Rotate your torso side to side, letting your hands or elbows follow.",
    "Move with control — this is about rotation, not speed.",
  ],
  legraise: [
    "Lie on your back with your legs extended and hands at your sides or under your hips.",
    "Keep your lower back pressed toward the floor throughout.",
    "Raise your legs up toward the ceiling, keeping them fairly straight.",
    "Lower them back down slowly without letting your back arch.",
  ],
  sideplank: [
    "Lie on your side, propped up on one forearm, elbow under your shoulder.",
    "Stack your feet and lift your hips so your body forms a straight line.",
    "Keep your hips lifted and core braced for the target time.",
    "Lower with control, then switch sides.",
  ],
  mountainclimber: [
    "Start in a high plank position, hands under shoulders.",
    "Drive one knee toward your chest, then quickly switch legs.",
    "Keep your hips low and core tight — don't let your hips bounce up.",
    "Keep a steady, controlled rhythm rather than rushing the reps.",
  ],
  generic: [
    "Set up in a stable, controlled starting position.",
    "Move through the full range of motion with control.",
    "Focus on the target muscle rather than momentum.",
    "Breathe steadily throughout the set.",
  ],
};

function getExerciseGuide(pattern) {
  return EXERCISE_GUIDES[pattern] || EXERCISE_GUIDES.generic;
}
