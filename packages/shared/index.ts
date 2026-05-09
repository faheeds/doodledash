// Shared types and utilities for Doodle Dash

export type Player = {
  id: string;
  username: string;
  avatarFrame?: string;
};

export type Match = {
  id: string;
  roomCode: string;
  players: Player[];
  status: 'lobby' | 'drawing' | 'voting' | 'results' | 'finished';
  currentRound: number;
  totalRounds: number;
  prompt?: string;
};

export type Drawing = {
  id: string;
  matchId: string;
  playerId: string;
  promptId: string;
  imageUrl?: string;
  aiScore?: number;
  aiFeedback?: string;
  isModerated: boolean;
};

export const GAME_CONSTANTS = {
  DRAW_TIME_SECONDS: 60,
  REVEAL_TIME_SECONDS: 15,
  VOTE_TIME_SECONDS: 20,
  JUDGE_TIME_SECONDS: 5,
  RESULTS_TIME_SECONDS: 10,
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 4,
  ROUNDS_PER_MATCH: 5,
};
