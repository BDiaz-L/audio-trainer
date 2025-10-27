import { useRef, useState, useMemo, useEffect } from "react";

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

  // contador de clics (por pista y tiempo)
  const clickState = useRef({ lastId: null, count: 0, lastTime: 0 });
  const CLICK_WINDOW_MS = 600; // tiempo entre clics (en ms)

  const playTrack = (track) => {
    const a = audioRef.current;
    if (!a) return;
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

    // triple clic → reiniciar
    if (count >= 3) {
      restartTrack();
      clickState.current.count = 0;
      return;
    }

    // doble clic → pausa
    if (count === 2) {
      pauseTrack();
      return;
    }

    // clic simple → reproducir (o reanudar)
    if (currentId !== track.id) {
      playTrack(track);
    } else if (!isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "24px auto", padding: 16, color: "#eee", fontFamily: "system-ui, Arial" }}>
      <h2 style={{ marginBottom: 8 }}>Audio Trainer</h2>
      <p style={{ color: "#9aa", marginTop: 0, marginBottom: 16 }}>
        🖱️ 1 clic: reproducir · 2 clics: pausa · 3 clics: reiniciar
      </p>

      {/* GRID 3 filas × 5 columnas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
        }}
      >
        {TRACKS.map((t) => {
          const active = currentId === t.id && isPlaying;
          return (
            <button
              key={t.id}
              onClick={() => handleButtonClick(t)}
              title={t.title}
              style={{
                aspectRatio: "1 / 1",
                width: "100%",
                borderRadius: 16,
                border: active ? "2px solid #8ef" : "1px solid #2a2a2e",
                background: active ? "#1b2730" : "#1a1a1c",
                color: "#eee",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 8,
                fontWeight: 600,
                transition: "transform .05s ease, background .2s",
              }}
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

      {/* Controles inferiores */}
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <strong>Volumen</strong>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          defaultValue="1"
          onChange={(e) => {
            const a = audioRef.current;
            if (a) a.volume = Number(e.target.value);
          }}
          style={{ flex: 1 }}
        />
        <span style={{ color: "#9aa" }}>{isPlaying ? "Reproduciendo" : "Detenido"}</span>
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