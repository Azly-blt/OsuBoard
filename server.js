import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as osu from 'osu-api-v2-js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Clean up credentials
const cleanId = Number((process.env.OSU_CLIENT_ID || '').trim());
const cleanSecret = (process.env.OSU_CLIENT_SECRET || '').trim();

let osuApi;

// 🛑 THE ULTIMATE FIX: Manually authenticate using native Node.js fetch
async function authenticateOsu() {
    try {
        console.log(`[DEBUG] Requesting osu! token for ID: ${cleanId}`);
        
        const response = await fetch("https://osu.ppy.sh/oauth/token", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                client_id: cleanId,
                client_secret: cleanSecret,
                grant_type: "client_credentials",
                scope: "public"
            })
        });

        const data = await response.json();

        if (data.access_token) {
            console.log("[DEBUG] ✅ Successfully got access token from osu!");
            // Initialize the API wrapper using just the token!
            osuApi = new osu.API(data.access_token);
            console.log(`🚀 osu! API is ready to accept requests!`);
        } else {
            // If the keys are wrong, osu! will tell us exactly why here.
            console.error("❌ osu! rejected the credentials. Full response:", data);
        }
    } catch (error) {
        console.error("❌ Failed to reach osu! auth servers:", error);
    }
}

// Start the auth process immediately
authenticateOsu();

// Base route
app.get('/', (req, res) => {
    res.send('osu! API Backend is running!');
});

// Main Route: Get a player's recent scores
app.get('/api/scores/:username', async (req, res) => {
    // Safety check in case auth failed
    if (!osuApi) {
        return res.status(500).json({ error: "Backend is not authenticated with osu! yet. Check your server logs." });
    }

    try {
        const username = req.params.username;
        const user = await osuApi.getUser(username);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const scores = await osuApi.getUserScores(user, "recent");
        res.json(scores);
    } catch (error) {
        console.error("Error fetching scores:", error.message);
        if (error.message && error.message.includes("404")) {
            return res.status(404).json({ error: "That osu! user could not be found." });
        }
        res.status(500).json({ error: `Backend Error: ${error.message}` });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Backend server listening internally on port ${port}`);
});