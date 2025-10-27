import { useRef, useState, useMemo, useEffect } from "react";
import "./index.css";

const TRACKS = [
  { id: 1, title: "1", src: "/Audio/1_Asereje.m4a" },
  { id: 2, title: "2", src: "/Audio/2_Rebelde.m4a" },
  { id: 3, title: "3", src: "/Audio/3_Despacito.m4a" },
  { id: 4, title: "4", src: "/Audio/4_Torero.m4a" },
  { id: 5, title: "5", src: "/Audio/5_La_Bikina.m4a" },
  { id: 6, title: "6", src: "/Audio/6_Adios_Amor.m4a" },
  { id: 7, title: "7", src: "/Audio/7_SiNoMeVes.m4a" },
  { id: 8, title: "8", src: "/Audio/8_Shabadaba.m4a" },
  { id: 9, title: "9", src: "/Audio/9_Mienteme.m4a" },
  { id: 10, title: "10", src: "/Audio/10_Yo_Quiero_Chupar.m4a" },
  { id: 11, title: "11", src: "/Audio/11_Shrakira.m4a" },
  { id: 12, title: "12", src: "/Audio/12_Angel.m4a" },
  { id: 13, title: "13", src: "/Audio/13_Boda.m4a" },
  { id: 14, title: "14", src: "/Audio/14_Muriendo_Lento.m4a" },
  { id: 15, title: "15", src: "/Audio/15_Halloween.m4a" },
];


export default function AudioTrainer() {
  const audioRef = useRef(null);
  const [currentId, setCurrentId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [normalizeOn, setNormalizeOn] = useState(true); // <- toggle

  // Web Audio
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const compRef = useRef(null);
  const gainRef = useRef(null);

  // clicks
  const clickState = useRef({ lastId: null, count: 0, lastTime: 0 });
  const CLICK_WINDOW_MS = 600;

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

    // conexión inicial según el toggle
    updateRouting(normalizeOn);
  };

  // (re)conecta los nodos según esté activada la normalización
  const updateRouting = (useCompressor) => {
    if (!sourceRef.current || !gainRef.current || !audioCtxRef.current) return;

    // desconectar cualquier conexión previa
    try { sourceRef.current.disconnect(); } catch {}
    try { compRef.current?.disconnect(); } catch {}
    try { gainRef.current.disconnect(); } catch {}

    if (useCompressor && compRef.current) {
      sourceRef.current.connect(compRef.current);
      compRef.current.connect(gainRef.current);
      gainRef.current.connect(audioCtxRef.current.destination);
    } else {
      // bypass del compresor
      sourceRef.current.connect(gainRef.current);
      gainRef.current.connect(audioCtxRef.current.destination);
    }
  };

  const playTrack = (track) => {
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

  const pauseTrack = () => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    setIsPlaying(false);
  };

  const restartTrack = () => {
    const a = audioRef.current;
    if (!a) return;
    ensureAudioGraph();
    a.currentTime = 0;
    a.play().then(() => setIsPlaying(true));
  };

  const handleButtonClick = (track) => {
    const now = Date.now();
    const same = clickState.current.lastId === track.id;
    const within = now - clickState.current.lastTime <= CLICK_WINDOW_MS;

    if (same && within) {
      clickState.current.count += 1;
    } else {
      clickState.current.count = 1;
      clickState.current.lastId = track.id;
    }
    clickState.current.lastTime = now;

    const count = clickState.current.count;

    if (count >= 3) { // triple: reinicia
      restartTrack();
      clickState.current.count = 0;
      return;
    }
    if (count === 2) { // doble: pausa
      pauseTrack();
      return;
    }
    // simple: reproduce (o reanuda)
    if (currentId !== track.id) {
      playTrack(track);
    } else if (!isPlaying) {
      ensureAudioGraph();
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  return (
    <div className="page">
      <h2>Audio Trainer</h2>
      <p className="subtitle">1 clic: reproducir · 2 clics: pausa · 3 clics: reiniciar</p>

      <div className="grid">
        {TRACKS.map((t) => {
          const active = currentId === t.id && isPlaying;
          return (
            <button
              key={t.id}
              onClick={() => handleButtonClick(t)}
              title={t.title}
              className={`tile ${active ? "active" : ""}`}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
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