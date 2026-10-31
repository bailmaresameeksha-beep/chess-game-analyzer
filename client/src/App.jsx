
import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

function App() {
  const [username, setUsername] = useState("Hikaru");
  const [year, setYear] = useState("2014");
  const [month, setMonth] = useState("03");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [compareYear1, setCompareYear1] = useState("2014");
  const [compareMonth1, setCompareMonth1] = useState("02");
  const [compareYear2, setCompareYear2] = useState("2014");
  const [compareMonth2, setCompareMonth2] = useState("03");

  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");

  const [trendData, setTrendData] = useState(null);
  const [trendUsername, setTrendUsername] = useState("");
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState("");

  const number = (value) => Number(value || 0);

  const percentage = (value, total) =>
    total > 0 ? ((value / total) * 100).toFixed(2) : "0.00";

  const summary = data?.performanceSummary || data || {};

  const loadData = async () => {
    if (!username.trim()) {
      setError("Please enter a Chess.com username.");
      return;
    }

    if (
      !/^\d{4}$/.test(year) ||
      Number(year) < 2007 ||
      Number(year) > new Date().getFullYear()
    ) {
      setError("Please enter a valid year.");
      return;
    }

    if (
      !/^\d{1,2}$/.test(month) ||
      Number(month) < 1 ||
      Number(month) > 12
    ) {
      setError("Please enter a valid month.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url =
        `${API_BASE_URL}/api/analyze/` +
        `${encodeURIComponent(username.trim())}/` +
        `${year}/${String(month).padStart(2, "0")}`;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to analyze games.");
      }

      setData(result);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const compareMonths = async () => {
    if (!username.trim()) {
      setCompareError("Enter a Chess.com username first.");
      return;
    }

    const validYear = (value) =>
      /^\d{4}$/.test(value) &&
      Number(value) >= 2007 &&
      Number(value) <= new Date().getFullYear();

    const validMonth = (value) =>
      /^\d{1,2}$/.test(value) &&
      Number(value) >= 1 &&
      Number(value) <= 12;

    if (
      !validYear(compareYear1) ||
      !validYear(compareYear2) ||
      !validMonth(compareMonth1) ||
      !validMonth(compareMonth2)
    ) {
      setCompareError("Enter valid years and months.");
      return;
    }

    setCompareLoading(true);
    setCompareError("");
    setCompareData(null);

    try {
      const url =
        `${API_BASE_URL}/api/compare/${encodeURIComponent(username.trim())}` +
        `/${compareYear1}/${compareMonth1.padStart(2, "0")}` +
        `/${compareYear2}/${compareMonth2.padStart(2, "0")}`;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to compare monthly performance."
        );
      }

      setCompareData(result);
    } catch (err) {
      setCompareError(err.message || "Unable to compare months.");
    } finally {
      setCompareLoading(false);
    }
  };

  const loadTrend = async () => {
    if (!username.trim()) {
      setTrendError("Enter a Chess.com username first.");
      return;
    }

    setTrendLoading(true);
    setTrendError("");
    setTrendData(null);

    try {
      const url =
        `${API_BASE_URL}/api/trend/${encodeURIComponent(username.trim())}`;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to load monthly performance trend."
        );
      }

      if (!Array.isArray(result.months)) {
        throw new Error("Invalid trend data received from server.");
      }

      setTrendData(result);
      setTrendUsername(username.trim());
    } catch (err) {
      setTrendError(
        err.message || "Unable to load monthly performance trend."
      );
    } finally {
      setTrendLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalGames = number(summary.totalGames ?? data?.totalGames);
  const wins = number(summary.wins ?? data?.wins);
  const draws = number(summary.draws ?? data?.draws);
  const losses = number(summary.losses ?? data?.losses);

  const sides = [
    {
      name: "White Pieces",
      games: number(data?.whiteGames),
      wins: number(data?.whiteWins),
      draws: number(data?.whiteDraws),
      losses: number(data?.whiteLosses),
      rate: number(data?.whiteWinPercentage),
    },
    {
      name: "Black Pieces",
      games: number(data?.blackGames),
      wins: number(data?.blackWins),
      draws: number(data?.blackDraws),
      losses: number(data?.blackLosses),
      rate: number(data?.blackWinPercentage),
    },
  ];

  const lengths = [
    {
      name: "Short Games",
      games: number(data?.shortGames),
      wins: number(data?.shortWins),
      draws: number(data?.shortDraws),
      losses: number(data?.shortLosses),
    },
    {
      name: "Medium Games",
      games: number(data?.mediumGames),
      wins: number(data?.mediumWins),
      draws: number(data?.mediumDraws),
      losses: number(data?.mediumLosses),
    },
    {
      name: "Long Games",
      games: number(data?.longGames),
      wins: number(data?.longWins),
      draws: number(data?.longDraws),
      losses: number(data?.longLosses),
    },
  ];

  const months = trendData?.months || [];

  const chartWidth = 760;
  const chartHeight = 260;
  const chartLeft = 48;
  const chartRight = 20;
  const chartTop = 24;
  const chartBottom = 48;

  const chartInnerWidth = chartWidth - chartLeft - chartRight;
  const chartInnerHeight = chartHeight - chartTop - chartBottom;

  const chartPoints = months.map((item, index) => {
    const x =
      months.length === 1
        ? chartLeft + chartInnerWidth / 2
        : chartLeft + (index / (months.length - 1)) * chartInnerWidth;

    const rate = Math.max(
      0,
      Math.min(100, number(item.winPercentage))
    );

    const y = chartTop + ((100 - rate) / 100) * chartInnerHeight;

    return { x, y, rate, item };
  });

  const linePoints = chartPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const maxGames = Math.max(
    1,
    ...months.map((item) => number(item.totalGames))
  );

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">CHESS ANALYTICS</p>
          <h1>Chess Game Analyzer</h1>
          <p className="subtitle">
            Explore and understand Chess.com game performance.
          </p>
        </div>
      </header>

      <section className="panel search-panel">
        <h2>Analyze a Player</h2>

        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault();
            loadData();
          }}
        >
          <label>
            Chess.com Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              disabled={loading}
            />
          </label>

          <label>
            Year
            <input
              type="number"
              min="2007"
              max={new Date().getFullYear()}
              value={year}
              onChange={(event) => setYear(event.target.value)}
              disabled={loading}
            />
          </label>

          <label>
            Month
            <select
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              disabled={loading}
            >
              {Array.from({ length: 12 }, (_, index) => {
                const value = String(index + 1).padStart(2, "0");

                return (
                  <option key={value} value={value}>
                    {value}
                  </option>
                );
              })}
            </select>
          </label>

          <button
            className="analyze-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze Games"}
          </button>
        </form>
      </section>

      {loading && (
        <div className="status-message loading-message">
          <span className="loader" />
          Fetching games and analyzing performance...
        </div>
      )}

      {error && (
        <div className="status-message error-message" role="alert">
          <strong>Analysis failed</strong>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <section className="stats-grid">
            {[
              ["Total Games", totalGames],
              ["Wins", wins],
              ["Draws", draws],
              ["Losses", losses],
            ].map(([label, value]) => (
              <div className="panel stat-card" key={label}>
                <p>{label}</p>
                <h2>{value}</h2>
              </div>
            ))}
          </section>

          <section className="panel result-panel">
            <p className="eyebrow">RESULT BREAKDOWN</p>
            <h2>Win / Draw / Loss</h2>

            {totalGames > 0 ? (
              <>
                <div className="result-bar">
                  <div
                    className="result-segment result-wins"
                    style={{ width: `${(wins / totalGames) * 100}%` }}
                  />
                  <div
                    className="result-segment result-draws"
                    style={{ width: `${(draws / totalGames) * 100}%` }}
                  />
                  <div
                    className="result-segment result-losses"
                    style={{ width: `${(losses / totalGames) * 100}%` }}
                  />
                </div>

                <div className="result-legend">
                  <span>Wins: {percentage(wins, totalGames)}%</span>
                  <span>Draws: {percentage(draws, totalGames)}%</span>
                  <span>Losses: {percentage(losses, totalGames)}%</span>
                </div>
              </>
            ) : (
              <p>No games available for this period.</p>
            )}
          </section>

          <section className="side-performance">
            {sides.map((side) => (
              <div className="panel side-card" key={side.name}>
                <p className="eyebrow">PIECES PERFORMANCE</p>
                <h2>{side.name}</h2>

                <div className="side-win-rate">
                  {side.rate.toFixed(2)}%
                  <span>Win rate</span>
                </div>

                {[
                  ["Games", side.games],
                  ["Wins", side.wins],
                  ["Draws", side.draws],
                  ["Losses", side.losses],
                ].map(([label, value]) => (
                  <div className="side-stat-row" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            ))}
          </section>

          <section className="panel game-length-panel">
            <p className="eyebrow">GAME ANALYSIS</p>
            <h2>Performance by Game Length</h2>

            <div className="game-length-grid">
              {lengths.map((item) => (
                <div className="length-card" key={item.name}>
                  <h3>{item.name}</h3>
                  <p>{item.games} games</p>

                  <div className="length-progress">
                    <div
                      className="length-progress-fill"
                      style={{
                        width: `${
                          item.games > 0
                            ? (item.wins / item.games) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <p>
                    Win rate: {percentage(item.wins, item.games)}%
                  </p>

                  {[
                    ["Wins", item.wins],
                    ["Draws", item.draws],
                    ["Losses", item.losses],
                  ].map(([label, value]) => (
                    <div className="length-result-row" key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section className="content-grid">
            <div className="panel">
              <p className="eyebrow">OPENING ANALYSIS</p>
              <h2>First Move Performance</h2>

              {data.firstMovePerformance?.length ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Move</th>
                        <th>Games</th>
                        <th>Wins</th>
                        <th>Win %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.firstMovePerformance.slice(0, 8).map(
                        (move, index) => (
                          <tr key={`${move.firstMove}-${index}`}>
                            <td>{move.firstMove}</td>
                            <td>{move.games}</td>
                            <td>{move.wins}</td>
                            <td>
                              {number(move.winPercentage).toFixed(2)}%
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No opening data available.</p>
              )}
            </div>

            <div className="panel">
              <p className="eyebrow">OPPONENT ANALYSIS</p>
              <h2>Top Opponents</h2>

              {data.topOpponents?.length ? (
                data.topOpponents.slice(0, 8).map((opponent, index) => (
                  <div className="side-stat-row" key={index}>
                    <span>
                      {opponent.username || opponent.opponent || "Unknown"}
                    </span>
                    <strong>{opponent.games ?? 0} games</strong>
                  </div>
                ))
              ) : (
                <p>No opponent data available.</p>
              )}
            </div>
          </section>
        </>
      )}

      <section className="panel comparison-panel">
        <p className="eyebrow">MONTHLY ANALYTICS</p>
        <h2>Compare Performance</h2>
        <p className="subtitle">
          Compare your results across two different months.
        </p>

        <div className="comparison-inputs">
          <div className="comparison-period">
            <h3>First Month</h3>

            <label>
              Year
              <input
                type="number"
                min="2007"
                max={new Date().getFullYear()}
                value={compareYear1}
                onChange={(event) => setCompareYear1(event.target.value)}
              />
            </label>

            <label>
              Month (1–12)
              <input
                type="number"
                min="1"
                max="12"
                value={compareMonth1}
                onChange={(event) => setCompareMonth1(event.target.value)}
              />
            </label>
          </div>

          <div className="comparison-period">
            <h3>Second Month</h3>

            <label>
              Year
              <input
                type="number"
                min="2007"
                max={new Date().getFullYear()}
                value={compareYear2}
                onChange={(event) => setCompareYear2(event.target.value)}
              />
            </label>

            <label>
              Month (1–12)
              <input
                type="number"
                min="1"
                max="12"
                value={compareMonth2}
                onChange={(event) => setCompareMonth2(event.target.value)}
              />
            </label>
          </div>
        </div>

        <button
          className="analyze-button"
          type="button"
          onClick={compareMonths}
          disabled={compareLoading}
        >
          {compareLoading ? "Comparing..." : "Compare Months"}
        </button>

        {compareError && (
          <div className="status-message error-message">
            {compareError}
          </div>
        )}

        {compareData && (
          <div className="comparison-results">
            {[compareData.firstMonth, compareData.secondMonth].map(
              (item, index) => (
                <div className="comparison-card" key={index}>
                  <h3>
                    {item.year}-{String(item.month).padStart(2, "0")}
                  </h3>
                  <p>Total Games: <strong>{item.totalGames}</strong></p>
                  <p>Wins: <strong>{item.wins}</strong></p>
                  <p>Draws: <strong>{item.draws}</strong></p>
                  <p>Losses: <strong>{item.losses}</strong></p>
                  <p>
                    Win Rate: <strong>{item.winPercentage}%</strong>
                  </p>
                </div>
              )
            )}

            <div className="comparison-difference">
              <h3>Win Rate Difference</h3>
              <p>
                {compareData.winRateDifference > 0 ? "+" : ""}
                {compareData.winRateDifference} percentage points
              </p>
              <span>
                {compareData.winRateDifference > 0
                  ? "Win rate increased in the second month."
                  : compareData.winRateDifference < 0
                    ? "Win rate decreased in the second month."
                    : "Win rate stayed the same."}
              </span>
            </div>
          </div>
        )}
      </section>

      <section className="panel trend-panel">
        <p className="eyebrow">PERFORMANCE TRENDS</p>
        <h2>Monthly Performance Trend</h2>
        <p className="subtitle">
          Track win percentage and total games over the last six months.
        </p>

        <button
          className="analyze-button trend-button"
          type="button"
          onClick={loadTrend}
          disabled={trendLoading}
        >
          {trendLoading ? "Loading Trend..." : "Load 6-Month Trend"}
        </button>

        {trendError && (
          <div className="status-message error-message" role="alert">
            {trendError}
          </div>
        )}

        {trendData && (
          <div className="trend-results">
            <p className="trend-player">
              Performance for <strong>{trendUsername}</strong>
            </p>

            {months.length === 0 ? (
              <p>No monthly data available.</p>
            ) : (
              <>
                <div className="trend-chart-card">
                  <h3>Win Rate Trend</h3>
                  <p className="chart-description">
                    Percentage of games won in each month.
                  </p>

                  <div className="chart-scroll">
                    <svg
                      className="trend-line-chart"
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      role="img"
                      aria-label="Six month win rate line chart"
                    >
                      {[0, 25, 50, 75, 100].map((value) => {
                        const y =
                          chartTop +
                          ((100 - value) / 100) * chartInnerHeight;

                        return (
                          <g key={value}>
                            <line
                              x1={chartLeft}
                              y1={y}
                              x2={chartWidth - chartRight}
                              y2={y}
                              className="chart-grid-line"
                            />
                            <text
                              x={chartLeft - 10}
                              y={y + 4}
                              textAnchor="end"
                              className="chart-axis-label"
                            >
                              {value}%
                            </text>
                          </g>
                        );
                      })}

                      <polyline
                        points={linePoints}
                        className="trend-line"
                      />

                      {chartPoints.map((point, index) => (
                        <g key={`${point.item.year}-${point.item.month}`}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="6"
                            className="trend-point"
                          />
                          <text
                            x={point.x}
                            y={point.y - 14}
                            textAnchor="middle"
                            className="chart-value-label"
                          >
                            {point.rate.toFixed(1)}%
                          </text>
                          <text
                            x={point.x}
                            y={chartHeight - 15}
                            textAnchor="middle"
                            className="chart-axis-label"
                          >
                            {point.item.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>

                <div className="trend-chart-card">
                  <h3>Games Played Each Month</h3>
                  <p className="chart-description">
                    Comparison of total games played per month.
                  </p>

                  <div className="trend-bar-chart">
                    {months.map((item) => {
                      const games = number(item.totalGames);
                      const width = (games / maxGames) * 100;

                      return (
                        <div
                          className="trend-bar-row"
                          key={`${item.year}-${item.month}`}
                        >
                          <span className="trend-bar-label">
                            {item.label}
                          </span>

                          <div className="trend-bar-track">
                            <div
                              className="trend-bar-fill"
                              style={{ width: `${width}%` }}
                            />
                          </div>

                          <strong>{games}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="trend-table-wrapper">
                  <h3>Monthly Results</h3>

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Games</th>
                          <th>Wins</th>
                          <th>Draws</th>
                          <th>Losses</th>
                          <th>Win Rate</th>
                        </tr>
                      </thead>

                      <tbody>
                        {months.map((item) => (
                          <tr key={`${item.year}-${item.month}`}>
                            <td>{item.label}</td>
                            <td>{number(item.totalGames)}</td>
                            <td>{number(item.wins)}</td>
                            <td>{number(item.draws)}</td>
                            <td>{number(item.losses)}</td>
                            <td>
                              {number(item.winPercentage).toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {!trendData && !trendLoading && !trendError && (
          <p className="trend-empty">
            Click the button to view the last six months of performance.
          </p>
        )}
      </section>

      <footer className="dashboard-footer">
        Chess.com public game archives · React + Express
      </footer>
    </main>
  );
}

export default App;
