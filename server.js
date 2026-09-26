const express = require("express");

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

app.listen(3001, () => {
    console.log("Server running on http://localhost:3001");
});