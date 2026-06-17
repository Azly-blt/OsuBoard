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
                const scores = await fetchPlayerScores(username);
                console.log(`✅ Successfully fetched data for ${username}:`, scores);
                
                // Future function call to build the UI widgets will go here
                // renderScores(scores); 

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

async function fetchPlayerScores(username) {
    const response = await fetch(`/api/scores/${encodeURIComponent(username)}`);
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }
    
    return await response.json();
}