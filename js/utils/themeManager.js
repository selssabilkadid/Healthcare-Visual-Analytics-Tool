class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.STORAGE_KEY = 'healthcare-dashboard-theme';
  }

  /**
   * Initialize theme manager
   */
  init() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }

    // Setup toggle button
    this.setupToggleButton();

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });

    console.log('Theme Manager initialized');
  }

  /**
   * Setup toggle button event listener
   */
  setupToggleButton() {
    const toggleBtn = document.getElementById('theme-toggle');
    
    if (!toggleBtn) {
      console.warn('Theme toggle button not found');
      return;
    }

    toggleBtn.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Keyboard accessibility
    toggleBtn.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    
    // Show subtle notification
    this.showThemeNotification(newTheme);
  }

  /**
   * Set theme (light or dark)
   */
  setTheme(theme) {
    this.currentTheme = theme;
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Save preference
    localStorage.setItem(this.STORAGE_KEY, theme);
    
    // Update toggle button state
    this.updateToggleButton(theme);
    
    // Update map theme if map is loaded
    if (typeof window.updateMapTheme === 'function') {
      window.updateMapTheme();
    }
    
    console.log(`Theme changed to: ${theme}`);
  }

  /**
   * Update toggle button appearance
   */
  updateToggleButton(theme) {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    const sunIcon = toggleBtn.querySelector('.sun-icon');
    const moonIcon = toggleBtn.querySelector('.moon-icon');

    if (theme === 'dark') {
      toggleBtn.setAttribute('title', 'Switch to Light Mode');
    } else {
      toggleBtn.setAttribute('title', 'Switch to Dark Mode');
    }
  }

  /**
   * Show theme change notification
   */
  showThemeNotification(theme) {
    const existingToast = document.querySelector('.theme-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'theme-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: ${theme === 'dark' ? '#2D3748' : '#FFFFFF'};
      color: ${theme === 'dark' ? '#F7FAFC' : '#1A202C'};
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      border: 1px solid ${theme === 'dark' ? '#4A5568' : '#E2E8F0'};
      display: flex;
      align-items: center;
      gap: 8px;
      animation: slideInUp 0.3s ease;
    `;

    const icon = theme === 'dark' ? '🌙' : '☀️';
    const text = theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled';
    
    toast.innerHTML = `<span style="font-size: 1.2rem;">${icon}</span> ${text}`;
    
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutDown 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Check if dark mode is active
   */
  isDarkMode() {
    return this.currentTheme === 'dark';
  }
}

// Export singleton instance
const themeManager = new ThemeManager();
export default themeManager;

if (!document.getElementById('theme-animations')) {
  const style = document.createElement('style');
  style.id = 'theme-animations';
  style.textContent = `
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes slideOutDown {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(20px);
      }
    }
  `;
  document.head.appendChild(style);
}