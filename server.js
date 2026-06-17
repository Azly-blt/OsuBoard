import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const cleanId = Number((process.env.OSU_CLIENT_ID || '').trim());
const cleanSecret = (process.env.OSU_CLIENT_SECRET || '').trim();

// Store the valid token globally
let osuAccessToken = null;

// 1. Manually authenticate using native Node.js fetch
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
            osuAccessToken = data.access_token; // Save the token!
            console.log("[DEBUG] ✅ Successfully got access token from osu!");
            console.log(`🚀 osu! API is ready to accept requests!`);
        } else {
            console.error("❌ osu! rejected the credentials:", data);
        }
    } catch (error) {
        console.error("❌ Failed to reach osu! auth servers:", error);
    }
}

authenticateOsu();

// Base route
app.get('/', (req, res) => {
    res.send('osu! API Backend is running!');
});

// 2. Main Route: Fetch data directly using the token
app.get('/api/scores/:username', async (req, res) => {
    if (!osuAccessToken) {
        return res.status(500).json({ error: "Backend is not authenticated with osu! yet." });
    }

    try {
        // Encode the username in case it has weird characters/spaces
        const encodedName = encodeURIComponent(req.params.username);
        
        // STEP A: Fetch the user data directly from osu! API
        const userRes = await fetch(`https://osu.ppy.sh/api/v2/users/${encodedName}`, {
            headers: {
                "Authorization": `Bearer ${osuAccessToken}`,
                "Accept": "application/json"
            }
        });

        if (!userRes.ok) {
            if (userRes.status === 404) {
                return res.status(404).json({ error: "That osu! user could not be found." });
            }
            throw new Error(`osu! user fetch failed with status ${userRes.status}`);
        }

        const user = await userRes.json();

        // STEP B: Fetch the recent scores using the user's ID
        const scoresRes = await fetch(`https://osu.ppy.sh/api/v2/users/${user.id}/scores/recent?limit=5`, {
            headers: {
                "Authorization": `Bearer ${osuAccessToken}`,
                "Accept": "application/json"
            }
        });

        if (!scoresRes.ok) {
            throw new Error(`osu! scores fetch failed with status ${scoresRes.status}`);
        }

        const scores = await scoresRes.json();
        
        // STEP C: Send the data to your frontend
        res.json(scores);

    } catch (error) {
        console.error("Error fetching scores:", error.message);
        res.status(500).json({ error: `Backend Error: ${error.message}` });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Backend server listening internally on port ${port}`);
});