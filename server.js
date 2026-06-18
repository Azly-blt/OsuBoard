import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const cleanId = Number((process.env.OSU_CLIENT_ID || '').trim());
const cleanSecret = (process.env.OSU_CLIENT_SECRET || '').trim();

let osuAccessToken = null;

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
            osuAccessToken = data.access_token;
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

app.get('/', (req, res) => {
    res.send('osu! API Backend is running!');
});

app.get('/api/player/:username', async (req, res) => {
    if (!osuAccessToken) {
        return res.status(500).json({ error: "Backend is not authenticated with osu! yet." });
    }

    try {
        const encodedName = encodeURIComponent(req.params.username);
        
        let userRes = await fetch(`https://osu.ppy.sh/api/v2/users/${encodedName}`, {
            headers: {
                "Authorization": `Bearer ${osuAccessToken}`,
                "Accept": "application/json"
            }
        });

        if (userRes.status === 401) {
            console.log("⚠️ osu! token expired or invalid. Fetching a fresh one...");
            await authenticateOsu();
            
            userRes = await fetch(`https://osu.ppy.sh/api/v2/users/${encodedName}`, {
                headers: {
                    "Authorization": `Bearer ${osuAccessToken}`,
                    "Accept": "application/json"
                }
            });
        }

        if (!userRes.ok) {
            if (userRes.status === 404) {
                return res.status(404).json({ error: "That osu! user could not be found." });
            }
            throw new Error(`osu! user fetch failed with status ${userRes.status}`);
        }

        const user = await userRes.json();
        
        res.json(user);

    } catch (error) {
        console.error("Error fetching player:", error.message);
        res.status(500).json({ error: `Backend Error: ${error.message}` });
    }
});

app.listen(port, () => {
    console.log(`🚀 Backend server listening internally on port ${port}`);
});