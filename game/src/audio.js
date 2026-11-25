// audio.js — all sound is synthesised with the Web Audio API: short blips and
// sizzles, no audio files, no network. Created lazily on the first user
// gesture so the browser's autoplay rules stay happy.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gainValue, when = 0) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function sizzle(dur = 0.25) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime;
    const len = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.25;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    src.connect(filter);
    filter.connect(ac.destination);
    src.start(t0);
  }

  return {
    setMuted(value) { muted = value; },
    isMuted() { return muted; },
    unlock() { ensure(); },
    play(name) {
      if (muted) return;
      switch (name) {
        case 'pickup': tone(520, 0.08, 'sine', 0.12); break;
        case 'chop': tone(180, 0.07, 'square', 0.1); tone(140, 0.06, 'square', 0.08, 0.02); break;
        case 'chop-done': tone(660, 0.1, 'sine', 0.14); tone(880, 0.12, 'sine', 0.12, 0.08); break;
        case 'grill-start': sizzle(0.3); break;
        case 'plate': tone(440, 0.09, 'triangle', 0.14); break;
        case 'serve': tone(523, 0.12, 'sine', 0.16); tone(659, 0.12, 'sine', 0.16, 0.1); tone(784, 0.2, 'sine', 0.16, 0.2); break;
        case 'serve-fail': tone(220, 0.18, 'sawtooth', 0.08); break;
        case 'bin': tone(300, 0.1, 'square', 0.07); break;
        case 'order': tone(392, 0.1, 'sine', 0.1); tone(494, 0.12, 'sine', 0.1, 0.09); break;
        case 'missed': tone(330, 0.2, 'sawtooth', 0.08); tone(262, 0.25, 'sawtooth', 0.08, 0.15); break;
        case 'start': tone(523, 0.1, 'sine', 0.14); tone(659, 0.1, 'sine', 0.14, 0.09); tone(784, 0.18, 'sine', 0.14, 0.18); break;
        default: break;
      }
    },
  };
}
