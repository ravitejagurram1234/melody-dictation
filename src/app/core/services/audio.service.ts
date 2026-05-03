import { Injectable } from '@angular/core';
import { InstrumentType, midiToFrequency } from '../../shared/models/game.model';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private ctx!: AudioContext;
  private masterGain!: GainNode;
  private compressor!: DynamicsCompressorNode;

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -20;
      this.compressor.knee.value = 10;
      this.compressor.ratio.value = 4;
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playNote(midi: number, instrument: InstrumentType, duration: number = 0.6): Promise<void> {
    const ctx = this.ensureContext();
    const freq = midiToFrequency(midi);
    const now = ctx.currentTime;

    switch (instrument) {
      case 'piano': return this.playModernPiano(ctx, freq, now, duration);
      case 'classic-piano': return this.playClassicPiano(ctx, freq, now, duration);
      case 'guitar': return this.playGuitar(ctx, freq, now, duration);
      case 'flute': return this.playFlute(ctx, freq, now, duration);
      case 'synth-pad': return this.playSynthPad(ctx, freq, now, duration);
    }
  }

  async playMelody(notes: number[], instrument: InstrumentType, tempo: number): Promise<void> {
    const ctx = this.ensureContext();
    const noteDuration = tempo / 1000;

    for (let i = 0; i < notes.length; i++) {
      this.playNote(notes[i], instrument, noteDuration * 0.85);
      if (i < notes.length - 1) {
        await this.wait(tempo);
      }
    }
    // Wait for last note to finish
    await this.wait(tempo * 0.5);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ─── Modern Piano: Bright triangle wave + harmonics + fast decay ───
  private playModernPiano(ctx: AudioContext, freq: number, now: number, dur: number): Promise<void> {
    const output = ctx.createGain();
    output.gain.value = 0;
    output.connect(this.masterGain);

    // Fundamental
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.value = freq;

    // 2nd harmonic
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    const g2 = ctx.createGain();
    g2.gain.value = 0.3;

    // 3rd harmonic
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = freq * 3;
    const g3 = ctx.createGain();
    g3.gain.value = 0.1;

    osc1.connect(output);
    osc2.connect(g2).connect(output);
    osc3.connect(g3).connect(output);

    // Piano envelope: fast attack, quick decay, low sustain
    output.gain.setValueAtTime(0, now);
    output.gain.linearRampToValueAtTime(0.6, now + 0.008);
    output.gain.exponentialRampToValueAtTime(0.3, now + 0.1);
    output.gain.exponentialRampToValueAtTime(0.01, now + dur);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + dur);
    osc2.stop(now + dur);
    osc3.stop(now + dur);

    return this.wait(dur * 1000);
  }

  // ─── Classic Piano: Warmer, rounder tone with longer sustain ───
  private playClassicPiano(ctx: AudioContext, freq: number, now: number, dur: number): Promise<void> {
    const output = ctx.createGain();
    output.gain.value = 0;
    output.connect(this.masterGain);

    // Warm fundamental
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;

    // Soft 2nd harmonic
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    const g2 = ctx.createGain();
    g2.gain.value = 0.4;

    // Very soft 3rd
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = freq * 3;
    const g3 = ctx.createGain();
    g3.gain.value = 0.15;

    // Sub-octave for warmth
    const osc4 = ctx.createOscillator();
    osc4.type = 'sine';
    osc4.frequency.value = freq * 0.5;
    const g4 = ctx.createGain();
    g4.gain.value = 0.1;

    // Low-pass filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(freq * 6, 5000);
    filter.Q.value = 0.7;

    osc1.connect(filter);
    osc2.connect(g2).connect(filter);
    osc3.connect(g3).connect(filter);
    osc4.connect(g4).connect(filter);
    filter.connect(output);

    // Classic piano: medium attack, longer decay, warm sustain
    output.gain.setValueAtTime(0, now);
    output.gain.linearRampToValueAtTime(0.55, now + 0.012);
    output.gain.exponentialRampToValueAtTime(0.35, now + 0.08);
    output.gain.exponentialRampToValueAtTime(0.15, now + dur * 0.6);
    output.gain.exponentialRampToValueAtTime(0.01, now + dur);

    osc1.start(now); osc2.start(now); osc3.start(now); osc4.start(now);
    osc1.stop(now + dur); osc2.stop(now + dur); osc3.stop(now + dur); osc4.stop(now + dur);

    return this.wait(dur * 1000);
  }

  // ─── Guitar: Karplus-Strong plucked string synthesis ───
  private playGuitar(ctx: AudioContext, freq: number, now: number, dur: number): Promise<void> {
    const sampleRate = ctx.sampleRate;
    const samples = Math.ceil(sampleRate * dur);
    const delayLength = Math.round(sampleRate / freq);
    const buffer = ctx.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    // Initialize with noise burst
    for (let i = 0; i < delayLength; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.8;
    }

    // Karplus-Strong: average adjacent samples with damping
    const damping = 0.996;
    for (let i = delayLength; i < samples; i++) {
      data[i] = damping * 0.5 * (data[i - delayLength] + data[i - delayLength + 1]);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const output = ctx.createGain();
    output.gain.value = 0.8;
    source.connect(output);
    output.connect(this.masterGain);

    source.start(now);
    source.stop(now + dur);

    return this.wait(dur * 1000);
  }

  // ─── Flute: Sine + breath noise + vibrato ───
  private playFlute(ctx: AudioContext, freq: number, now: number, dur: number): Promise<void> {
    const output = ctx.createGain();
    output.gain.value = 0;
    output.connect(this.masterGain);

    // Pure tone
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    // Vibrato
    const vibrato = ctx.createOscillator();
    vibrato.type = 'sine';
    vibrato.frequency.value = 5;
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.value = freq * 0.008;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    // Breath noise
    const noiseLength = ctx.sampleRate * dur;
    const noiseBuffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i++) {
      noiseData[i] = (Math.random() * 2 - 1);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = freq * 2;
    noiseFilter.Q.value = 2;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.04;

    noise.connect(noiseFilter).connect(noiseGain).connect(output);
    osc.connect(output);

    // Flute envelope: gradual attack, steady sustain
    output.gain.setValueAtTime(0, now);
    output.gain.linearRampToValueAtTime(0.45, now + 0.08);
    output.gain.setValueAtTime(0.45, now + dur - 0.1);
    output.gain.linearRampToValueAtTime(0, now + dur);

    osc.start(now); vibrato.start(now); noise.start(now);
    osc.stop(now + dur); vibrato.stop(now + dur); noise.stop(now + dur);

    return this.wait(dur * 1000);
  }

  // ─── Synth Pad: Detuned sawtooths + low-pass filter + slow attack ───
  private playSynthPad(ctx: AudioContext, freq: number, now: number, dur: number): Promise<void> {
    const output = ctx.createGain();
    output.gain.value = 0;
    output.connect(this.masterGain);

    // Two detuned sawtooths for thickness
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = freq * 1.005; // slight detune

    const osc3 = ctx.createOscillator();
    osc3.type = 'sawtooth';
    osc3.frequency.value = freq * 0.995;

    // Low-pass filter with slow sweep
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 2;
    filter.frequency.linearRampToValueAtTime(freq * 3, now + dur * 0.3);
    filter.frequency.linearRampToValueAtTime(freq * 1.5, now + dur);

    const mix = ctx.createGain();
    mix.gain.value = 0.35;

    osc1.connect(mix);
    osc2.connect(mix);
    osc3.connect(mix);
    mix.connect(filter);
    filter.connect(output);

    // Pad envelope: slow attack, long sustain, gradual release
    output.gain.setValueAtTime(0, now);
    output.gain.linearRampToValueAtTime(0.5, now + 0.15);
    output.gain.setValueAtTime(0.5, now + dur - 0.2);
    output.gain.linearRampToValueAtTime(0, now + dur);

    osc1.start(now); osc2.start(now); osc3.start(now);
    osc1.stop(now + dur); osc2.stop(now + dur); osc3.stop(now + dur);

    return this.wait(dur * 1000);
  }
}
