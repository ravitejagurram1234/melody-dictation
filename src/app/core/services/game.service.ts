import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AudioService } from './audio.service';
import { ProgressService } from './progress.service';
import {
  GameState, DifficultyLevel, InstrumentType,
  LEVEL_CONFIGS, RoundResult, GameResult, isBlackKey
} from '../../shared/models/game.model';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly ROUNDS_PER_GAME = 5;

  // Signals
  readonly state = signal<GameState | null>(null);
  readonly roundResults = signal<RoundResult[]>([]);
  readonly feedbackNotes = signal<{ index: number; correct: boolean }[]>([]);

  readonly isPlaying = computed(() => this.state()?.isPlaying ?? false);
  readonly phase = computed(() => this.state()?.phase ?? 'listening');
  readonly currentRound = computed(() => this.state()?.round ?? 0);
  readonly totalRounds = computed(() => this.state()?.totalRounds ?? 0);
  readonly replaysLeft = computed(() => this.state()?.replaysLeft ?? 0);
  readonly playerInput = computed(() => this.state()?.playerInput ?? []);
  readonly expectedLength = computed(() => this.state()?.melody.length ?? 0);
  readonly score = computed(() => this.state()?.score ?? 0);

  constructor(
    private audio: AudioService,
    private progress: ProgressService,
    private router: Router
  ) {}

  startGame(level: DifficultyLevel, instrument: InstrumentType): void {
    const config = LEVEL_CONFIGS[level - 1];
    const melody = this.generateMelody(config.noteCount, config.noteRange, config.allowSharps);

    this.roundResults.set([]);
    this.feedbackNotes.set([]);

    this.state.set({
      level,
      instrument,
      round: 1,
      totalRounds: this.ROUNDS_PER_GAME,
      melody,
      playerInput: [],
      replaysLeft: config.maxReplays,
      score: 0,
      isPlaying: false,
      phase: 'listening'
    });

    // Auto-play the melody after a brief pause
    setTimeout(() => this.playCurrentMelody(), 600);
  }

  async playCurrentMelody(): Promise<void> {
    const s = this.state();
    if (!s || s.isPlaying) return;

    this.state.set({ ...s, isPlaying: true, phase: 'listening' });

    const config = LEVEL_CONFIGS[s.level - 1];
    await this.audio.playMelody(s.melody, s.instrument, config.tempo);

    this.state.update(curr => curr ? { ...curr, isPlaying: false, phase: 'input' } : null);
  }

  async replay(): Promise<void> {
    const s = this.state();
    if (!s || s.isPlaying || s.replaysLeft <= 0) return;

    this.state.set({ ...s, replaysLeft: s.replaysLeft - 1 });
    await this.playCurrentMelody();
  }

  async addNote(midi: number): Promise<void> {
    const s = this.state();
    if (!s || s.phase !== 'input' || s.isPlaying) return;

    // Play the note for feedback
    const config = LEVEL_CONFIGS[s.level - 1];
    this.audio.playNote(midi, s.instrument, config.tempo / 1000 * 0.7);

    const newInput = [...s.playerInput, midi];
    this.state.set({ ...s, playerInput: newInput });

    // Check if player has entered all notes
    if (newInput.length === s.melody.length) {
      await this.evaluateRound(newInput);
    }
  }

  removeLastNote(): void {
    const s = this.state();
    if (!s || s.phase !== 'input' || s.playerInput.length === 0) return;
    this.state.set({ ...s, playerInput: s.playerInput.slice(0, -1) });
  }

  private async evaluateRound(input: number[]): Promise<void> {
    const s = this.state()!;
    this.state.set({ ...s, phase: 'feedback', isPlaying: true });

    // Calculate accuracy
    let correctCount = 0;
    const feedback: { index: number; correct: boolean }[] = [];

    for (let i = 0; i < s.melody.length; i++) {
      const correct = input[i] === s.melody[i];
      if (correct) correctCount++;
      feedback.push({ index: i, correct });
    }

    this.feedbackNotes.set(feedback);

    const accuracy = correctCount / s.melody.length;
    const roundScore = Math.round(accuracy * 100);
    const roundResult: RoundResult = {
      melody: s.melody,
      playerInput: input,
      correct: accuracy === 1,
      accuracy
    };

    const newResults = [...this.roundResults(), roundResult];
    this.roundResults.set(newResults);

    // Wait to show feedback
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if game is over
    if (s.round >= s.totalRounds) {
      this.finishGame(newResults, s);
    } else {
      this.nextRound(s, roundScore);
    }
  }

  private nextRound(s: GameState, roundScore: number): void {
    const config = LEVEL_CONFIGS[s.level - 1];
    const newMelody = this.generateMelody(config.noteCount, config.noteRange, config.allowSharps);

    this.feedbackNotes.set([]);
    this.state.set({
      ...s,
      round: s.round + 1,
      melody: newMelody,
      playerInput: [],
      replaysLeft: config.maxReplays,
      score: s.score + roundScore,
      isPlaying: false,
      phase: 'listening'
    });

    setTimeout(() => this.playCurrentMelody(), 800);
  }

  private finishGame(results: RoundResult[], s: GameState): void {
    const totalScore = results.reduce((sum, r) => sum + Math.round(r.accuracy * 100), 0);
    const maxScore = results.length * 100;
    const accuracy = totalScore / maxScore;

    const gameResult: GameResult = {
      level: s.level,
      instrument: s.instrument,
      rounds: results,
      totalScore,
      maxScore,
      accuracy,
      timestamp: Date.now()
    };

    this.progress.saveResult(gameResult);
    this.state.set(null);
    this.router.navigate(['/result'], { state: { result: gameResult } });
  }

  private generateMelody(count: number, range: { min: number; max: number }, allowSharps: boolean): number[] {
    const melody: number[] = [];
    const available: number[] = [];

    for (let midi = range.min; midi <= range.max; midi++) {
      if (!allowSharps && isBlackKey(midi)) continue;
      available.push(midi);
    }

    // Start with a random note
    melody.push(available[Math.floor(Math.random() * available.length)]);

    // Generate subsequent notes with stepwise motion bias
    for (let i = 1; i < count; i++) {
      const lastNote = melody[i - 1];
      const maxInterval = count <= 4 ? 4 : 7; // Smaller intervals for easier levels

      // Filter notes within reasonable interval
      const candidates = available.filter(n => {
        const interval = Math.abs(n - lastNote);
        return interval >= 1 && interval <= maxInterval && n !== lastNote;
      });

      if (candidates.length === 0) {
        melody.push(available[Math.floor(Math.random() * available.length)]);
      } else {
        // Bias toward stepwise motion (intervals of 1-2)
        const weighted = candidates.flatMap(n => {
          const interval = Math.abs(n - lastNote);
          if (interval <= 2) return [n, n, n]; // 3x weight for steps
          if (interval <= 4) return [n, n]; // 2x weight for small leaps
          return [n]; // 1x weight for larger leaps
        });
        melody.push(weighted[Math.floor(Math.random() * weighted.length)]);
      }
    }

    return melody;
  }
}
