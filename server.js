
const express = require("express");
const { Chess } = require("chess.js");

const app = express();
const PORT = process.env.PORT || 3001;

const HEADERS = {
    "User-Agent": "ChessGameAnalyzer/1.0 (learning project)"
};

async function chessComFetch(url) {
    const response = await fetch(url, { headers: HEADERS });

    if (!response.ok) {
        const error = new Error(`Chess.com API returned ${response.status}`);
        error.status = response.status;
        throw error;
    }

    return response;
}

function validateMonth(year, month) {
    return /^\d{4}$/.test(year) &&
        /^\d{2}$/.test(month) &&
        Number(month) >= 1 &&
        Number(month) <= 12;
}

function percentage(value, total) {
    return total > 0 ? ((value / total) * 100).toFixed(2) : "0.00";
}

function getGameLength(totalMoves) {
    if (totalMoves <= 20) return "Short";
    if (totalMoves <= 40) return "Medium";
    return "Long";
}

function createOutcomeStats() {
    return { games: 0, wins: 0, losses: 0, draws: 0 };
}

function recordOutcome(stats, outcome) {
    stats.games++;

    if (outcome === "win") stats.wins++;
    else if (outcome === "loss") stats.losses++;
    else if (outcome === "draw") stats.draws++;
}

function getPlayerOutcome(result, color) {
    if (result === "1/2-1/2") return "draw";

    if (result === "1-0") {
        return color === "white" ? "win" : "loss";
    }

    if (result === "0-1") {
        return color === "black" ? "win" : "loss";
    }

    return "unknown";
}

function getPerformanceCategory(stats) {
    if (stats.games < 5) return "Insufficient Data";

    const winRate = Number(percentage(stats.wins, stats.games));

    if (winRate >= 60) return "Strong";
    if (winRate >= 40) return "Average";
    return "Needs Improvement";
}

app.get("/", (req, res) => {
    res.send("Welcome to my Chess Game Analyzer!");
});

// Get player profile
app.get("/api/player/:username", async (req, res) => {
    const { username } = req.params;

    try {
        const response = await chessComFetch(
            `https://api.chess.com/pub/player/${encodeURIComponent(username)}`
        );

        res.json(await response.json());
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.status === 404
                ? "Player not found"
                : "Unable to fetch player profile",
            details: error.message
        });
    }
});

// Get all monthly archive URLs for a player
app.get("/api/player/:username/games", async (req, res) => {
    const { username } = req.params;

    try {
        const response = await chessComFetch(
            `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`
        );

        res.json(await response.json());
    } catch (error) {
        res.status(error.status || 500).json({
            error: "Unable to fetch player archives",
            details: error.message
        });
    }
});

// Get games for a particular month
app.get("/api/player/:username/games/:year/:month", async (req, res) => {
    const { username, year, month } = req.params;

    if (!validateMonth(year, month)) {
        return res.status(400).json({
            error: "Invalid year or month. Use a four-digit year and month from 01 to 12."
        });
    }

    try {
        const response = await chessComFetch(
            `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/${year}/${month}`
        );

        const data = await response.json();
        const games = Array.isArray(data.games) ? data.games : [];

        res.json({
            username,
            year,
            month,
            totalGames: games.length,
            games: games.map(game => ({
                url: game.url,
                pgnAvailable: Boolean(game.pgn),
                timeControl: game.time_control,
                rated: game.rated,
                endTime: game.end_time,
                white: game.white?.username,
                whiteRating: game.white?.rating,
                black: game.black?.username,
                blackRating: game.black?.rating,
                result: game.white?.result === "win"
                    ? "1-0"
                    : game.black?.result === "win"
                        ? "0-1"
                        : game.white?.result === "agreed" ||
                          game.white?.result === "repetition" ||
                          game.white?.result === "stalemate" ||
                          game.white?.result === "insufficient" ||
                          game.white?.result === "50move" ||
                          game.white?.result === "timevsinsufficient" ||
                          game.white?.result === "threecheck"
                            ? "1/2-1/2"
                            : game.black?.result === "agreed" ||
                              game.black?.result === "repetition" ||
                              game.black?.result === "stalemate" ||
                              game.black?.result === "insufficient" ||
                              game.black?.result === "50move" ||
                              game.black?.result === "timevsinsufficient" ||
                              game.black?.result === "threecheck"
                                ? "1/2-1/2"
                                : "*"
            }))
        });
    } catch (error) {
        res.status(error.status || 500).json({
            error: "Unable to fetch monthly games",
            details: error.message
        });
    }
});

// Analyze a player's games for a particular month
app.get("/api/analyze/:username/:year/:month", async (req, res) => {
    const { username, year, month } = req.params;

    if (!validateMonth(year, month)) {
        return res.status(400).json({
            error: "Invalid year or month. Use a four-digit year and month from 01 to 12."
        });
    }

    try {
        const response = await chessComFetch(
            `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/${year}/${month}`
        );

        const data = await response.json();
        const sourceGames = Array.isArray(data.games) ? data.games : [];

        let wins = 0;
        let losses = 0;
        let draws = 0;

        let whiteGames = 0;
        let blackGames = 0;

        let whiteWins = 0;
        let whiteLosses = 0;
        let whiteDraws = 0;

        let blackWins = 0;
        let blackLosses = 0;
        let blackDraws = 0;

        const lengthStats = {
            Short: createOutcomeStats(),
            Medium: createOutcomeStats(),
            Long: createOutcomeStats()
        };

        const opponents = {};
        const opponentStats = {};
        const firstMoveStats = {};
        const analyzedGames = [];

        let skippedGames = 0;

        for (const sourceGame of sourceGames) {
            if (!sourceGame.pgn) {
                skippedGames++;
                continue;
            }

            try {
                const chess = new Chess();
                chess.loadPgn(sourceGame.pgn);

                const headers = chess.header();
                const white = headers.White || sourceGame.white?.username || "Unknown";
                const black = headers.Black || sourceGame.black?.username || "Unknown";
                const result = headers.Result || "*";

                const playerIsWhite =
                    white.toLowerCase() === username.toLowerCase();

                const playerIsBlack =
                    black.toLowerCase() === username.toLowerCase();

                if (!playerIsWhite && !playerIsBlack) {
                    skippedGames++;
                    continue;
                }

                const playerColor = playerIsWhite ? "white" : "black";
                const opponent = playerIsWhite ? black : white;
                const outcome = getPlayerOutcome(result, playerColor);

                if (!opponents[opponent]) {
                    opponents[opponent] = 0;
                }

                opponents[opponent]++;

                if (!opponentStats[opponent]) {
                    opponentStats[opponent] = createOutcomeStats();
                }

                const opponentOutcome =
                    outcome === "win" ? "loss" :
                    outcome === "loss" ? "win" : outcome;

                if (outcome !== "unknown") {
                    recordOutcome(opponentStats[opponent], opponentOutcome);

                    if (outcome === "win") wins++;
                    if (outcome === "loss") losses++;
                    if (outcome === "draw") draws++;

                    if (playerColor === "white") {
                        whiteGames++;
                        if (outcome === "win") whiteWins++;
                        if (outcome === "loss") whiteLosses++;
                        if (outcome === "draw") whiteDraws++;
                    } else {
                        blackGames++;
                        if (outcome === "win") blackWins++;
                        if (outcome === "loss") blackLosses++;
                        if (outcome === "draw") blackDraws++;
                    }
                } else {
                    if (playerColor === "white") whiteGames++;
                    else blackGames++;
                }

                const verboseMoves = chess.history({ verbose: true });
                const moves = verboseMoves.map(move => move.san);
                const totalMoves = moves.length;
                const gameLength = getGameLength(totalMoves);

                if (outcome !== "unknown") {
                    recordOutcome(lengthStats[gameLength], outcome);
                } else {
                    lengthStats[gameLength].games++;
                }

                // Find this player's first move, not the opponent's first move.
                const ownFirstMove = verboseMoves.find(
                    move => move.color === playerColor[0]
                );

                if (ownFirstMove) {
                    const firstMove = ownFirstMove.san;

                    if (!firstMoveStats[firstMove]) {
                        firstMoveStats[firstMove] = createOutcomeStats();
                    }

                    if (outcome !== "unknown") {
                        recordOutcome(firstMoveStats[firstMove], outcome);
                    } else {
                        firstMoveStats[firstMove].games++;
                    }
                }

                analyzedGames.push({
                    white,
                    black,
                    result,
                    moves,
                    totalMoves,
                    gameLength,
                    openingMoves: moves.slice(0, 10),
                    playerColor,
                    playerOutcome: outcome,
                    playerFirstMove: ownFirstMove?.san || null,
                    finalPosition: chess.fen(),
                    url: sourceGame.url
                });
            } catch (error) {
                skippedGames++;
                console.error("Skipping invalid game:", error.message);
            }
        }

        const totalGames = analyzedGames.length;

        const opponentList = Object.entries(opponents)
            .map(([opponent, games]) => ({ opponent, games }))
            .sort((a, b) => b.games - a.games);

        const topOpponents = opponentList.slice(0, 10);

        const opponentPerformance = Object.entries(opponentStats)
            .map(([opponent, stats]) => ({
                opponent,
                games: stats.games,
                wins: stats.wins,
                losses: stats.losses,
                draws: stats.draws,
                winPercentage: percentage(stats.wins, stats.games)
            }))
            .sort((a, b) =>
                Number(b.winPercentage) - Number(a.winPercentage)
            );

        const topOpponentPerformance = opponentPerformance.slice(0, 10);

        const firstMovePerformance = Object.entries(firstMoveStats)
            .map(([firstMove, stats]) => ({
                firstMove,
                games: stats.games,
                wins: stats.wins,
                losses: stats.losses,
                draws: stats.draws,
                winPercentage: percentage(stats.wins, stats.games),
                drawPercentage: percentage(stats.draws, stats.games),
                lossPercentage: percentage(stats.losses, stats.games),
                performanceCategory: getPerformanceCategory(stats)
            }))
            .sort((a, b) =>
                Number(b.winPercentage) - Number(a.winPercentage)
            );

        const firstMoveSummary = {
            strong: 0,
            average: 0,
            needsImprovement: 0,
            insufficientData: 0
        };

        for (const move of firstMovePerformance) {
            if (move.performanceCategory === "Strong") {
                firstMoveSummary.strong++;
            } else if (move.performanceCategory === "Average") {
                firstMoveSummary.average++;
            } else if (move.performanceCategory === "Needs Improvement") {
                firstMoveSummary.needsImprovement++;
            } else {
                firstMoveSummary.insufficientData++;
            }
        }

        const eligibleFirstMoves = firstMovePerformance.filter(
            move => move.games >= 5
        );

        const firstMoveComparison = firstMovePerformance.map(move => ({
            firstMove: move.firstMove,
            games: move.games,
            wins: move.wins,
            draws: move.draws,
            losses: move.losses,
            winPercentage: move.winPercentage,
            drawPercentage: move.drawPercentage,
            lossPercentage: move.lossPercentage
        }));

        const topFirstMoves = firstMovePerformance.slice(0, 5);

        const bestFirstMove = eligibleFirstMoves.length
            ? eligibleFirstMoves[0]
            : null;

        const worstFirstMove = eligibleFirstMoves.length
            ? eligibleFirstMoves[eligibleFirstMoves.length - 1]
            : null;

        const performanceSummary = {
            totalGames,
            wins,
            losses,
            draws,
            winPercentage: percentage(wins, totalGames),
            drawPercentage: percentage(draws, totalGames),
            lossPercentage: percentage(losses, totalGames)
        };

        res.json({
            username,
            year,
            month,
            totalGames,
            skippedGames,

            wins,
            losses,
            draws,
            winPercentage: percentage(wins, totalGames),
            drawPercentage: percentage(draws, totalGames),
            lossPercentage: percentage(losses, totalGames),

            whiteGames,
            blackGames,
            whiteWins,
            whiteLosses,
            whiteDraws,
            whiteWinPercentage: percentage(whiteWins, whiteGames),
            blackWins,
            blackLosses,
            blackDraws,
            blackWinPercentage: percentage(blackWins, blackGames),

            opponents,
            topOpponents,
            opponentStats,
            opponentPerformance,
            topOpponentPerformance,

            firstMoveStats,
            firstMovePerformance,
            topFirstMoves,
            eligibleFirstMoves,
            bestFirstMove,
            worstFirstMove,
            firstMoveComparison,
            firstMoveSummary,
            performanceSummary,

            shortGames: lengthStats.Short.games,
            mediumGames: lengthStats.Medium.games,
            longGames: lengthStats.Long.games,

            shortWins: lengthStats.Short.wins,
            shortLosses: lengthStats.Short.losses,
            shortDraws: lengthStats.Short.draws,

            mediumWins: lengthStats.Medium.wins,
            mediumLosses: lengthStats.Medium.losses,
            mediumDraws: lengthStats.Medium.draws,

            longWins: lengthStats.Long.wins,
            longLosses: lengthStats.Long.losses,
            longDraws: lengthStats.Long.draws,

            games: analyzedGames
        });
    } catch (error) {
        console.error("Analysis error:", error.message);

        res.status(error.status || 500).json({
            error: "Unable to analyze games",
            details: error.message
        });
    }
});

// Test chess.js
app.get("/test-chess", (req, res) => {
    const chess = new Chess();

    chess.move("e4");
    chess.move("e5");
    chess.move("Nf3");

    res.json({
        position: chess.fen(),
        moves: chess.history()
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
