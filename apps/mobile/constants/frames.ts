// Avatar frame definitions — unlock with Style Stars (⭐)
export type Frame = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number; // Style Stars (0 = free)
  colors: string[]; // gradient or solid for the frame ring
};

export const FRAMES: Frame[] = [
  {
    id: 'default',
    name: 'Pencil',
    emoji: '✏️',
    description: 'Classic, clean, always in style.',
    cost: 0,
    colors: ['#FF6B6B', '#FF6B6B'],
  },
  {
    id: 'star',
    name: 'Starry',
    emoji: '⭐',
    description: 'For the shiniest doodlers.',
    cost: 50,
    colors: ['#FACC15', '#F59E0B'],
  },
  {
    id: 'flame',
    name: 'On Fire',
    emoji: '🔥',
    description: 'Your drawings are 🔥.',
    cost: 100,
    colors: ['#F97316', '#EF4444'],
  },
  {
    id: 'crown',
    name: 'Royal',
    emoji: '👑',
    description: 'Reserved for true drawing royalty.',
    cost: 200,
    colors: ['#8B5CF6', '#6D28D9'],
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    emoji: '🌈',
    description: 'All the colours. All of them.',
    cost: 350,
    colors: ['#22C55E', '#3B82F6'],
  },
];

export function getFrame(id: string): Frame {
  return FRAMES.find(f => f.id === id) ?? FRAMES[0];
}
