const express = require("express");

const app = express();

app.get("/",(req,res) => {
    res.send("Welcome to my Chess Game Analyzer!");
});

app.get("/api/player/:username", async(req,res)=> {
    const username = req.params.username;

try{
    const response = await fetch(
        'https://api.chess.com/pub/player/${username}',
        {
            headers:{
                "User-Agent":
                "ChessGameAnalyzer/1.0(learning project)"
            }
        }
    
    );
    if(!response.ok){
        return
        res.status(response.status).json({
            error:"Player not Found"
        });
    }
    const data = await response.json();

    res.json(data);
}catch(error){
    res.status(500).json({
        error:"Something went wrong"
    });
}
});

app.listen(3000,() =>{
    console.log("Server running on http://localhost:3000");
});