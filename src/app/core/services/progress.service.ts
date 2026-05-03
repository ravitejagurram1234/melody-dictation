import { Injectable, signal } from '@angular/core';
import { GameResult, PlayerProgress } from '../../shared/models/game.model';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly STORAGE_KEY = 'melody-dictation-progress';

  readonly progress = signal<PlayerProgress>(this.load());

  saveResult(result: GameResult): void {
    const current = this.progress();
    const key = `${result.level}-${result.instrument}`;
    const existingHigh = current.highScores[key] || 0;

    const updated: PlayerProgress = {
      highScores: {
        ...current.highScores,
        [key]: Math.max(existingHigh, result.totalScore)
      },
      totalGamesPlayed: current.totalGamesPlayed + 1,
      totalCorrect: current.totalCorrect + result.rounds.filter(r => r.correct).length,
      totalAttempted: current.totalAttempted + result.rounds.length,
      lastPlayed: Date.now()
    };

    this.progress.set(updated);
    this.save(updated);
  }

  getHighScore(level: number, instrument: string): number {
    return this.progress().highScores[`${level}-${instrument}`] || 0;
  }

  getOverallAccuracy(): number {
    const p = this.progress();
    if (p.totalAttempted === 0) return 0;
    return p.totalCorrect / p.totalAttempted;
  }

  private load(): PlayerProgress {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      highScores: {},
      totalGamesPlayed: 0,
      totalCorrect: 0,
      totalAttempted: 0,
      lastPlayed: 0
    };
  }

  private save(progress: PlayerProgress): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    } catch {}
  }
}
