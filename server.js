import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as osu from 'osu-api-v2-js';

// Load environment variables from your .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve your HTML/CSS from the public folder

// Set up the osu! API client (This automatically authenticates!)
const cleanId = Number((process.env.OSU_CLIENT_ID || '').trim());
const cleanSecret = (process.env.OSU_CLIENT_SECRET || '').trim();

const osuApi = new osu.API(cleanId, cleanSecret);
// Base route just to check if the server is running
app.get('/', (req, res) => {
    res.send('osu! API Backend is running!');
});

// Main Route: Get a player's recent scores
app.get('/api/scores/:username', async (req, res) => {
    try {
        const username = req.params.username;
        
        // 1. Fetch user info
        // With this package, we just pass the username directly to getUser()
        const user = await osuApi.getUser(username);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // 2. Fetch their recent scores
        // We pass the user object itself and the string "recent"
        const scores = await osuApi.getUserScores(user, "recent");
        
        // 3. Send the data back to your frontend
        res.json(scores);
    } catch (error) {
        console.error("Error fetching scores:", error);
        res.status(500).json({ error: "Failed to fetch scores from osu!" });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Backend server listening internally on port ${port}`);
    console.log(`✅ osu! API is ready to accept requests!`);
});