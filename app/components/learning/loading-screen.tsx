'use client';



export function LoadingScreen() {
  return (
    <output
      className="loading-screen"
      aria-label="Ritmo Español загружается"
    >
      <div className="loading-sun" />
      <div className="loading-logo">
        <span>R</span>
        <h1>
          Ritmo <em>Español</em>
        </h1>
        <p>Preparando tu aventura…</p>
        <div>
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="loading-wave" />
    </output>
  );
}
