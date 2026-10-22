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

  const summary = data?.performanceSummary || data || {};

  const number = (value) => Number(value || 0);

  const percentage = (value, total) =>
    total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

  const loadData = async () => {
    if (!username.trim()) {
      setError("Please enter a Chess.com username.");
      return;
    }

    if (
      !/^\d{4}$/.test(String(year)) ||
      Number(year) < 2007 ||
      Number(year) > new Date().getFullYear()
    ) {
      setError("Please enter a valid year.");
      return;
    }

    if (
      !/^\d{1,2}$/.test(String(month)) ||
      Number(month) < 1 ||
      Number(month) > 12
    ) {
      setError("Please enter a month from 1 to 12.");
      return;
    }

    setLoading(true);
    setError("");

    try {
    const url = `${API_BASE_URL}/api/analyze/${encodeURIComponent(
        username.trim()
    )}/${year}/${String(month).padStart(2, "0")}`;

    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "Failed to fetch game data"
        );
    }
    

      setData(result);
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
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

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">CHESS ANALYTICS</p>
          <h1>Chess Game Analyzer</h1>
          <p className="subtitle">
            Explore your Chess.com game performance.
          </p>
        </div>
      </header>

      <section className="panel search-panel">
        <h2>Analyze a player</h2>

        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault();
            loadData();
          }}
        >
          <label>
            Chess.com username
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
        <div className="status-message loading-message" role="status">
          <span className="loader" />
          <span>Fetching games and analyzing performance...</span>
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
            <div className="panel stat-card">
              <p>Total Games</p>
              <h2>{totalGames}</h2>
            </div>

            <div className="panel stat-card">
              <p>Wins</p>
              <h2>{wins}</h2>
            </div>

            <div className="panel stat-card">
              <p>Draws</p>
              <h2>{draws}</h2>
            </div>

            <div className="panel stat-card">
              <p>Losses</p>
              <h2>{losses}</h2>
            </div>
          </section>

          <section className="panel result-panel">
            <p className="eyebrow">RESULT BREAKDOWN</p>
            <h2>Win / Draw / Loss</h2>

            {totalGames > 0 ? (
              <>
                <div className="result-bar">
                  {wins > 0 && (
                    <div
                      className="result-segment result-wins"
                      style={{
                        width: `${(wins / totalGames) * 100}%`,
                      }}
                    />
                  )}

                  {draws > 0 && (
                    <div
                      className="result-segment result-draws"
                      style={{
                        width: `${(draws / totalGames) * 100}%`,
                      }}
                    />
                  )}

                  {losses > 0 && (
                    <div
                      className="result-segment result-losses"
                      style={{
                        width: `${(losses / totalGames) * 100}%`,
                      }}
                    />
                  )}
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

                <div className="side-stat-row">
                  <span>Games</span>
                  <strong>{side.games}</strong>
                </div>
                <div className="side-stat-row">
                  <span>Wins</span>
                  <strong>{side.wins}</strong>
                </div>
                <div className="side-stat-row">
                  <span>Draws</span>
                  <strong>{side.draws}</strong>
                </div>
                <div className="side-stat-row">
                  <span>Losses</span>
                  <strong>{side.losses}</strong>
                </div>
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
                        width: `${item.games > 0
                          ? (item.wins / item.games) * 100
                          : 0}%`,
                      }}
                    />
                  </div>

                  <p>
                    Win rate: {percentage(item.wins, item.games)}%
                  </p>
                  <div className="length-result-row">
                    <span>Wins</span>
                    <strong>{item.wins}</strong>
                  </div>
                  <div className="length-result-row">
                    <span>Draws</span>
                    <strong>{item.draws}</strong>
                  </div>
                  <div className="length-result-row">
                    <span>Losses</span>
                    <strong>{item.losses}</strong>
                  </div>
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
                      {data.firstMovePerformance
                        .slice(0, 8)
                        .map((move, index) => (
                          <tr key={`${move.move}-${index}`}>
                            <td>{move.firstMove}</td>
                            <td>{move.games}</td>
                            <td>{move.wins}</td>
                            <td>
                              {number(move.winPercentage).toFixed(2)}%
                            </td>
                          </tr>
                        ))}
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
                  <div
                    className="side-stat-row"
                    key={`${opponent.username || opponent.opponent || index}`}
                  >
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

      <footer className="dashboard-footer">
        Chess.com public game archives · React + Express
      </footer>
    </main>
  );
}

export default App;