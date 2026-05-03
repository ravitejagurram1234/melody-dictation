import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { ProgressService } from '../../core/services/progress.service';
import {
  INSTRUMENTS, LEVEL_CONFIGS, InstrumentType, DifficultyLevel, InstrumentOption, LevelConfig
} from '../../shared/models/game.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <!-- Header -->
      <header class="hero">
        <div class="logo-mark">♪</div>
        <h1 class="title">Melody Dictation</h1>
        <p class="subtitle">Hear it. Replay it. Master it.</p>
      </header>

      <!-- Stats bar -->
      @if (progress.progress().totalGamesPlayed > 0) {
        <div class="stats-bar">
          <div class="stat">
            <span class="stat-value">{{ progress.progress().totalGamesPlayed }}</span>
            <span class="stat-label">Games</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ (progress.getOverallAccuracy() * 100) | number:'1.0-0' }}%</span>
            <span class="stat-label">Accuracy</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ progress.progress().totalCorrect }}</span>
            <span class="stat-label">Perfect</span>
          </div>
        </div>
      }

      <!-- Instrument Selection -->
      <section class="section">
        <h2 class="section-title">Choose Instrument</h2>
        <div class="instrument-grid">
          @for (inst of instruments; track inst.id) {
            <button
              class="instrument-card"
              [class.selected]="selectedInstrument() === inst.id"
              (click)="selectInstrument(inst.id)">
              <span class="inst-icon">{{ inst.icon }}</span>
              <span class="inst-name">{{ inst.name }}</span>
              <span class="inst-desc">{{ inst.description }}</span>
            </button>
          }
        </div>
      </section>

      <!-- Level Selection -->
      <section class="section">
        <h2 class="section-title">Choose Level</h2>
        <div class="level-grid">
          @for (lvl of levels; track lvl.level) {
            <button
              class="level-card"
              [class.selected]="selectedLevel() === lvl.level"
              (click)="selectLevel(lvl.level)">
              <div class="level-header">
                <span class="level-number">{{ lvl.level }}</span>
                <span class="level-name">{{ lvl.name }}</span>
              </div>
              <span class="level-desc">{{ lvl.description }}</span>
              @if (getHighScore(lvl.level) > 0) {
                <span class="level-high">Best: {{ getHighScore(lvl.level) }}</span>
              }
            </button>
          }
        </div>
      </section>

      <!-- Start Button -->
      <button class="btn-start" (click)="startGame()">
        <span class="btn-start-icon">▶</span>
        Start Game
      </button>
    </div>
  `,
  styles: [`
    .home-container {
      width: 100%;
      max-width: 720px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
      padding-bottom: 48px;
    }

    .hero {
      text-align: center;
      padding: 40px 0 16px;
    }

    .logo-mark {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.9;
    }

    .title {
      font-size: 2.2rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }

    .subtitle {
      margin-top: 8px;
      color: var(--text-secondary);
      font-size: 1.05rem;
      font-weight: 300;
    }

    .stats-bar {
      display: flex;
      gap: 32px;
      padding: 16px 32px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .stat-value {
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--accent-primary);
      font-family: var(--font-mono);
    }
    .stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section {
      width: 100%;
    }

    .section-title {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-secondary);
      margin-bottom: 14px;
      padding-left: 4px;
    }

    .instrument-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
    }

    .instrument-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 16px 12px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--bg-elevated);
        border-color: var(--border-active);
        transform: translateY(-2px);
      }

      &.selected {
        background: var(--accent-glow);
        border-color: var(--accent-primary);
        box-shadow: var(--shadow-glow);
      }

      .inst-icon { font-size: 1.6rem; }
      .inst-name {
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--text-primary);
      }
      .inst-desc {
        font-size: 0.7rem;
        color: var(--text-muted);
      }
    }

    .level-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
    }

    .level-card {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 14px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      text-align: left;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--bg-elevated);
        border-color: var(--border-active);
        transform: translateY(-2px);
      }

      &.selected {
        background: var(--accent-glow);
        border-color: var(--accent-primary);
        box-shadow: var(--shadow-glow);
      }

      .level-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .level-number {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-elevated);
        border-radius: 50%;
        font-size: 0.75rem;
        font-weight: 700;
        font-family: var(--font-mono);
        color: var(--accent-primary);
      }

      .level-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .level-desc {
        font-size: 0.72rem;
        color: var(--text-muted);
        line-height: 1.3;
      }

      .level-high {
        font-size: 0.7rem;
        color: var(--accent-warm);
        font-family: var(--font-mono);
      }
    }

    .btn-start {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 40px;
      background: linear-gradient(135deg, var(--accent-primary), #29b6f6);
      color: var(--bg-primary);
      font-size: 1.1rem;
      font-weight: 700;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-md), 0 0 24px rgba(79, 195, 247, 0.3);
      letter-spacing: 0.02em;
      margin-top: 8px;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg), 0 0 32px rgba(79, 195, 247, 0.4);
      }

      .btn-start-icon {
        font-size: 0.9rem;
      }
    }
  `]
})
export class HomeComponent {
  instruments = INSTRUMENTS;
  levels = LEVEL_CONFIGS;

  selectedInstrument = signal<InstrumentType>('piano');
  selectedLevel = signal<DifficultyLevel>(1);

  constructor(
    private gameService: GameService,
    public progress: ProgressService
  ) {}

  selectInstrument(id: InstrumentType): void {
    this.selectedInstrument.set(id);
  }

  selectLevel(level: DifficultyLevel): void {
    this.selectedLevel.set(level);
  }

  getHighScore(level: number): number {
    return this.progress.getHighScore(level, this.selectedInstrument());
  }

  startGame(): void {
    this.gameService.startGame(this.selectedLevel(), this.selectedInstrument());
  }
}
