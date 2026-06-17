document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.getElementById('nav-toggle');
    const mainNav = document.getElementById('main-nav');

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('hidden');
            
            if (mainNav.classList.contains('hidden')) {
                navToggle.innerHTML = '&#9776;';
            } else {
                navToggle.innerHTML = '&#10005;';
            }
        });
    } else {
        console.warn("Navigation elements not found on this page.");
    }
});