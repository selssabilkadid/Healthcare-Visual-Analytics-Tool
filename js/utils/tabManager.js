class TabManager {
  constructor() {
    this.currentTab = null;          // current active tab
    this.tabs = new Map();           // tabId → renderFunction
    this.tabButtons = new Map();     // tabId → button element
    this.isRendering = false;        // render lock
  }

  // Register a tab with its render function
  registerTab(tabId, renderFunction) {
    this.tabs.set(tabId, renderFunction);
  }

  // Initialize tabs & attach click handlers
  init(initialTab = 'home') {
    const tabButtons = document.querySelectorAll('[data-tab]');
    
    tabButtons.forEach(button => {
      const tabId = button.getAttribute('data-tab');
      this.tabButtons.set(tabId, button);

      button.addEventListener('click', (e) => {
        e.preventDefault();
        if (tabId !== this.currentTab) this.switchTab(tabId);
      });
    });

    // Show initial tab
    this.switchTab(initialTab);
  }

  // Switch tab
  switchTab(tabId) {
    if (tabId === this.currentTab) return;
    if (!this.tabs.has(tabId)) return;

    this._updateVisibility(tabId);
    this._render(tabId);

    this.currentTab = tabId;
  }


  _updateVisibility(tabId) {
    // Update buttons
    this.tabButtons.forEach((button, id) => {
      button.classList.toggle('active', id === tabId);
    });

    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
      content.classList.remove('active');
    });

    // Show current tab content
    const tabContent = document.getElementById(`${tabId}-content`);
    if (tabContent) {
      tabContent.style.display = 'block';
      tabContent.classList.add('active');
    }
  }

  // Render tab content with lock
  _render(tabId) {
    if (this.isRendering) return; 
    this.isRendering = true;

    requestAnimationFrame(() => {
      const renderFunction = this.tabs.get(tabId);
      if (renderFunction) renderFunction();
      this.isRendering = false;
    });
  }

 
  renderCurrentTab() {
    if (!this.currentTab) return;
    this._render(this.currentTab);
  }

  getCurrentTab() {
    return this.currentTab;
  }
}

// Export singleton
const tabManager = new TabManager();
export default tabManager;
