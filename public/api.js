document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('player-search-form');
    const searchInput = document.getElementById('player-search-input');

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const username = searchInput.value.trim();
            if (!username) return;

            const submitBtn = searchForm.querySelector('button');
            const originalIcon = submitBtn.innerHTML;
            submitBtn.innerHTML = "⏳"; 
            submitBtn.disabled = true;

            try {
                // Call our updated fetch function
                const profileData = await fetchPlayerProfile(username);
                console.log(`✅ Successfully fetched profile for ${username}:`, profileData);
                

            } catch (error) {
                console.error("❌ Search failed:", error);
                alert(`Could not fetch scores for '${username}'. They might not exist or haven't played recently.`);
            } finally {
                submitBtn.innerHTML = originalIcon;
                submitBtn.disabled = false;
                searchInput.value = ''; 
            }
        });
    }
});

// Updated to call the new /api/player endpoint
async function fetchPlayerProfile(username) {
    const response = await fetch(`/api/player/${encodeURIComponent(username)}`);
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }
    
    return await response.json();
}