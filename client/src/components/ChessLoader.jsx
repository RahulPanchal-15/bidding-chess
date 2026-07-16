export default function ChessLoader({ className = '', size = 72 }) {
  const cells = Array.from({ length: 16 }, (_, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const dark = (row + col) % 2 === 1;
    return { i, dark };
  });

  return (
    <div
      className={`chess-loader ${className}`.trim()}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      <div className="chess-loader__board" aria-hidden="true">
        {cells.map(({ i, dark }) => (
          <div
            key={i}
            className={dark ? 'chess-loader__cell chess-loader__cell--dark' : 'chess-loader__cell'}
          />
        ))}
      </div>
    </div>
  );
}
