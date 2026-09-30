const express = require("express");
const { Chess } = require("chess.js");

const app = express();

app.get("/", (req, res) => {
    res.send("Welcome to my Chess Game Analyzer!");
});

app.get("/api/player/:username", async (req, res) => {
    const username = req.params.username;

    try {
        const response = await fetch(
            `https://api.chess.com/pub/player/${username}`,
            {
                headers: {
                    "User-Agent": "ChessGameAnalyzer/1.0 (learning project)"
                }
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Player not found"
            });
        }

        const data = await response.json();

        res.json(data);
    } catch (error) {
        res.status(500).json({
            error: "Something went wrong"
        });
    }
});

app.get("/api/player/:username/games", async (req, res) => {
    const username = req.params.username;

    try {
        const archiveResponse = await fetch(
            `https://api.chess.com/pub/player/${username}/games/archives`,
            {
                headers: {
                    "User-Agent": "ChessGameAnalyzer/1.0 (learning project)"
                }
            }
        );

        if (!archiveResponse.ok) {
            return res.status(archiveResponse.status).json({
                error: "Player archives not found"
            });
        }

        const archives = await archiveResponse.json();

        res.json(archives);
    } catch (error) {
        res.status(500).json({
            error: "Something went wrong"
        });
    }
});

app.get("/api/player/:username/games/:year/:month", async (req, res) => {
    const { username, year, month } = req.params;

    try {
        const response = await fetch(
            `https://api.chess.com/pub/player/${username}/games/${year}/${month}/pgn`,
            {
                headers: {
                    "User-Agent": "ChessGameAnalyzer/1.0 (learning project)"
                }
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Games not found"
            });
        }

        const pgn = await response.text();

        res.type("text/plain");
        res.send(pgn);
    } catch (error) {
        res.status(500).json({
            error: "Something went wrong"
        });
    }
});

app.get("/api/analyze/:username/:year/:month", async (req, res) => {
    const { username, year, month } = req.params;

    try {
        const response = await fetch(
            `https://api.chess.com/pub/player/${username}/games/${year}/${month}/pgn`,
            {
                headers: {
                    "User-Agent": "ChessGameAnalyzer/1.0 (learning project)"
                }
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Games not found"
            });
        }

        const pgn = await response.text();

        const games = pgn.split(/\n\n(?=\[Event )/);

        const analyzedGames = [];
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

        for (const gamePgn of games) {
            const chess = new Chess();

            try {
                const loaded = chess.loadPgn(gamePgn);

                if (loaded === false) {
                    continue;
                }
                

            const headers = chess.header();
            if (headers.White.toLowerCase() === username.toLowerCase()) {
    whiteGames++;
} else if (headers.Black.toLowerCase() === username.toLowerCase()) {
    blackGames++;
}

if (headers.Result === "1-0") {
    if (headers.White.toLowerCase() === username.toLowerCase()) {
        wins++;
        whiteWins++;
    } else {
        losses++;
        blackLosses++;
    }
}

if (headers.Result === "0-1") {
    if (headers.Black.toLowerCase() === username.toLowerCase()) {
        wins++;
        blackWins++;
    } else {
        losses++;
        whiteLosses++;
    }
}

if (headers.Result === "1/2-1/2") {
    draws++;

    if (headers.White.toLowerCase() === username.toLowerCase()) {
        whiteDraws++;
    } else {
        blackDraws++;
    }
}

analyzedGames.push({
    white: headers.White,
    black: headers.Black,
    result: headers.Result,
    moves: chess.history(),
    totalMoves: chess.history().length,
    finalPosition: chess.fen()
});

            } catch (error) {
                console.log("Skipping game:", error.message);
            }
        }
        const totalGames = analyzedGames.length;

const winPercentage = totalGames > 0
    ? ((wins / totalGames) * 100).toFixed(2)
    : "0.00";
        res.json({
        username: username,
        year: year,
        month: month,
        totalGames: analyzedGames.length,
        wins: wins,
        losses: losses,
        draws: draws,
        whiteGames: whiteGames,
        blackGames: blackGames,
        whiteWins: whiteWins,
        whiteLosses: whiteLosses,
        whiteDraws: whiteDraws,
        blackWins: blackWins,
        blackLosses: blackLosses,
        blackDraws: blackDraws,
        winPercentage: winPercentage,
        games: analyzedGames
    });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

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

app.get("/test-pgn", async (req, res) => {
    const response = await fetch(
        "https://api.chess.com/pub/player/Hikaru/games/2026/09/pgn",
        {
            headers: {
                "User-Agent": "ChessGameAnalyzer/1.0 (learning project)"
            }
        }
    );

    const pgn = await response.text();

    const games = pgn.split(/\n\n(?=\[Event )/);

    res.json({
        totalGames: games.length,
        firstGame: games[0]
    });
});

app.listen(3001, () => {
    console.log("Server running on http://localhost:3001");
});