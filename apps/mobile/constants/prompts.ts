// Sketchbook 1: First Day Doodles — 30 starter prompts
export const SKETCHBOOK_1_PROMPTS = [
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

export function getRandomPrompt(): string {
  return SKETCHBOOK_1_PROMPTS[Math.floor(Math.random() * SKETCHBOOK_1_PROMPTS.length)];
}

export function getDailyPrompt(): string {
  const dayIndex = Math.floor(Date.now() / 86400000) % SKETCHBOOK_1_PROMPTS.length;
  return SKETCHBOOK_1_PROMPTS[dayIndex];
}
