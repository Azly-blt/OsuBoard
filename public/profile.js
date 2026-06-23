document.addEventListener('DOMContentLoaded', async () => {
    // 1. Grab the token from the URL
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token');

    // 2. Security: Hide the token from the URL bar immediately!
    if (token) {
        // Save to local storage so you stay logged in if you refresh the page
        localStorage.setItem('osu_token', token);
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        // If no token in URL, check if we saved one earlier
        token = localStorage.getItem('osu_token');
    }

    const container = document.getElementById('profile-container');

    // If still no token, stop here and leave the "Please Login" message on the screen
    if (!token) return;

    // Show loading state
    container.innerHTML = `<h2 style="text-align:center;">Fetching your dashboard... ⏳</h2>`;

    try {
        // 3. Fetch the private "Me" profile
        const meRes = await fetch("https://osu.ppy.sh/api/v2/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!meRes.ok) throw new Error("Token expired");
        const user = await meRes.json();

        // 4. Fetch your Top 5 Plays
        const topRes = await fetch(`https://osu.ppy.sh/api/v2/users/${user.id}/scores/best?limit=5`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const topPlays = await topRes.json();

        // 5. Draw the Dashboard!
        renderDashboard(user, topPlays);

    } catch (error) {
        console.error("Auth Error:", error);
        localStorage.removeItem('osu_token');
        container.innerHTML = `
            <div class="login-prompt">
                <h2>Session Expired</h2>
                <p>Your login token expired. Please log in again.</p>
                <a href="/auth/login" class="search-btn" style="width: auto; padding: 10px 20px; text-decoration: none; display: inline-block;">Login</a>
            </div>`;
    }
});

function renderDashboard(user, topPlays) {
    const container = document.getElementById('profile-container');
    
    // Calculate hours played
    const hoursPlayed = Math.round(user.statistics.play_time / 3600);

    // Build the Top 5 Plays HTML
    const topPlaysHtml = topPlays.map(score => `
        <div class="score-item">
            <div>
                <div class="score-song">${score.beatmapset.title}</div>
                <div class="score-diff">[${score.beatmap.version}] • ${(score.accuracy * 100).toFixed(2)}%</div>
            </div>
            <div class="score-pp">${Math.round(score.pp)} pp</div>
        </div>
    `).join('');

    // Build the Play History Chart HTML (Last 12 months)
    const history = user.monthly_playcounts || [];
    // Find the highest playcount month to scale the bars properly
    const maxPlays = Math.max(...history.map(m => m.count), 1); 
    
    const chartHtml = history.slice(-12).map(month => {
        const heightPercent = (month.count / maxPlays) * 100;
        return `<div class="chart-bar" style="height: ${heightPercent}%" title="${month.start_date}: ${month.count} plays"></div>`;
    }).join('');

    // Inject everything into the grid
    container.innerHTML = `
        <div class="dashboard-grid">
            
            <div class="dashboard-card profile-header-card">
                <img src="${user.avatar_url}" alt="Avatar" class="profile-avatar">
                <div>
                    <h1 class="profile-name">${user.username}</h1>
                    <div class="play-time">🕒 Total Play Time: ${new Intl.NumberFormat().format(hoursPlayed)} Hours</div>
                    <p style="color: var(--text-muted); margin-top: 5px;">Global Rank: #${new Intl.NumberFormat().format(user.statistics.global_rank)}</p>
                </div>
            </div>

            <div class="dashboard-card">
                <h2>About Me!</h2>
                <hr style="border-color: #333; margin: 10px 0;">
                <div class="me-section">
                    ${user.page.html || "<i>This user hasn't written a me! section yet.</i>"}
                </div>
            </div>

            <div class="dashboard-card">
                <h2>Top 5 Plays</h2>
                <hr style="border-color: #333; margin: 10px 0;">
                <div class="top-plays-list">
                    ${topPlaysHtml}
                </div>
            </div>

            <div class="dashboard-card profile-header-card" style="display: block;">
                <h2>Play History (Last 12 Months)</h2>
                <div class="chart-container">
                    ${chartHtml}
                </div>
            </div>

        </div>
    `;
}