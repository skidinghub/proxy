// Enhanced Dark Proxy with advanced features
class DarkProxy {
    constructor() {
        this.init();
    }

    init() {
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.accentColor = localStorage.getItem('accentColor') || '#58a6ff';
        this.browseHistory = JSON.parse(localStorage.getItem('browseHistory')) || [];
        this.initTheme();
        this.initEventListeners();
        this.loadRecentHistory();
        this.registerServiceWorker();
        this.applyAccentColor();
    }

    initTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        if (this.currentTheme === 'auto') {
            this.handleSystemThemeChange();
        }

        // Update theme select
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = this.currentTheme;
        }
    }

    handleSystemThemeChange() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = (e) => {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        handleChange(mediaQuery);
    }

    initEventListeners() {
        // Proxy form
        document.getElementById('proxyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUrlSubmit();
        });

        // Quick access cards
        document.querySelectorAll('.quick-card').forEach(card => {
            card.addEventListener('click', () => {
                const url = card.getAttribute('data-url');
                this.navigateToProxy(url);
            });
        });

        // URL suggestions
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const url = btn.getAttribute('data-url');
                document.getElementById('urlInput').value = url;
                this.handleUrlSubmit();
            });
        });

        // Modal handlers
        document.getElementById('historyBtn').addEventListener('click', () => {
            this.showHistoryModal();
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        document.getElementById('clearHistory').addEventListener('click', () => {
            this.clearHistory();
        });

        // Modal close handlers
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Settings handlers
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                this.changeAccentColor(option.getAttribute('data-color'));
            });
        });

        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'k':
                        e.preventDefault();
                        document.getElementById('urlInput').focus();
                        break;
                    case 'h':
                        e.preventDefault();
                        this.showHistoryModal();
                        break;
                    case ',':
                        e.preventDefault();
                        this.showSettingsModal();
                        break;
                }
            }

            if (e.key === 'Escape') {
                this.closeModals();
            }
        });

        // Focus URL input on page load
        document.getElementById('urlInput').focus();
    }

    handleUrlSubmit() {
        const urlInput = document.getElementById('urlInput');
        let url = urlInput.value.trim();

        if (!url) return;

        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        // Validate URL
        try {
            new URL(url);
            this.navigateToProxy(url);
        } catch (err) {
            this.showNotification('Please enter a valid URL', 'error');
            urlInput.focus();
        }
    }

    navigateToProxy(url) {
        // Add to history
        this.addToHistory(url);
        
        // Show loading state
        this.showLoading();
        
        // Navigate to proxy page
        setTimeout(() => {
            window.location.href = `proxy.html?url=${encodeURIComponent(url)}`;
        }, 500);
    }

    addToHistory(url) {
        const historyItem = {
            url: url,
            title: this.extractDomain(url),
            timestamp: Date.now(),
            visits: 1
        };

        // Check if URL already exists in history
        const existingIndex = this.browseHistory.findIndex(item => item.url === url);
        
        if (existingIndex !== -1) {
            // Update existing entry
            this.browseHistory[existingIndex].visits++;
            this.browseHistory[existingIndex].timestamp = Date.now();
        } else {
            // Add new entry (limit to 50 items)
            this.browseHistory.unshift(historyItem);
            if (this.browseHistory.length > 50) {
                this.browseHistory.pop();
            }
        }

        this.saveHistory();
        this.loadRecentHistory();
    }

    extractDomain(url) {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch {
            return url;
        }
    }

    loadRecentHistory() {
        const historyContainer = document.getElementById('recentHistory');
        if (!historyContainer) return;

        const recent = this.browseHistory.slice(0, 5);
        
        if (recent.length === 0) {
            historyContainer.innerHTML = '<div class="history-empty">No recent history</div>';
            return;
        }

        historyContainer.innerHTML = recent.map(item => `
            <div class="history-item" data-url="${item.url}">
                <div class="history-info">
                    <div class="history-title">${item.title}</div>
                    <div class="history-url">${item.url}</div>
                </div>
                <div class="history-actions">
                    <button class="history-visit" title="Visit">🔍</button>
                </div>
            </div>
        `).join('');

        // Add event listeners to history items
        historyContainer.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('history-visit')) {
                    const url = item.getAttribute('data-url');
                    this.navigateToProxy(url);
                }
            });
        });

        historyContainer.querySelectorAll('.history-visit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.closest('.history-item').getAttribute('data-url');
                this.navigateToProxy(url);
            });
        });
    }

    showHistoryModal() {
        const modal = document.getElementById('historyModal');
        const historyList = document.getElementById('historyList');
        
        if (this.browseHistory.length === 0) {
            historyList.innerHTML = '<div class="history-empty">No browsing history</div>';
        } else {
            historyList.innerHTML = this.browseHistory.map(item => `
                <div class="history-modal-item" data-url="${item.url}">
                    <div class="history-modal-info">
                        <div class="history-modal-title">${item.title}</div>
                        <div class="history-modal-url">${item.url}</div>
                        <div class="history-modal-meta">
                            Visited ${item.visits} time${item.visits > 1 ? 's' : ''}
                        </div>
                    </div>
                    <div class="history-modal-actions">
                        <button class="history-modal-visit" title="Visit">🔍</button>
                        <button class="history-modal-delete" title="Delete">🗑️</button>
                    </div>
                </div>
            `).join('');

            // Add event listeners
            historyList.querySelectorAll('.history-modal-visit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const url = btn.closest('.history-modal-item').getAttribute('data-url');
                    this.navigateToProxy(url);
                });
            });

            historyList.querySelectorAll('.history-modal-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const url = btn.closest('.history-modal-item').getAttribute('data-url');
                    this.removeFromHistory(url);
                    this.showHistoryModal(); // Refresh
                });
            });
        }

        modal.style.display = 'block';
    }

    showSettingsModal() {
        document.getElementById('settingsModal').style.display = 'block';
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    changeTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        
        if (theme === 'auto') {
            this.handleSystemThemeChange();
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        
        this.showNotification('Theme updated');
    }

    changeAccentColor(color) {
        this.accentColor = color;
        localStorage.setItem('accentColor', color);
        this.applyAccentColor();
        
        // Update active state
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.toggle('active', option.getAttribute('data-color') === color);
        });
        
        this.showNotification('Accent color updated');
    }

    applyAccentColor() {
        document.documentElement.style.setProperty('--accent-color', this.accentColor);
        document.documentElement.style.setProperty('--accent-hover', this.adjustColor(this.accentColor, -20));
        
        // Set active color in picker
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.toggle('active', option.getAttribute('data-color') === this.accentColor);
        });
    }

    adjustColor(color, amount) {
        return '#' + color.replace(/^#/, '').replace(/../g, color => 
            ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
        );
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all browsing history?')) {
            this.browseHistory = [];
            this.saveHistory();
            this.loadRecentHistory();
            this.showNotification('History cleared');
        }
    }

    removeFromHistory(url) {
        this.browseHistory = this.browseHistory.filter(item => item.url !== url);
        this.saveHistory();
        this.loadRecentHistory();
    }

    saveHistory() {
        localStorage.setItem('browseHistory', JSON.stringify(this.browseHistory));
    }

    showLoading() {
        const btn = document.querySelector('.submit-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="loading-spinner"></span>';
        btn.disabled = true;
        
        // Revert after navigation or timeout
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 2000);
    }

    showNotification(message, type = 'success') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }
}

// Enhanced Proxy Page Handler
class ProxyPage {
    constructor() {
        this.init();
    }

    init() {
        this.currentUrl = this.getUrlParam('url');
        this.initProxy();
        this.initEventListeners();
    }

    getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    initProxy() {
        if (this.currentUrl) {
            document.getElementById('currentUrl').textContent = this.currentUrl;
            this.loadProxyFrame();
        } else {
            this.showError('No URL specified');
        }
    }

    loadProxyFrame() {
        const frame = document.getElementById('proxyFrame');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');

        // Use multiple proxy services as fallback
        const proxyServices = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(this.currentUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(this.currentUrl)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(this.currentUrl)}`
        ];

        let currentService = 0;

        const tryNextService = () => {
            if (currentService >= proxyServices.length) {
                loading.style.display = 'none';
                error.style.display = 'block';
                error.innerHTML = `
                    <h3>Unable to load page</h3>
                    <p>All proxy services failed. The site might be blocking proxy access.</p>
                    <button onclick="window.location.href='index.html'" class="back-button">Go Back</button>
                `;
                return;
            }

            frame.src = proxyServices[currentService];
            currentService++;
        };

        frame.onload = () => {
            loading.style.display = 'none';
            frame.style.display = 'block';
        };

        frame.onerror = tryNextService;

        // Start with first service
        tryNextService();
    }

    initEventListeners() {
        document.getElementById('goHome').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        document.getElementById('newTab').addEventListener('click', () => {
            window.open(this.currentUrl, '_blank');
        });

        // Keyboard shortcuts for proxy page
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.location.href = 'index.html';
            }
        });
    }

    showError(message) {
        const error = document.getElementById('error');
        error.style.display = 'block';
        error.innerHTML = message;
    }
}

// Initialize based on current page
if (window.location.pathname.includes('proxy.html')) {
    new ProxyPage();
} else {
    new DarkProxy();
}

// Utility functions
window.copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        // Show success feedback
        const proxy = new DarkProxy();
        proxy.showNotification('URL copied to clipboard');
    } catch (err) {
        console.error('Failed to copy:', err);
    }
};
