import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [visualizerHeights, setVisualizerHeights] = useState(Array(20).fill(10));
  
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const intervalRef = useRef(null);
  const beatIntervalRef = useRef(null);
  const lyricIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const schedulerRef = useRef(null);
  
  const BPM = 130; // Brazilian Phonk typical BPM
  const BEAT_DURATION = 60000 / BPM;
  const SONG_DURATION = 60000; // 60 seconds loop
  
  const lyrics = [
    { text: "Vee é um robô safado", duration: 3000 },
    { text: "Ele pega", duration: 1500 },
    { text: "Ele chuta", duration: 1500 },
    { text: "E ele faz tudo de maldadeeee", duration: 4000 },
    { text: "🎵 La la la 🎵", duration: 2000, isLalala: true },
    { text: "🎵 La la la 🎵", duration: 2000, isLalala: true },
    { text: "🎵 La la la 🎵", duration: 2000, isLalala: true },
    { text: "🎵 La la la 🎵", duration: 2000, isLalala: true },
  ];

  const createAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = volume;
    }
    return audioContextRef.current;
  }, [volume]);

  // Phonk kick drum
  const playKick = useCallback((time) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(gainNodeRef.current);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
    
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    osc.start(time);
    osc.stop(time + 0.3);
  }, []);

  // 808 bass
  const play808 = useCallback((time, freq = 55) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const distortion = ctx.createWaveShaper();
    
    // Create distortion curve for that dirty 808 sound
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = Math.tanh(x * 2);
    }
    distortion.curve = curve;
    
    osc.connect(distortion);
    distortion.connect(gain);
    gain.connect(gainNodeRef.current);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + 0.4);
    
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    osc.start(time);
    osc.stop(time + 0.5);
  }, []);

  // Hi-hat
  const playHiHat = useCallback((time, open = false) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = open ? 7000 : 10000;
    
    const gain = ctx.createGain();
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(gainNodeRef.current);
    
    gain.gain.setValueAtTime(open ? 0.15 : 0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + (open ? 0.15 : 0.05));
    
    noise.start(time);
    noise.stop(time + (open ? 0.15 : 0.05));
  }, []);

  // Snare/Clap
  const playSnare = useCallback((time) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    // Noise part
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 3000;
    
    const noiseGain = ctx.createGain();
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNodeRef.current);
    
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    noise.start(time);
    noise.stop(time + 0.2);
    
    // Tone part
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    osc.connect(oscGain);
    oscGain.connect(gainNodeRef.current);
    
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);
    
    oscGain.gain.setValueAtTime(0.4, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  // Cowbell - signature phonk sound
  const playCowbell = useCallback((time) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(filter);
    filter.connect(gainNodeRef.current);
    
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    
    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.value = 587;
    osc2.frequency.value = 845;
    
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.3);
    osc2.stop(time + 0.3);
  }, []);

  // Main phonk beat pattern scheduler
  const scheduleBeat = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !isPlaying) return;
    
    const currentTime = ctx.currentTime;
    const beatDuration = 60 / BPM;
    
    // Schedule 4 beats ahead
    for (let i = 0; i < 16; i++) {
      const time = currentTime + (i * beatDuration / 4);
      const beat = i % 16;
      
      // Kick on 1, 5, 9, 13 (every beat)
      if (beat % 4 === 0) {
        playKick(time);
        play808(time, beat === 0 ? 55 : beat === 8 ? 46 : 55);
      }
      
      // Snare/Clap on 4, 12 (2 and 4)
      if (beat === 4 || beat === 12) {
        playSnare(time);
      }
      
      // Hi-hats - typical phonk pattern
      if (beat % 2 === 0) {
        playHiHat(time, beat % 4 === 2);
      }
      
      // Cowbell on off-beats for that phonk flavor
      if (beat === 2 || beat === 6 || beat === 10 || beat === 14) {
        playCowbell(time);
      }
    }
  }, [isPlaying, playKick, play808, playSnare, playHiHat, playCowbell]);

  const updateVisualizer = useCallback(() => {
    if (isPlaying) {
      setVisualizerHeights(prev => 
        prev.map(() => Math.random() * 50 + 10)
      );
    } else {
      setVisualizerHeights(Array(20).fill(10));
    }
  }, [isPlaying]);

  const startMusic = useCallback(() => {
    const ctx = createAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    setIsPlaying(true);
    startTimeRef.current = Date.now();
    setCurrentLyricIndex(0);
    setProgress(0);
    
    // Beat scheduler
    schedulerRef.current = setInterval(() => {
      scheduleBeat();
    }, (60 / BPM) * 4 * 1000); // Schedule every 4 beats
    
    // Initial beat
    scheduleBeat();
    
    // Beat indicator
    beatIntervalRef.current = setInterval(() => {
      setBeatIndex(prev => (prev + 1) % 4);
    }, BEAT_DURATION);
    
    // Progress update
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const prog = (elapsed % SONG_DURATION) / SONG_DURATION * 100;
      setProgress(prog);
      
      // Reset at end of loop
      if (elapsed >= SONG_DURATION) {
        startTimeRef.current = Date.now();
        setCurrentLyricIndex(0);
      }
    }, 100);
    
    // Lyric progression
    let lyricTime = 0;
    let currentIdx = 0;
    
    const advanceLyric = () => {
      if (!isPlaying) return;
      
      setCurrentLyricIndex(currentIdx);
      const duration = lyrics[currentIdx].duration;
      
      lyricTime += duration;
      currentIdx = (currentIdx + 1) % lyrics.length;
      
      lyricIntervalRef.current = setTimeout(advanceLyric, duration);
    };
    
    lyricIntervalRef.current = setTimeout(advanceLyric, 100);
  }, [createAudioContext, scheduleBeat, BEAT_DURATION, lyrics, isPlaying]);

  const stopMusic = useCallback(() => {
    setIsPlaying(false);
    
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current);
    }
    if (lyricIntervalRef.current) {
      clearTimeout(lyricIntervalRef.current);
    }
    
    setBeatIndex(0);
    setProgress(0);
    setCurrentLyricIndex(0);
  }, []);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // Visualizer animation
  useEffect(() => {
    const visualizerInterval = setInterval(updateVisualizer, 100);
    return () => clearInterval(visualizerInterval);
  }, [updateVisualizer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMusic();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopMusic]);

  const currentLyric = lyrics[currentLyricIndex];

  return (
    <>
      <Head>
        <title>🤖 VEE - Brazilian Phonk | Robô Safado</title>
        <meta name="description" content="Brazilian Phonk beat generator - Vee é um robô safado" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>" />
      </Head>
      
      <div className="background-effects">
        {Array(15).fill(null).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 2 === 0 ? '#ff00ff' : '#00ffff',
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      
      <main className="container">
        <div className="robot-emoji">🤖</div>
        <h1 className="title">VEE - Robô Safado</h1>
        <p className="subtitle">🇧🇷 Brazilian Phonk 🇧🇷</p>
        
        <div className="player-container">
          <div className="visualizer">
            {visualizerHeights.map((height, i) => (
              <div
                key={i}
                className={`visualizer-bar ${isPlaying ? 'active' : ''}`}
                style={{ 
                  height: `${height}px`,
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>
          
          <div className="lyrics-container">
            <p className={`lyrics ${currentLyric?.isLalala ? 'lalala' : ''}`}>
              {currentLyric?.text || "Aperte PLAY para começar! 🎵"}
            </p>
          </div>
          
          <div className="controls">
            {!isPlaying ? (
              <button className="btn btn-play" onClick={startMusic}>
                ▶ PLAY
              </button>
            ) : (
              <button className="btn btn-stop" onClick={stopMusic}>
                ⏹ STOP
              </button>
            )}
          </div>
          
          <div className="beat-indicator">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`beat-dot ${isPlaying && beatIndex === i ? 'active' : ''}`}
              />
            ))}
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="volume-control">
            <span>🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="volume-slider"
            />
          </div>
          
          <div className="bpm-display">
            {BPM} BPM | BRAZILIAN PHONK
          </div>
        </div>
        
        <p className="footer">
          🎧 Created with Web Audio API | Turn up the volume! 🔊
        </p>
      </main>
    </>
  );
}
