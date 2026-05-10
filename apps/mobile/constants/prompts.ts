// ─── Sketchbook 1: First Day Doodles (levels 1-3) ────────────────────────────
// Theme: everyday objects and situations with a silly twist
export const SKETCHBOOK_1_PROMPTS = [
  // Level 1 — Warm-up (easiest)
  "A cat wearing a hat",
  "Your dream breakfast",
  "A cloud with a face",
  "The coolest sneaker ever",
  "A house made of pizza",
  "A dog driving a car",
  "Your superhero costume",
  "A fish riding a bicycle",
  "The world's biggest sandwich",
  "A robot eating spaghetti",
  // Level 2 — Getting warmed up
  "A sun wearing sunglasses",
  "A snail in a race car",
  "Your pet (real or imaginary)",
  "A tree that grows candy",
  "A penguin at the beach",
  "The scariest vegetable",
  "A clock that melted",
  "Your perfect treehouse",
  "A banana doing yoga",
  "A monster under the bed (but friendly)",
  // Level 3 — First Day veteran
  "A peanut butter and jellyfish sandwich",
  "A dinosaur at school",
  "The moon eating ice cream",
  "A tiny elephant in a teacup",
  "A dragon who's afraid of fire",
  "Your favorite number as a character",
  "A shoe with wings",
  "The most boring superhero",
  "A tornado made of donuts",
  "A cow jumping over a skyscraper",
];

// ─── Sketchbook 2: Animal Antics (levels 4-6) ────────────────────────────────
// Theme: real and made-up animals doing unexpected things
export const SKETCHBOOK_2_PROMPTS = [
  // Level 4 — Animal Newbie
  "A bear who runs a bakery",
  "A giraffe trying to fit through a door",
  "A very tiny T-Rex with very tiny arms",
  "A shark who is scared of fish",
  "Two penguins having a dance-off",
  "A rabbit who is also a wizard",
  "An octopus playing the drums",
  "A sloth winning a race",
  "A cat who thinks it's a dog",
  "A fox opening a lemonade stand",
  // Level 5 — Animal Adventurer
  "A grumpy owl at a birthday party",
  "A hamster driving a monster truck",
  "A parrot who only says the wrong words",
  "A hippo in a tutu",
  "A frog who wants to be a chef",
  "A whale doing homework",
  "A gorilla who loves knitting",
  "A hedgehog who collects balloons",
  "A flamingo trying to look serious",
  "A mole who found buried treasure",
  // Level 6 — Animal Antics Master
  "A penguin on a surfboard",
  "A snake who tied itself in a knot",
  "A koala who is a professional wrestler",
  "A crab who lost their keys",
  "A deer who is also a DJ",
  "An axolotl running for president",
  "A narwhal in a swimming pool",
  "A capybara at a fancy restaurant",
  "A platypus trying to explain what it is",
  "A group of ants lifting a sofa",
];

// ─── Sketchbook 3: Food Fight (levels 7-9) ───────────────────────────────────
// Theme: food with personality — it fights back, has feelings, goes on adventures
export const SKETCHBOOK_3_PROMPTS = [
  // Level 7 — Food Starter
  "A pizza slice running away",
  "A hot dog winning a trophy",
  "A cupcake who is very angry",
  "An avocado having an identity crisis",
  "Spaghetti that is alive",
  "A taco that is also a superhero",
  "A donut with a hole-shaped personality",
  "A watermelon that is way too big for the fridge",
  "A sandwich that doesn't want to be eaten",
  "Ice cream melting dramatically",
  // Level 8 — Food Fighter
  "A carrot who lifts weights",
  "A burrito rolled up too tight to move",
  "A french fry who is lost and alone",
  "A grape who thinks it's a raisin",
  "Broccoli disguised as a tree",
  "A cookie who broke in half and is devastated",
  "A popcorn kernel who is afraid of the microwave",
  "A piece of toast with only one face",
  "An onion making everyone around it cry",
  "A pea who escaped from the pod",
  // Level 9 — Food Fight Champion
  "A strawberry with a secret",
  "A soup that is too hot to handle",
  "A fortune cookie with bad news",
  "A birthday cake with too many candles",
  "An egg who refused to be scrambled",
  "A pretzel who got twisted doing yoga",
  "A chilli pepper who is embarrassed about how spicy it is",
  "Cheese that ran away with the moon",
  "A lemon making the best of it",
  "The world's smallest gingerbread house",
];

// ─── Unified export ───────────────────────────────────────────────────────────
export const PROMPTS = SKETCHBOOK_1_PROMPTS; // default pool for multiplayer random picks

export const ALL_PROMPTS = [
  ...SKETCHBOOK_1_PROMPTS,
  ...SKETCHBOOK_2_PROMPTS,
  ...SKETCHBOOK_3_PROMPTS,
];

// Sketchbook metadata
export const SKETCHBOOKS = [
  {
    id: 1,
    title: 'First Day Doodles',
    emoji: '✏️',
    description: 'Warm up your pencil with everyday silliness',
    color: '#FF6B6B',
    levels: 3,
    prompts: SKETCHBOOK_1_PROMPTS,
    unlocksAtSparks: 0,
  },
  {
    id: 2,
    title: 'Animal Antics',
    emoji: '🦊',
    description: 'Real and made-up animals doing unexpected things',
    color: '#4ECDC4',
    levels: 3,
    prompts: SKETCHBOOK_2_PROMPTS,
    unlocksAtSparks: 150,
  },
  {
    id: 3,
    title: 'Food Fight',
    emoji: '🍕',
    description: 'Food with personality — and attitude',
    color: '#FFD93D',
    levels: 3,
    prompts: SKETCHBOOK_3_PROMPTS,
    unlocksAtSparks: 400,
  },
] as const;

// Level metadata: 3 levels per sketchbook, 10 prompts each
export function getPromptsForLevel(sketchbook: number, level: number): string[] {
  const sb = SKETCHBOOKS.find(s => s.id === sketchbook);
  if (!sb) return [];
  const startIdx = (level - 1) * 10;
  return sb.prompts.slice(startIdx, startIdx + 10);
}

export function getRandomPrompt(): string {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

export function getDailyPrompt(): string {
  const dayIndex = Math.floor(Date.now() / 86400000) % ALL_PROMPTS.length;
  return ALL_PROMPTS[dayIndex];
}
