const ADJECTIVES = [
  'Sunny', 'Cosmic', 'Dizzy', 'Funky', 'Speedy', 'Bouncy', 'Wiggly', 'Zany',
  'Fluffy', 'Sparkly', 'Grumpy', 'Sneaky', 'Wobbly', 'Zippy', 'Jumpy', 'Silly',
  'Dragon', 'Thunder', 'Shadow', 'Golden', 'Frozen', 'Mighty', 'Tiny', 'Giant',
  'Neon', 'Turbo', 'Mega', 'Ultra', 'Hyper', 'Super',
];

const NOUNS = [
  'Penguin', 'Taco', 'Rocket', 'Waffle', 'Noodle', 'Pickle', 'Muffin', 'Burrito',
  'Panda', 'Llama', 'Narwhal', 'Platypus', 'Gecko', 'Hamster', 'Capybara', 'Axolotl',
  'Chef', 'Wizard', 'Ninja', 'Pilot', 'Artist', 'Dancer', 'Juggler', 'Explorer',
  'Comet', 'Meteor', 'Nebula', 'Galaxy', 'Quasar', 'Pulsar',
];

export function generateUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${adj}${noun}${num}`;
}
