
const express = require("express");
const cors = require("cors");
const { Chess } = require("chess.js");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const API_BASE = "https://api.chess.com/pub";

const monthNames = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
];

async function fetchChessData(url) {
    const response = await fetch(url, {
        headers: {
            "User-Agent": "ChessGameAnalyzer/1.0 (learning project)",
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(
            `Chess.com API error: ${response.status} ${response.statusText}`
        );
    }

    return response.json();
}

function normalizeUsername(username) {
    return String(username || "").trim().toLowerCase();
}

function getOpponent(game, username) {
    const target = normalizeUsername(username);
    const whiteName = game.white?.username || "Unknown";
    const blackName = game.black?.username || "Unknown";

    return normalizeUsername(whiteName) === target
        ? blackName
        : whiteName;
}

function getPlayerColor(game, username) {
    return normalizeUsername(game.white?.username) ===
        normalizeUsername(username)
        ? "white"
        : "black";
}

function getGameResult(game) {
    const whiteResult = String(game.white?.result || "").toLowerCase();
    const blackResult = String(game.black?.result || "").toLowerCase();

    if (whiteResult === "win") return "white";
    if (blackResult === "win") return "black";

    const drawResults = [
        "agreed",
        "repetition",
        "stalemate",
        "insufficient",
        "50move",
        "timevsinsufficient",
        "draw"
    ];

    if (
        drawResults.includes(whiteResult) ||
        drawResults.includes(blackResult)
    ) {
        return "draw";
    }

    return "unknown";
}

function getPlayerOutcome(game, username) {
    const color = getPlayerColor(game, username);
    const result = getGameResult(game);

    if (result === "draw") return "draw";
    if (result === "unknown") return "unknown";

    return result === color ? "win" : "loss";
}

function getMonthLabel(year, month) {
    return `${monthNames[month - 1]} ${year}`;
}

function getMonthDateRange(year, month) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    return { start, end };
}

function getGameDetails(game, username) {
    const color = getPlayerColor(game, username);
    const outcome = getPlayerOutcome(game, username);
    const opponent = getOpponent(game, username);

    let moveCount = 0;
    let firstMove = "Unknown";
    let opening = "Unknown";

    try {
        if (game.pgn) {
            const chess = new Chess();
            chess.loadPgn(game.pgn);

            const history = chess.history({ verbose: true });
            moveCount = history.length;

            if (history.length > 0) {
                firstMove = history[0].san;
            }

            const headers = chess.getHeaders();
            opening =
                headers.Opening ||
                headers.ECOUrl ||
                headers.ECO ||
                "Unknown";
        }
    } catch (error) {
        // Keep the game in the analysis even if its PGN cannot be parsed.
    }

    const endTime = game.end_time
        ? new Date(game.end_time * 1000)
        : null;

    return {
        date: endTime ? endTime.toISOString() : null,
        opponent,
        color,
        result: outcome,
        firstMove,
        opening,
        moves: moveCount,
        url: game.url || ""
    };
}

function createEmptyStats(year, month) {
    return {
        year,
        month,
        label: getMonthLabel(year, month),
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        unknown: 0,
        winPercentage: 0,
        whiteGames: 0,
        blackGames: 0,
        whiteWins: 0,
        blackWins: 0,
        whiteWinPercentage: 0,
        blackWinPercentage: 0,
        shortGames: 0,
        mediumGames: 0,
        longGames: 0,
        games: [],
        topOpponents: [],
        opponentPerformance: [],
        firstMovePerformance: [],
        topOpenings: [],
        performanceSummary: "No games found for this month."
    };
}

function calculatePercentage(wins, games) {
    return games > 0
        ? Number(((wins / games) * 100).toFixed(2))
        : 0;
}

function calculateMonthStats(rawGames, username, year, month) {
    const stats = createEmptyStats(year, month);

    const opponentMap = new Map();
    const firstMoveMap = new Map();
    const openingMap = new Map();

    for (const game of rawGames) {
        const outcome = getPlayerOutcome(game, username);

        if (outcome === "unknown") {
            continue;
        }

        const details = getGameDetails(game, username);
        stats.games.push(details);
        stats.totalGames++;

        if (outcome === "win") stats.wins++;
        if (outcome === "loss") stats.losses++;
        if (outcome === "draw") stats.draws++;

        if (details.color === "white") {
            stats.whiteGames++;
            if (outcome === "win") stats.whiteWins++;
        } else {
            stats.blackGames++;
            if (outcome === "win") stats.blackWins++;
        }

        if (details.moves > 0) {
            if (details.moves < 20) {
                stats.shortGames++;
            } else if (details.moves <= 40) {
                stats.mediumGames++;
            } else {
                stats.longGames++;
            }
        }

        const opponentKey = details.opponent.toLowerCase();

        if (!opponentMap.has(opponentKey)) {
            opponentMap.set(opponentKey, {
                opponent: details.opponent,
                games: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                winPercentage: 0
            });
        }

        const opponentStats = opponentMap.get(opponentKey);
        opponentStats.games++;

        if (outcome === "win") opponentStats.wins++;
        if (outcome === "loss") opponentStats.losses++;
        if (outcome === "draw") opponentStats.draws++;

        if (details.firstMove !== "Unknown") {
            if (!firstMoveMap.has(details.firstMove)) {
                firstMoveMap.set(details.firstMove, {
                    firstMove: details.firstMove,
                    games: 0,
                    wins: 0,
                    winPercentage: 0
                });
            }

            const moveStats = firstMoveMap.get(details.firstMove);
            moveStats.games++;
            if (outcome === "win") moveStats.wins++;
        }

        if (details.opening !== "Unknown") {
            if (!openingMap.has(details.opening)) {
                openingMap.set(details.opening, {
                    opening: details.opening,
                    games: 0,
                    wins: 0,
                    winPercentage: 0
                });
            }

            const openingStats = openingMap.get(details.opening);
            openingStats.games++;
            if (outcome === "win") openingStats.wins++;
        }
    }

    stats.winPercentage = calculatePercentage(
        stats.wins,
        stats.totalGames
    );

    stats.whiteWinPercentage = calculatePercentage(
        stats.whiteWins,
        stats.whiteGames
    );

    stats.blackWinPercentage = calculatePercentage(
        stats.blackWins,
        stats.blackGames
    );

    stats.topOpponents = Array.from(opponentMap.values())
        .map(item => ({
            ...item,
            winPercentage: calculatePercentage(item.wins, item.games)
        }))
        .sort((a, b) => b.games - a.games)
        .slice(0, 10);

    stats.opponentPerformance = stats.topOpponents;

    stats.firstMovePerformance = Array.from(firstMoveMap.values())
        .map(item => ({
            ...item,
            winPercentage: calculatePercentage(item.wins, item.games)
        }))
        .sort((a, b) => b.games - a.games);

    stats.topOpenings = Array.from(openingMap.values())
        .map(item => ({
            ...item,
            winPercentage: calculatePercentage(item.wins, item.games)
        }))
        .sort((a, b) => b.games - a.games)
        .slice(0, 10);

    stats.performanceSummary =
        `You played ${stats.totalGames} games, won ${stats.wins}, ` +
        `lost ${stats.losses}, and drew ${stats.draws}. ` +
        `Your win rate was ${stats.winPercentage}%.`;

    return stats;
}

async function getMonthlyGames(username, year, month) {
    const url =
        `${API_BASE}/player/${encodeURIComponent(username)}` +
        `/games/${year}/${String(month).padStart(2, "0")}`;

    const data = await fetchChessData(url);
    return Array.isArray(data.games) ? data.games : [];
}

async function getMonthAnalysis(username, year, month) {
    const games = await getMonthlyGames(username, year, month);

    return calculateMonthStats(
        games,
        username,
        year,
        month
    );
}

function validateYearMonth(year, month) {
    return (
        Number.isInteger(year) &&
        year >= 2007 &&
        year <= 2100 &&
        Number.isInteger(month) &&
        month >= 1 &&
        month <= 12
    );
}

// ----------------------------------------------------
// 1. PLAYER MONTHLY ANALYSIS
// GET /api/analyze/:username/:year/:month
// ----------------------------------------------------

app.get(
    "/api/analyze/:username/:year/:month",
    async (req, res) => {
        try {
            const { username } = req.params;
            const year = Number(req.params.year);
            const month = Number(req.params.month);

            if (!username || !validateYearMonth(year, month)) {
                return res.status(400).json({
                    error: "Please provide a valid username, year and month."
                });
            }

            const stats = await getMonthAnalysis(
                username,
                year,
                month
            );

            return res.json({
                username,
                ...stats
            });
        } catch (error) {
            console.error("Analysis error:", error.message);

            return res.status(500).json({
                error: "Unable to analyze games.",
                details: error.message
            });
        }
    }
);

// ----------------------------------------------------
// 2. COMPARE TWO MONTHS
// GET /api/compare/:username/:year1/:month1/:year2/:month2
// ----------------------------------------------------

app.get(
    "/api/compare/:username/:year1/:month1/:year2/:month2",
    async (req, res) => {
        try {
            const {
                username,
                year1: year1Param,
                month1: month1Param,
                year2: year2Param,
                month2: month2Param
            } = req.params;

            const year1 = Number(year1Param);
            const month1 = Number(month1Param);
            const year2 = Number(year2Param);
            const month2 = Number(month2Param);

            if (
                !username ||
                !validateYearMonth(year1, month1) ||
                !validateYearMonth(year2, month2)
            ) {
                return res.status(400).json({
                    error: "Please provide valid months and years."
                });
            }

            const [firstMonth, secondMonth] = await Promise.all([
                getMonthAnalysis(username, year1, month1),
                getMonthAnalysis(username, year2, month2)
            ]);

            const winRateDifference = Number(
                (
                    secondMonth.winPercentage -
                    firstMonth.winPercentage
                ).toFixed(2)
            );

            return res.json({
                username,
                firstMonth,
                secondMonth,
                winRateDifference
            });
        } catch (error) {
            console.error("Comparison error:", error.message);

            return res.status(500).json({
                error: "Unable to compare the selected months.",
                details: error.message
            });
        }
    }
);

// ----------------------------------------------------
// 3. SIX-MONTH PERFORMANCE TREND
// GET /api/trend/:username
// ----------------------------------------------------

app.get("/api/trend/:username", async (req, res) => {
    try {
        const { username } = req.params;

        if (!username) {
            return res.status(400).json({
                error: "Please provide a Chess.com username."
            });
        }

        const now = new Date();
        const months = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(
                Date.UTC(
                    now.getUTCFullYear(),
                    now.getUTCMonth() - i,
                    1
                )
            );

            const year = date.getUTCFullYear();
            const month = date.getUTCMonth() + 1;

            try {
                const stats = await getMonthAnalysis(
                    username,
                    year,
                    month
                );

                months.push({
                    year,
                    month,
                    label: getMonthLabel(year, month),
                    totalGames: stats.totalGames,
                    wins: stats.wins,
                    draws: stats.draws,
                    losses: stats.losses,
                    winPercentage: stats.winPercentage
                });
            } catch (error) {
                console.error(
                    `Trend month error (${year}-${month}):`,
                    error.message
                );

                months.push({
                    year,
                    month,
                    label: getMonthLabel(year, month),
                    totalGames: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    winPercentage: 0
                });
            }
        }

        return res.json({
            username,
            months
        });
    } catch (error) {
        console.error("Trend error:", error.message);

        return res.status(500).json({
            error: "Unable to load monthly performance trend.",
            details: error.message
        });
    }
});

// ----------------------------------------------------
// SERVER
// ----------------------------------------------------

app.get("/", (req, res) => {
    res.send("Chess Game Analyzer API is running.");
});


// ==========================================
// OPPONENT DETAILED INSIGHTS
// ==========================================

app.get("/api/opponents/:username/:year/:month", async (req, res) => {
  try {
    const { username, year, month } = req.params;

    if (
      !/^\d{4}$/.test(year) ||
      Number(year) < 2007 ||
      Number(year) > new Date().getFullYear() ||
      !/^\d{1,2}$/.test(month) ||
      Number(month) < 1 ||
      Number(month) > 12
    ) {
      return res.status(400).json({ error: "Invalid year or month." });
    }

    const formattedMonth = String(month).padStart(2, "0");

    const url =
      `https://api.chess.com/pub/player/${encodeURIComponent(username)}` +
      `/games/${year}/${formattedMonth}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "ChessGameAnalyzer/1.0"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Unable to fetch Chess.com game archive."
      });
    }

    const archive = await response.json();
    const games = archive.games || [];

    const opponentMap = new Map();

    const drawResults = [
      "agreed",
      "repetition",
      "stalemate",
      "insufficient",
      "50move",
      "timevsinsufficient"
    ];

    games.forEach((game) => {
      const whiteName = game.white?.username || "";
      const blackName = game.black?.username || "";

      const isWhite =
        whiteName.toLowerCase() === username.toLowerCase();

      const isBlack =
        blackName.toLowerCase() === username.toLowerCase();

      if (!isWhite && !isBlack) return;

      const opponent = isWhite ? blackName : whiteName;
      if (!opponent) return;

      const playerResult = isWhite
        ? game.white?.result
        : game.black?.result;

      if (!opponentMap.has(opponent)) {
        opponentMap.set(opponent, {
          username: opponent,
          games: 0,
          wins: 0,
          losses: 0,
          draws: 0
        });
      }

      const stats = opponentMap.get(opponent);
      stats.games++;

      if (playerResult === "win") {
        stats.wins++;
      } else if (drawResults.includes(playerResult)) {
        stats.draws++;
      } else {
        stats.losses++;
      }
    });

    const opponents = Array.from(opponentMap.values()).map((item) => ({
      ...item,
      winPercentage:
        item.games > 0
          ? Number(((item.wins / item.games) * 100).toFixed(2))
          : 0
    }));

    const mostPlayed = [...opponents]
      .sort((a, b) => b.games - a.games)
      .slice(0, 10);

    const bestAgainst = [...opponents]
      .filter((item) => item.games >= 2)
      .sort((a, b) =>
        b.winPercentage - a.winPercentage ||
        b.games - a.games
      )
      .slice(0, 5);

    const toughestOpponents = [...opponents]
      .filter((item) => item.games >= 2)
      .sort((a, b) =>
        a.winPercentage - b.winPercentage ||
        b.games - a.games
      )
      .slice(0, 5);

    res.json({
      username,
      year: Number(year),
      month: Number(formattedMonth),
      totalOpponents: opponents.length,
      mostPlayed,
      bestAgainst,
      toughestOpponents,
      opponents
    });

  } catch (error) {
    console.error("Opponent insights error:", error);

    res.status(500).json({
      error: "Unable to calculate opponent insights."
    });
  }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
