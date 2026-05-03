import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameResult, midiToNoteName, INSTRUMENTS, LEVEL_CONFIGS } from '../../shared/models/game.model';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="result-container">
      @if (result) {
        <div class="result-card">
          <div class="result-header">
            <span class="trophy">{{ trophy }}</span>
            <h1 class="result-title">{{ title }}</h1>
            <p class="result-subtitle">{{ instrumentName }} · {{ levelName }}</p>
          </div>

          <div class="score-ring">
            <svg viewBox="0 0 120 120" class="ring-svg">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-elevated)" stroke-width="8"/>
              <circle cx="60" cy="60" r="52" fill="none"
                [attr.stroke]="ringColor"
                stroke-width="8"
                stroke-linecap="round"
                [attr.stroke-dasharray]="circumference"
                [attr.stroke-dashoffset]="dashOffset"
                transform="rotate(-90 60 60)"/>
            </svg>
            <div class="score-text">
              <span class="score-percent">{{ (result.accuracy * 100) | number:'1.0-0' }}%</span>
              <span class="score-label">Accuracy</span>
            </div>
          </div>

          <div class="stats-row">
            <div class="stat-block">
              <span class="stat-num">{{ result.totalScore }}</span>
              <span class="stat-lbl">Score</span>
            </div>
            <div class="stat-block">
              <span class="stat-num">{{ perfectRounds }}</span>
              <span class="stat-lbl">Perfect</span>
            </div>
            <div class="stat-block">
              <span class="stat-num">{{ result.rounds.length }}</span>
              <span class="stat-lbl">Rounds</span>
            </div>
          </div>

          <!-- Round Details -->
          <div class="rounds-detail">
            @for (round of result.rounds; track $index) {
              <div class="round-row" [class.perfect]="round.correct">
                <span class="round-num">#{{ $index + 1 }}</span>
                <div class="round-notes">
                  @for (note of round.melody; track $index) {
                    <span class="note-badge"
                      [class.correct]="round.playerInput[$index] === note"
                      [class.wrong]="round.playerInput[$index] !== note">
                      {{ midiToNoteName(note) }}
                    </span>
                  }
                </div>
                <span class="round-acc">{{ (round.accuracy * 100) | number:'1.0-0' }}%</span>
              </div>
            }
          </div>

          <div class="actions">
            <button class="btn-primary" (click)="playAgain()">Play Again</button>
            <button class="btn-secondary" (click)="goHome()">Home</button>
          </div>
        </div>
      } @else {
        <div class="no-result">
          <p>No result to display.</p>
          <button class="btn-primary" (click)="goHome()">Go Home</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .result-container {
      width: 100%;
      max-width: 600px;
    }

    .result-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      padding: 36px 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .result-header {
      text-align: center;
    }
    .trophy { font-size: 3rem; }
    .result-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-top: 8px;
    }
    .result-subtitle {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-top: 4px;
    }

    .score-ring {
      position: relative;
      width: 140px;
      height: 140px;
    }
    .ring-svg {
      width: 100%;
      height: 100%;
    }
    .score-text {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .score-percent {
      font-size: 1.8rem;
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--text-primary);
    }
    .score-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stats-row {
      display: flex;
      gap: 32px;
    }
    .stat-block {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stat-num {
      font-size: 1.4rem;
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--accent-primary);
    }
    .stat-lbl {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .rounds-detail {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .round-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      border: 1px solid transparent;

      &.perfect {
        border-color: rgba(102, 187, 106, 0.2);
        background: rgba(102, 187, 106, 0.05);
      }
    }

    .round-num {
      font-size: 0.75rem;
      font-family: var(--font-mono);
      color: var(--text-muted);
      min-width: 24px;
    }

    .round-notes {
      flex: 1;
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .note-badge {
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 0.72rem;
      font-family: var(--font-mono);
      font-weight: 600;

      &.correct {
        background: rgba(102, 187, 106, 0.15);
        color: var(--accent-success);
      }
      &.wrong {
        background: rgba(239, 83, 80, 0.15);
        color: var(--accent-error);
      }
    }

    .round-acc {
      font-size: 0.8rem;
      font-family: var(--font-mono);
      font-weight: 600;
      color: var(--text-secondary);
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }

    .no-result {
      text-align: center;
      padding: 60px;
      color: var(--text-secondary);
    }
  `]
})
export class ResultComponent {
  result: GameResult | null = null;
  midiToNoteName = midiToNoteName;

  readonly circumference = 2 * Math.PI * 52;

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    this.result = nav?.extras?.state?.['result'] ?? history.state?.['result'] ?? null;
  }

  get dashOffset(): number {
    if (!this.result) return this.circumference;
    return this.circumference * (1 - this.result.accuracy);
  }

  get ringColor(): string {
    if (!this.result) return 'var(--accent-primary)';
    if (this.result.accuracy >= 0.9) return 'var(--accent-success)';
    if (this.result.accuracy >= 0.6) return 'var(--accent-warm)';
    return 'var(--accent-error)';
  }

  get trophy(): string {
    if (!this.result) return '';
    if (this.result.accuracy >= 0.95) return '🏆';
    if (this.result.accuracy >= 0.8) return '🥈';
    if (this.result.accuracy >= 0.6) return '🥉';
    return '💪';
  }

  get title(): string {
    if (!this.result) return '';
    if (this.result.accuracy >= 0.95) return 'Outstanding!';
    if (this.result.accuracy >= 0.8) return 'Great Job!';
    if (this.result.accuracy >= 0.6) return 'Good Effort!';
    return 'Keep Practicing!';
  }

  get instrumentName(): string {
    if (!this.result) return '';
    return INSTRUMENTS.find(i => i.id === this.result!.instrument)?.name ?? '';
  }

  get levelName(): string {
    if (!this.result) return '';
    return LEVEL_CONFIGS[this.result.level - 1]?.name ?? '';
  }

  get perfectRounds(): number {
    return this.result?.rounds.filter(r => r.correct).length ?? 0;
  }

  playAgain(): void {
    this.router.navigate(['/']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
