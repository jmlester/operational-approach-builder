import React, { useMemo } from "react";

/**
 * risk = { id, label, likelihood:1..5 (rows L1..L5), impact:1..5 (cols I1..I5) }
 * Colors:
 *  score = likelihood * impact
 *  1-4 green, 5-9 yellow, 10-16 orange, 17-25 red
 */
export default function RiskMatrix2({ risks = [], onCellClick }) {
  const grid = useMemo(() => {
    const g = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => []));
    risks.forEach((r) => {
      const li = Math.min(Math.max(r.likelihood, 1), 5) - 1;
      const im = Math.min(Math.max(r.impact, 1), 5) - 1;
      g[li][im].push(r);
    });
    return g;
  }, [risks]);

  const colorFor = (row, col) => {
    const score = row * col; // using 1-based values
    if (score >= 17) return "hm-red";
    if (score >= 10) return "hm-orange";
    if (score >= 5) return "hm-yellow";
    return "hm-green";
  };

  return (
    <div className="heatmap">
      <div className="hm-col labels">
        <div className="hm-corner" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={`lr${i}`} className="hm-label-row">{`L${i}`}</div>
        ))}
      </div>

      <div className="hm-grid">
        <div className="hm-toplabels">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`lc${i}`} className="hm-label-col">{`Impact ${i}`}</div>
          ))}
        </div>

        {[1, 2, 3, 4, 5].map((r) => (
          <div key={`r${r}`} className="hm-row">
            {[1, 2, 3, 4, 5].map((c) => (
              <button
                key={`c${c}`}
                className={`hm-cell ${colorFor(r, c)}`}
                onClick={() => onCellClick && onCellClick(r, c)}
                title={`L${r} / I${c}`}
              >
                {grid[r - 1][c - 1].length > 0 ? grid[r - 1][c - 1].length : "—"}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
