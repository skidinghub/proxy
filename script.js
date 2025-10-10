// Theme functionality
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Create theme toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle';
    toggleBtn.innerHTML = '🌙';
    toggleBtn.title = 'Toggle theme';
    toggleBtn.onclick = toggleTheme;
    document.body.appendChild(toggleBtn);
    
    updateThemeButton(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
    const btn = document.querySelector('.theme-toggle');
    btn.innerHTML = theme === 'dark' ? '🌙' : '☀️';
}

// Proxy form handling
document.getElementById('proxyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const urlInput = document.getElementById('urlInput');
    let url = urlInput.value.trim();
    
    // Add https:// if no protocol specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    // Validate URL
    try {
        new URL(url);
        // Redirect to proxy page with URL parameter
        window.location.href = `proxy.html?url=${encodeURIComponent(url)}`;
    } catch (err) {
        alert('Please enter a valid URL');
        urlInput.focus();
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initTheme);