import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { KeyboardComponent } from '../../shared/components/keyboard/keyboard.component';
import { LEVEL_CONFIGS, midiToNoteName } from '../../shared/models/game.model';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, KeyboardComponent],
  template: `
    <div class="game-container">
      @if (game.state(); as s) {
        <!-- Top Bar -->
        <div class="top-bar">
          <button class="btn-back" (click)="goHome()">
            <span>←</span> Exit
          </button>
          <div class="round-info">
            <span class="round-label">Round</span>
            <span class="round-value">{{ s.round }} / {{ s.totalRounds }}</span>
          </div>
          <div class="score-display">
            <span class="score-label">Score</span>
            <span class="score-value">{{ s.score }}</span>
          </div>
        </div>

        <!-- Phase Indicator -->
        <div class="phase-card" [class]="'phase-' + s.phase">
          @switch (s.phase) {
            @case ('listening') {
              <div class="phase-content">
                <div class="pulse-ring" [class.active]="s.isPlaying"></div>
                <span class="phase-icon">{{ s.isPlaying ? '♫' : '⏳' }}</span>
                <span class="phase-text">{{ s.isPlaying ? 'Listen carefully...' : 'Preparing melody...' }}</span>
              </div>
            }
            @case ('input') {
              <div class="phase-content">
                <span class="phase-icon">🎹</span>
                <span class="phase-text">Your turn — play the melody!</span>
                <div class="note-progress">
                  @for (dot of noteSlots(); track $index) {
                    <div class="note-dot" [class.filled]="$index < s.playerInput.length"></div>
                  }
                </div>
              </div>
            }
            @case ('feedback') {
              <div class="phase-content">
                <span class="phase-icon">{{ feedbackIcon() }}</span>
                <span class="phase-text">{{ feedbackText() }}</span>
                <div class="feedback-notes">
                  @for (note of game.feedbackNotes(); track $index) {
                    <span class="fb-note" [class.correct]="note.correct" [class.wrong]="!note.correct">
                      {{ getNoteNameAt($index) }}
                    </span>
                  }
                </div>
              </div>
            }
          }
        </div>

        <!-- Controls -->
        <div class="controls">
          <button
            class="btn-secondary"
            [disabled]="s.replaysLeft <= 0 || s.isPlaying || s.phase === 'feedback'"
            (click)="game.replay()">
            🔄 Replay ({{ s.replaysLeft }})
          </button>
          <button
            class="btn-secondary"
            [disabled]="s.playerInput.length === 0 || s.phase !== 'input'"
            (click)="game.removeLastNote()">
            ⌫ Undo
          </button>
        </div>

        <!-- Keyboard -->
        <app-keyboard
          [startMidi]="keyboardRange().min"
          [endMidi]="keyboardRange().max"
          [disabled]="s.phase !== 'input' || s.isPlaying"
          [activeNotes]="[]"
          (notePressed)="game.addNote($event)">
        </app-keyboard>
      } @else {
        <div class="loading">
          <p>Loading game...</p>
          <button class="btn-primary" (click)="goHome()">Back to Home</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .game-container {
      width: 100%;
      max-width: 800px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }

    .btn-back {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 0.85rem;

      &:hover {
        color: var(--text-primary);
        border-color: var(--border-active);
      }
    }

    .round-info, .score-display {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .round-label, .score-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }
    .round-value {
      font-size: 1rem;
      font-weight: 600;
      font-family: var(--font-mono);
      color: var(--text-primary);
    }
    .score-value {
      font-size: 1.1rem;
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--accent-warm);
    }

    .phase-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 28px 24px;
      text-align: center;
      transition: all var(--transition-smooth);

      &.phase-listening {
        border-color: rgba(79, 195, 247, 0.3);
        background: linear-gradient(135deg, var(--bg-card), rgba(79, 195, 247, 0.05));
      }
      &.phase-input {
        border-color: rgba(255, 183, 77, 0.3);
        background: linear-gradient(135deg, var(--bg-card), rgba(255, 183, 77, 0.05));
      }
      &.phase-feedback {
        border-color: rgba(102, 187, 106, 0.3);
      }
    }

    .phase-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .pulse-ring {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid var(--accent-primary);
      opacity: 0.3;

      &.active {
        animation: pulse 1s ease-in-out infinite;
        opacity: 1;
      }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.15); opacity: 1; }
    }

    .phase-icon {
      font-size: 2rem;
    }

    .phase-text {
      font-size: 1rem;
      color: var(--text-secondary);
      font-weight: 400;
    }

    .note-progress {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .note-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      transition: all var(--transition-fast);

      &.filled {
        background: var(--accent-primary);
        border-color: var(--accent-primary);
        box-shadow: 0 0 8px rgba(79, 195, 247, 0.4);
      }
    }

    .feedback-notes {
      display: flex;
      gap: 6px;
      margin-top: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .fb-note {
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-family: var(--font-mono);
      font-weight: 600;

      &.correct {
        background: rgba(102, 187, 106, 0.15);
        color: var(--accent-success);
        border: 1px solid rgba(102, 187, 106, 0.3);
      }
      &.wrong {
        background: rgba(239, 83, 80, 0.15);
        color: var(--accent-error);
        border: 1px solid rgba(239, 83, 80, 0.3);
      }
    }

    .controls {
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    .loading {
      text-align: center;
      padding: 60px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: var(--text-secondary);
    }
  `]
})
export class GameComponent {
  constructor(
    public game: GameService,
    private router: Router
  ) {}

  noteSlots = computed(() => Array(this.game.expectedLength()));

  keyboardRange = computed(() => {
    const s = this.game.state();
    if (!s) return { min: 48, max: 84 };
    const config = LEVEL_CONFIGS[s.level - 1];
    return { min: config.noteRange.min, max: config.noteRange.max };
  });

  feedbackIcon = computed(() => {
    const notes = this.game.feedbackNotes();
    if (notes.length === 0) return '⏳';
    const allCorrect = notes.every(n => n.correct);
    const accuracy = notes.filter(n => n.correct).length / notes.length;
    if (allCorrect) return '🎉';
    if (accuracy >= 0.5) return '👍';
    return '💪';
  });

  feedbackText = computed(() => {
    const notes = this.game.feedbackNotes();
    if (notes.length === 0) return 'Checking...';
    const allCorrect = notes.every(n => n.correct);
    const accuracy = notes.filter(n => n.correct).length / notes.length;
    if (allCorrect) return 'Perfect!';
    if (accuracy >= 0.7) return 'Almost there!';
    if (accuracy >= 0.4) return 'Good effort!';
    return 'Keep practicing!';
  });

  getNoteNameAt(index: number): string {
    const s = this.game.state();
    if (!s) return '';
    return midiToNoteName(s.melody[index]);
  }

  goHome(): void {
    this.game.state.set(null);
    this.router.navigate(['/']);
  }
}
