import { useRef, useState, useMemo, useEffect } from "react";
import "./index.css";
const BASE = import.meta.env.BASE_URL;
const a = (file) => `${BASE}Audio/${file}`;

const TRACKS = [
  { id: 1,  title: "01", src: a("1_Asereje.m4a") },
  { id: 2,  title: "02", src: a("2_Rebelde.m4a") },
  { id: 3,  title: "03", src: a("3_Despacito.m4a") },
  { id: 4,  title: "04", src: a("4_Torero.m4a") },
  { id: 5,  title: "05", src: a("5_La_Bikina.m4a") },
  { id: 6,  title: "06", src: a("6_Adios_Amor.m4a") },
  { id: 7,  title: "07", src: a("7_SiNoMeVes.m4a") },
  { id: 8,  title: "08", src: a("8_Shabadaba.m4a") },
  { id: 9,  title: "09", src: a("9_Mienteme.m4a") },
  { id: 10, title: "10", src: a("10_Yo_Quiero_Chupar.m4a") },
  { id: 11, title: "11", src: a("11_Shrakira.m4a") },
  { id: 12, title: "12", src: a("12_Angel.m4a") },
  { id: 13, title: "13", src: a("13_Boda.m4a") },
  { id: 14, title: "14", src: a("14_Muriendo_Lento.m4a") },
  { id: 15, title: "15", src: a("15_Halloween.m4a") },
];


export default function AudioTrainer() {
  const audioRef = useRef(null);
  const [currentId, setCurrentId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [normalizeOn, setNormalizeOn] = useState(true);

  // Web Audio
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const compRef = useRef(null);
  const gainRef = useRef(null);

  // para distinguir click vs doble clic
  const clickTimerRef = useRef(null);
  const CLICK_DELAY = 220; // ms para decidir entre 1x y 2x clic

  const ensureAudioGraph = () => {
    if (audioCtxRef.current) return;
    const a = audioRef.current;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const src = ctx.createMediaElementSource(a);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 30;
    comp.ratio.value = 6;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;

    const gain = ctx.createGain();
    gain.gain.value = 1.0;

    audioCtxRef.current = ctx;
    sourceRef.current = src;
    compRef.current = comp;
    gainRef.current = gain;

    updateRouting(normalizeOn);
  };

  const updateRouting = (useComp) => {
    if (!sourceRef.current || !gainRef.current || !audioCtxRef.current) return;
    try { sourceRef.current.disconnect(); } catch {}
    try { compRef.current?.disconnect(); } catch {}
    try { gainRef.current.disconnect(); } catch {}

    if (useComp && compRef.current) {
      sourceRef.current.connect(compRef.current);
      compRef.current.connect(gainRef.current);
      gainRef.current.connect(audioCtxRef.current.destination);
    } else {
      sourceRef.current.connect(gainRef.current);
      gainRef.current.connect(audioCtxRef.current.destination);
    }
  };

  const playTrackFromStart = (track) => {
    const a = audioRef.current;
    if (!a) return;
    ensureAudioGraph();
    a.src = track.src;
    a.currentTime = 0;
    a.play().then(() => {
      setCurrentId(track.id);
      setIsPlaying(true);
    }).catch(() => setIsPlaying(false));
  };

  const resume = () => {
    const a = audioRef.current;
    if (!a) return;
    ensureAudioGraph();
    a.play().then(() => setIsPlaying(true));
  };

  const pause = () => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    setIsPlaying(false);
  };

  const restart = (track) => {
    const a = audioRef.current;
    if (!a) return;
    ensureAudioGraph();
    // si cambia de pista con doble clic, cámbiala y reinicia
    if (!currentId || currentId !== track.id) {
      a.src = track.src;
      setCurrentId(track.id);
    }
    a.currentTime = 0;
    a.play().then(() => setIsPlaying(true));
  };

  // SINGLE CLICK: play otra pista / toggle play-pause misma pista
  const handleSingleClick = (track) => {
    if (currentId !== track.id) {
      playTrackFromStart(track); // otra pista → reproducir
    } else {
      // misma pista: toggle play/pause
      if (isPlaying) pause();
      else resume();
    }
  };

  // DOUBLE CLICK: reinicia
  const handleDoubleClick = (track) => {
    restart(track);
  };

  const handleTileClick = (track) => {
    // Si hay timer pendiente, es el 2º click → doble clic
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      handleDoubleClick(track);
      return;
    }
    // Primer clic: espera por si hay segundo clic
    clickTimerRef.current = setTimeout(() => {
      handleSingleClick(track);
      clickTimerRef.current = null;
    }, CLICK_DELAY);
  };

  return (
    <div className="page">
      <h2>Audio Trainer</h2>
      <p className="subtitle">1 clic: play/pausa · 2 clics: reiniciar</p>

      <div className="grid">
        {TRACKS.map((t) => {
          const active = currentId === t.id && isPlaying;
          return (
            <button
              key={t.id}
              onClick={() => handleTileClick(t)}
              title={t.title}
              className={`tile ${active ? "active" : ""}`}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, lineHeight: 1.2 }}>{t.title}</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>#{t.id}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="footer">
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={normalizeOn}
            onChange={(e) => {
              const on = e.target.checked;
              setNormalizeOn(on);
              ensureAudioGraph();
              updateRouting(on);
            }}
          />
          Normalizar
        </label>

        <strong>Volumen</strong>
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          defaultValue="1"
          className="stretch"
          onChange={(e) => {
            ensureAudioGraph();
            if (gainRef.current) gainRef.current.gain.value = Number(e.target.value);
          }}
        />

        <span className="subtitle">{isPlaying ? "Reproduciendo" : "Detenido"}</span>
      </div>

      <audio
        ref={audioRef}
        preload="metadata"
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
    </div>
  );
}