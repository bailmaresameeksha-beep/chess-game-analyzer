
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
