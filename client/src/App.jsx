
import { useEffect, useState } from "react";
import "./App.css";

function App() {
    const [username, setUsername] = useState("Hikaru");
    const [year, setYear] = useState("2014");
    const [month, setMonth] = useState("03");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function loadData(event) {
        if (event) event.preventDefault();

        if (!username.trim() || !/^\d{4}$/.test(year) ||
            !/^(0[1-9]|1[0-2])$/.test(month)) {
            setError("Enter a valid username, year and month.");
            return;
        }

        setLoading(true);
        setError("");
        setData(null);

        try {
            const response = await fetch(
                `/api/analyze/${encodeURIComponent(username.trim())}/${year}/${month}`
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Could not load game data.");
            }

            setData(result);
        } catch (err) {
            setError(
                `${err.message}. Make sure your Express server is running on port 3001.`
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);


    const summary = data?.performanceSummary || data;
    const whiteStats = {
  games: Number(data?.whiteGames || 0),
  wins: Number(data?.whiteWins || 0),
  losses: Number(data?.whiteLosses || 0),
  draws: Number(data?.whiteDraws || 0),
  winRate: Number(data?.whiteWinPercentage || 0),
};

const blackStats = {
  games: Number(data?.blackGames || 0),
  wins: Number(data?.blackWins || 0),
  losses: Number(data?.blackLosses || 0),
  draws: Number(data?.blackDraws || 0),
  winRate: Number(data?.blackWinPercentage || 0),
};
const gameLengthStats = [
  {
    name: "Short Games",
    description: "20 moves or fewer",
    games: Number(data?.shortGames || 0),
    wins: Number(data?.shortWins || 0),
    draws: Number(data?.shortDraws || 0),
    losses: Number(data?.shortLosses || 0),
  },
  {
    name: "Medium Games",
    description: "21–40 moves",
    games: Number(data?.mediumGames || 0),
    wins: Number(data?.mediumWins || 0),
    draws: Number(data?.mediumDraws || 0),
    losses: Number(data?.mediumLosses || 0),
  },
  {
    name: "Long Games",
    description: "More than 40 moves",
    games: Number(data?.longGames || 0),
    wins: Number(data?.longWins || 0),
    draws: Number(data?.longDraws || 0),
    losses: Number(data?.longLosses || 0),
  },
];
    const totalGames = Number(summary?.totalGames ?? data?.totalGames ?? 0);
    const wins = Number(summary?.wins ?? data?.wins ?? 0);
    const draws = Number(summary?.draws ?? data?.draws ?? 0);
    const losses = Number(summary?.losses ?? data?.losses ?? 0);

    const percentage = (value) => {
        return totalGames > 0 ? (value / totalGames) * 100 : 0;
    };

    return (
        <main className="app">
            <header className="topbar">
                <a className="brand" href="/">
                    <span className="brand-icon">♞</span>
                    Chess<span className="brand-accent">Analyzer</span>
                </a>
                <span className="status">
                    <span className="status-dot"></span>
                    Game Analytics
                </span>
            </header>

            <section className="hero">
                <p className="eyebrow">YOUR CHESS. YOUR DATA.</p>
                <h1>Understand your game.</h1>
                <p className="hero-description">
                    Explore your results, discover patterns and understand
                    your chess performance using your game history.
                </p>
            </section>

            <section className="search-panel">
                <form onSubmit={loadData} className="search-form">
                    <label>
                        Chess.com username
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                        />
                    </label>

                    <label>
                        Year
                        <input
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            inputMode="numeric"
                            maxLength={4}
                        />
                    </label>

                    <label>
                        Month
                        <select
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                        >
                            {Array.from({ length: 12 }, (_, i) => {
                                const value = String(i + 1).padStart(2, "0");
                                return (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                );
                            })}
                        </select>
                    </label>

                    <button type="submit" disabled={loading}>
                        {loading ? "Loading..." : "Analyze games →"}
                    </button>
                </form>
            </section>

            {loading && (
                <p className="message">Loading chess statistics...</p>
            )}

            {error && (
                <div className="error-message">{error}</div>
            )}

            {data && summary && (
                <>
                    <section className="section-heading">
                        <div>
                            <p className="eyebrow">PERFORMANCE OVERVIEW</p>
                            <h2>{data.username}'s dashboard</h2>
                        </div>
                        <span className="period">
                            {data.year} / {data.month}
                        </span>
                    </section>

                    <section className="stats-grid">
                        <article className="stat-card">
                            <p>Total games</p>
                            <h3>{summary.totalGames ?? data.totalGames ?? 0}</h3>
                            <span className="stat-note">Games analyzed</span>
                        </article>

                        <article className="stat-card">
                            <p>Wins</p>
                            <h3 className="win-number">{summary.wins ?? 0}</h3>
                            <span className="stat-note">
                                {summary.winPercentage ?? data.winPercentage ?? "0.00"}% win rate
                            </span>
                        </article>

                        <article className="stat-card">
                            <p>Draws</p>
                            <h3>{summary.draws ?? 0}</h3>
                            <span className="stat-note">
                                {summary.drawPercentage ?? "0.00"}% draw rate
                            </span>
                        </article>

                        <article className="stat-card">
                            <p>Losses</p>
                            <h3 className="loss-number">{summary.losses ?? 0}</h3>
                            <span className="stat-note">
                                {summary.lossPercentage ?? "0.00"}% loss rate
                            </span>
                        </article>
                    </section>

                    <section className="panel result-panel">
  <div className="panel-heading">
    <div>
      <p className="eyebrow">RESULT BREAKDOWN</p>
      <h2>Win / Draw / Loss</h2>
    </div>

    <span className="period">{totalGames} games</span>
  </div>

  {totalGames > 0 ? (
    <>
      <div
        className="result-bar"
        role="img"
        aria-label={`${wins} wins, ${draws} draws, ${losses} losses`}
      >
        {wins > 0 && (
          <div
            className="result-segment result-wins"
            style={{ width: `${percentage(wins)}%` }}
          />
        )}

        {draws > 0 && (
          <div
            className="result-segment result-draws"
            style={{ width: `${percentage(draws)}%` }}
          />
        )}

        {losses > 0 && (
          <div
            className="result-segment result-losses"
            style={{ width: `${percentage(losses)}%` }}
          />
        )}
      </div>

      <div className="result-legend">
        <div>
          <span className="legend-dot result-wins" />
          <span>Wins</span>
          <strong>
            {wins} ({percentage(wins).toFixed(1)}%)
          </strong>
        </div>

        <div>
          <span className="legend-dot result-draws" />
          <span>Draws</span>
          <strong>
            {draws} ({percentage(draws).toFixed(1)}%)
          </strong>
        </div>

        <div>
          <span className="legend-dot result-losses" />
          <span>Losses</span>
          <strong>
            {losses} ({percentage(losses).toFixed(1)}%)
          </strong>
        </div>
      </div>
    </>
  ) : (
    <p className="empty-state">
      No games available for this period.
    </p>
  )}
</section>

<section className="side-performance">
  <div className="panel side-card">
    <p className="eyebrow">PIECES PERFORMANCE</p>
    <h2>White Pieces</h2>

    <div className="side-win-rate">
      {whiteStats.winRate.toFixed(2)}%
      <span>Win rate</span>
    </div>

    <div className="side-stat-row">
      <span>Games played</span>
      <strong>{whiteStats.games}</strong>
    </div>

    <div className="side-stat-row">
      <span>Wins</span>
      <strong>{whiteStats.wins}</strong>
    </div>

    <div className="side-stat-row">
      <span>Draws</span>
      <strong>{whiteStats.draws}</strong>
    </div>

    <div className="side-stat-row">
      <span>Losses</span>
      <strong>{whiteStats.losses}</strong>
    </div>
  </div>

  <div className="panel side-card">
    <p className="eyebrow">PIECES PERFORMANCE</p>
    <h2>Black Pieces</h2>

    <div className="side-win-rate">
      {blackStats.winRate.toFixed(2)}%
      <span>Win rate</span>
    </div>

    <div className="side-stat-row">
      <span>Games played</span>
      <strong>{blackStats.games}</strong>
    </div>

    <div className="side-stat-row">
      <span>Wins</span>
      <strong>{blackStats.wins}</strong>
    </div>

    <div className="side-stat-row">
      <span>Draws</span>
      <strong>{blackStats.draws}</strong>
    </div>

    <div className="side-stat-row">
      <span>Losses</span>
      <strong>{blackStats.losses}</strong>
    </div>
  </div>
</section>
<section className="panel game-length-panel">
  <div className="panel-heading">
    <div>
      <p className="eyebrow">GAME ANALYSIS</p>
      <h2>Performance by Game Length</h2>
    </div>
  </div>

  <div className="game-length-grid">
    {gameLengthStats.map((item) => {
      const winRate =
        item.games > 0 ? (item.wins / item.games) * 100 : 0;

      return (
        <div className="length-card" key={item.name}>
          <h3>{item.name}</h3>
          <p className="length-description">
            {item.description}
          </p>

          <div className="length-total">
            {item.games}
            <span> games</span>
          </div>

          <div className="length-progress">
            <div
              className="length-progress-fill"
              style={{ width: `${winRate}%` }}
            />
          </div>

          <div className="length-win-rate">
            Win rate: {winRate.toFixed(2)}%
          </div>

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
      );
    })}
  </div>
</section>

                    <section className="content-grid">
                        <article className="panel">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">OPENING INSIGHTS</p>
                                    <h2>First move performance</h2>
                                </div>
                                <span className="chess-icon">♟</span>
                            </div>

                            {data.firstMovePerformance?.length > 0 ? (
                                <div className="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Move</th>
                                                <th>Games</th>
                                                <th>Wins</th>
                                                <th>Win rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.firstMovePerformance.slice(0, 8).map((move) => (
                                                <tr key={move.firstMove}>
                                                    <td>
                                                        <span className="move-badge">
                                                            {move.firstMove}
                                                        </span>
                                                    </td>
                                                    <td>{move.games}</td>
                                                    <td>{move.wins}</td>
                                                    <td className="win-number">
                                                        {move.winPercentage}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="empty-state">
                                    No first-move data available.
                                </p>
                            )}
                        </article>

                        <article className="panel">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">YOUR OPPONENTS</p>
                                    <h2>Most played</h2>
                                </div>
                                <span className="chess-icon">♜</span>
                            </div>

                            {data.topOpponents?.length > 0 ? (
                                <div className="opponent-list">
                                    {data.topOpponents.slice(0, 8).map((opponent, index) => (
                                        <div className="opponent-row" key={opponent.opponent}>
                                            <span className="rank">
                                                {String(index + 1).padStart(2, "0")}
                                            </span>
                                            <span className="opponent-name">
                                                {opponent.opponent}
                                            </span>
                                            <span className="game-count">
                                                {opponent.games} games
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-state">
                                    No opponent data available.
                                </p>
                            )}
                        </article>
                    </section>

                    <footer className="dashboard-footer">
                        Data from Chess.com public game archives ·
                        Built with React and Express
                    </footer>
                </>
            )}
        </main>
    );
}

export default App;
