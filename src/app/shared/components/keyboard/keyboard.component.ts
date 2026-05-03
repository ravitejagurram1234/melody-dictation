import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isBlackKey, midiToNoteName } from '../../models/game.model';

interface KeyInfo {
  midi: number;
  name: string;
  isBlack: boolean;
  position: number; // left offset in white-key units
}

@Component({
  selector: 'app-keyboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="keyboard-wrapper">
      <div class="keyboard" [style.width.px]="whiteKeys.length * whiteKeyWidth">
        @for (key of whiteKeys; track key.midi) {
          <div
            class="key white-key"
            [class.active]="activeNotes.includes(key.midi)"
            [class.disabled]="disabled"
            [style.left.px]="key.position * whiteKeyWidth"
            (mousedown)="onKeyPress(key.midi)"
            (touchstart.prevent)="onKeyPress(key.midi)">
            <span class="key-label">{{ key.name }}</span>
          </div>
        }
        @for (key of blackKeys; track key.midi) {
          <div
            class="key black-key"
            [class.active]="activeNotes.includes(key.midi)"
            [class.disabled]="disabled"
            [style.left.px]="key.position * whiteKeyWidth - blackKeyWidth / 2"
            (mousedown)="onKeyPress(key.midi)"
            (touchstart.prevent)="onKeyPress(key.midi)">
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .keyboard-wrapper {
      overflow-x: auto;
      padding: 16px 0;
      display: flex;
      justify-content: center;
    }

    .keyboard {
      position: relative;
      height: 160px;
      user-select: none;
    }

    .key {
      position: absolute;
      top: 0;
      border-radius: 0 0 6px 6px;
      cursor: pointer;
      transition: background 80ms ease, transform 80ms ease, box-shadow 80ms ease;
    }

    .white-key {
      width: 44px;
      height: 160px;
      background: linear-gradient(180deg, #fafafa 0%, #e8e8e8 100%);
      border: 1px solid rgba(0, 0, 0, 0.15);
      z-index: 1;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 10px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), inset 0 -2px 4px rgba(0, 0, 0, 0.05);

      &:hover:not(.disabled) {
        background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
        box-shadow: 0 2px 8px rgba(79, 195, 247, 0.3);
      }

      &.active {
        background: linear-gradient(180deg, #e3f2fd 0%, #bbdefb 100%);
        transform: translateY(2px);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .key-label {
        font-size: 10px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.4);
        font-family: var(--font-mono);
      }
    }

    .black-key {
      width: 28px;
      height: 100px;
      background: linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%);
      z-index: 2;
      border-radius: 0 0 4px 4px;
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4), inset 0 -1px 2px rgba(255, 255, 255, 0.05);

      &:hover:not(.disabled) {
        background: linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%);
        box-shadow: 0 3px 10px rgba(79, 195, 247, 0.3);
      }

      &.active {
        background: linear-gradient(180deg, #1565c0 0%, #0d47a1 100%);
        transform: translateY(2px);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }
    }

    .disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class KeyboardComponent {
  @Input() startMidi: number = 48; // C3
  @Input() endMidi: number = 84;   // C6
  @Input() activeNotes: number[] = [];
  @Input() disabled: boolean = false;
  @Output() notePressed = new EventEmitter<number>();

  readonly whiteKeyWidth = 46;
  readonly blackKeyWidth = 28;

  whiteKeys: KeyInfo[] = [];
  blackKeys: KeyInfo[] = [];

  ngOnInit(): void {
    this.buildKeys();
  }

  ngOnChanges(): void {
    this.buildKeys();
  }

  private buildKeys(): void {
    this.whiteKeys = [];
    this.blackKeys = [];
    let whiteIndex = 0;

    for (let midi = this.startMidi; midi <= this.endMidi; midi++) {
      const name = midiToNoteName(midi);
      if (isBlackKey(midi)) {
        this.blackKeys.push({ midi, name, isBlack: true, position: whiteIndex });
      } else {
        this.whiteKeys.push({ midi, name, isBlack: false, position: whiteIndex });
        whiteIndex++;
      }
    }
  }

  onKeyPress(midi: number): void {
    if (this.disabled) return;
    this.notePressed.emit(midi);
  }
}
