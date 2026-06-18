document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('player-search-form');
    const searchInput = document.getElementById('player-search-input');
    const profileContainer = document.getElementById('profile-result');

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const username = searchInput.value.trim();
            if (!username) return;

            const submitBtn = searchForm.querySelector('button');
            const originalIcon = submitBtn.innerHTML;
            submitBtn.innerHTML = "⏳"; 
            submitBtn.disabled = true;

            // Hide the old card if doing a new search
            if (profileContainer) {
                profileContainer.classList.remove('visible');
                setTimeout(() => profileContainer.classList.add('hidden'), 400);
            }

            try {
                const profileData = await fetchPlayerProfile(username);
                console.log(`✅ Successfully fetched profile:`, profileData);
                
                // CALL THE NEW RENDER FUNCTION!
                renderProfile(profileData);

            } catch (error) {
                console.error("❌ Search failed:", error);
                alert(`Could not fetch profile for '${username}'. They might not exist.`);
            } finally {
                submitBtn.innerHTML = originalIcon;
                submitBtn.disabled = false;
                searchInput.value = ''; 
            }
        });
    }
});

async function fetchPlayerProfile(username) {
    const response = await fetch(`/api/player/${encodeURIComponent(username)}`);
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }
    
    return await response.json();
}

// ==========================================
// NEW FUNCTION: Draw the data on the screen
// ==========================================
function renderProfile(user) {
    const container = document.getElementById('profile-result');
    if (!container) return;

    // Helper function to add commas to big numbers (e.g., 10000 -> 10,000)
    const formatNum = (num) => new Intl.NumberFormat().format(num || 0);

    // Build the HTML structure using the JSON data
    container.innerHTML = `
        <img src="${user.avatar_url}" alt="${user.username}'s avatar" class="profile-avatar">
        <div class="profile-info">
            <div class="profile-name">${user.username}</div>
            
            <div class="profile-badges">
                <span class="badge">#${formatNum(user.statistics?.global_rank)}</span>
                <span class="badge">${user.country_code}</span>
            </div>
            
            <div class="profile-stats">
                <div class="stat-box">
                    <span class="stat-label">Performance</span>
                    <span class="stat-value">${formatNum(Math.round(user.statistics?.pp))} pp</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Accuracy</span>
                    <span class="stat-value">${(user.statistics?.hit_accuracy || 0).toFixed(2)}%</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Play Count</span>
                    <span class="stat-value">${formatNum(user.statistics?.play_count)}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Level</span>
                    <span class="stat-value">${user.statistics?.level?.current || 0}</span>
                </div>
            </div>
        </div>
    `;

    // Remove the hidden class, then wait 10ms to add the visible class to trigger the CSS fade-in animation
    container.classList.remove('hidden');
    setTimeout(() => {
        container.classList.add('visible');
    }, 10);
}