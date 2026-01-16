class TabManager {
  constructor() {
    this.currentTab = 'home';
    this.tabs = new Map();
    this.tabButtons = new Map();
  }

  registerTab(tabId, renderFunction) {
    this.tabs.set(tabId, renderFunction);
  }

  init() {
    const tabButtons = document.querySelectorAll('[data-tab]');
    
    tabButtons.forEach(button => {
      const tabId = button.getAttribute('data-tab');
      this.tabButtons.set(tabId, button);
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        if (tabId !== this.currentTab) {
          this.switchTab(tabId);
        }
      });
    });

    this.switchTab(this.currentTab);
  }

  switchTab(tabId) {
    if (tabId === this.currentTab) return; // 🔴 CRITICAL GUARD
    if (!this.tabs.has(tabId)) return;

    this._updateVisibility(tabId);
    this._render(tabId);
    this.currentTab = tabId;
  }

  _updateVisibility(tabId) {
    this.tabButtons.forEach((button, id) => {
      button.classList.toggle('active', id === tabId);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
      content.classList.remove('active');
    });

    const tabContent = document.getElementById(`${tabId}-content`);
    if (tabContent) {
      tabContent.style.display = 'block';
      tabContent.classList.add('active');
    }
  }

  _render(tabId) {
    const renderFunction = this.tabs.get(tabId);
    if (renderFunction) renderFunction();
  }

  // ✅ SAFE for resize
  renderCurrentTab() {
    this._render(this.currentTab);
  }

  getCurrentTab() {
    return this.currentTab;
  }
}
// At the very bottom of tabManager.js
const tabManager = new TabManager();
export default tabManager;