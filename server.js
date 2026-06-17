import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as osu from 'osu-api-v2-js';

// Load environment variables from your .env file
dotenv.config();

const app = express();
// Your Docker container routes traffic to this internal port (3000)
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allows your frontend to safely make requests to this backend
app.use(express.json());
app.use(express.static('public'));

// Set up the osu! API client
let osuApi;

async function initOsuApi() {
    try {
        osuApi = await osu.auth.clientCredentialsGrant(
            Number(process.env.OSU_CLIENT_ID),
            process.env.OSU_CLIENT_SECRET
        );
        console.log("✅ Successfully connected to the osu! API!");
    } catch (error) {
        console.error("❌ Failed to authenticate with osu! API. Check your .env credentials.", error);
    }
}

// Initialize the API connection when the server starts
initOsuApi();

// Base route just to check if the server is running
app.get('/', (req, res) => {
    res.send('osu! API Backend is running!');
});

// Main Route: Get a player's recent scores
app.get('/api/scores/:username', async (req, res) => {
    try {
        const username = req.params.username;
        
        // 1. Fetch user info to get their numerical ID
        const user = await osuApi.users.getUser(username);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // 2. Fetch their recent scores using that ID
        // Getting their top 5 most recent plays
        const scores = await osuApi.users.getUserScores(user.id, "recent", { limit: 5 });
        
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
});