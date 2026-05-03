export type InstrumentType = 'piano' | 'classic-piano' | 'guitar' | 'flute' | 'synth-pad';

export interface InstrumentOption {
  id: InstrumentType;
  name: string;
  icon: string;
  description: string;
}

export const INSTRUMENTS: InstrumentOption[] = [
  { id: 'piano', name: 'Modern Piano', icon: '🎹', description: 'Bright, clear tone' },
  { id: 'classic-piano', name: 'Classic Piano', icon: '🎵', description: 'Warm, rich tone' },
  { id: 'guitar', name: 'Guitar', icon: '🎸', description: 'Plucked strings' },
  { id: 'flute', name: 'Flute', icon: '🎶', description: 'Soft, airy breath' },
  { id: 'synth-pad', name: 'Synth Pad', icon: '🎧', description: 'Smooth electronic' }
];

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface LevelConfig {
  level: DifficultyLevel;
  name: string;
  description: string;
  noteCount: number;
  noteRange: { min: number; max: number }; // MIDI note numbers
  tempo: number; // ms per note
  maxReplays: number;
  allowSharps: boolean;
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1, name: 'Beginner', description: '3 notes · C major · slow tempo',
    noteCount: 3, noteRange: { min: 60, max: 72 }, tempo: 800,
    maxReplays: 5, allowSharps: false
  },
  {
    level: 2, name: 'Easy', description: '4 notes · C major · moderate tempo',
    noteCount: 4, noteRange: { min: 60, max: 76 }, tempo: 650,
    maxReplays: 4, allowSharps: false
  },
  {
    level: 3, name: 'Intermediate', description: '5 notes · with sharps · moderate',
    noteCount: 5, noteRange: { min: 57, max: 79 }, tempo: 550,
    maxReplays: 3, allowSharps: true
  },
  {
    level: 4, name: 'Hard', description: '6 notes · chromatic · faster',
    noteCount: 6, noteRange: { min: 55, max: 81 }, tempo: 450,
    maxReplays: 2, allowSharps: true
  },
  {
    level: 5, name: 'Expert', description: '8 notes · full range · fast',
    noteCount: 8, noteRange: { min: 48, max: 84 }, tempo: 380,
    maxReplays: 1, allowSharps: true
  }
];

export interface GameState {
  level: DifficultyLevel;
  instrument: InstrumentType;
  round: number;
  totalRounds: number;
  melody: number[];
  playerInput: number[];
  replaysLeft: number;
  score: number;
  isPlaying: boolean;
  phase: 'listening' | 'input' | 'feedback';
}

export interface RoundResult {
  melody: number[];
  playerInput: number[];
  correct: boolean;
  accuracy: number;
}

export interface GameResult {
  level: DifficultyLevel;
  instrument: InstrumentType;
  rounds: RoundResult[];
  totalScore: number;
  maxScore: number;
  accuracy: number;
  timestamp: number;
}

export interface PlayerProgress {
  highScores: Record<string, number>; // key: `${level}-${instrument}`
  totalGamesPlayed: number;
  totalCorrect: number;
  totalAttempted: number;
  lastPlayed: number;
}

export function midiToNoteName(midi: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = names[midi % 12];
  return `${note}${octave}`;
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function isBlackKey(midi: number): boolean {
  const n = midi % 12;
  return [1, 3, 6, 8, 10].includes(n);
}
