// js/filterManager.js - Handle data filtering

class FilterManager {
  constructor() {
    this.activeFilters = {};
    this.originalData = null;
    this.filteredData = null;
    this.onFilterChange = null; // Callback when filters change
  }

  /**
   * Initialize filter manager with data
   */
  init(data, onFilterChangeCallback) {
    this.originalData = data;
    this.filteredData = data;
    this.onFilterChange = onFilterChangeCallback;
    
    this.populateFilterOptions(data);
    this.setupEventListeners();
    console.log('FilterManager initialized with', data.length, 'records');
  }

  /**
   * Populate filter dropdowns with unique values from data
   */
  populateFilterOptions(data) {
    // Get unique countries
    const countries = [...new Set(data.map(d => d.Country).filter(Boolean))].sort();
    const countrySelect = document.getElementById('filter-country');
    if (countrySelect) {
      countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countrySelect.appendChild(option);
      });
      console.log('✅ Populated', countries.length, 'countries');
    }

    // Get unique cities
    const cities = [...new Set(data.map(d => d.City).filter(Boolean))].sort();
    const citySelect = document.getElementById('filter-city');
    if (citySelect) {
      cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
      console.log('✅ Populated', cities.length, 'cities');
    }
  }

  /**
   * Setup event listeners for filter controls
   */
  setupEventListeners() {
    const applyBtn = document.getElementById('apply-filters');
    const resetBtn = document.getElementById('reset-filters');
    
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyFilters());
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetFilters());
    }

    // Apply filters on Enter key in selects
    const selects = document.querySelectorAll('.filter-select');
    selects.forEach(select => {
      select.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.applyFilters();
      });
    });
  }

  /**
   * Apply all active filters
   */
  applyFilters() {
    console.log('Applying filters...');
    
    // Collect filter values
    this.activeFilters = {};
    
    const year = document.getElementById('filter-year')?.value;
    const month = document.getElementById('filter-month')?.value;
    const country = document.getElementById('filter-country')?.value;
    const city = document.getElementById('filter-city')?.value;
    
    if (year) this.activeFilters.year = year;
    if (month) this.activeFilters.month = month;
    if (country) this.activeFilters.country = country;
    if (city) this.activeFilters.city = city;
    
    // Filter data
    this.filteredData = this.filterData(this.originalData, this.activeFilters);
    
    console.log('Filtered data:', this.filteredData.length, 'records');
    
    // Update UI
    this.updateFilterTags();
    
    // Trigger callback to update visualizations
    if (this.onFilterChange) {
      this.onFilterChange(this.filteredData);
    }
    
    // Show success message
    this.showFilterMessage(`Showing ${this.filteredData.length.toLocaleString()} of ${this.originalData.length.toLocaleString()} records`);
  }

  /**
   * Filter data based on active filters
   */
  filterData(data, filters) {
    return data.filter(record => {
      // Year filter
      if (filters.year) {
        const recordYear = new Date(record['Date of Admission']).getFullYear();
        if (recordYear.toString() !== filters.year) return false;
      }
      
      // Month filter
      if (filters.month) {
        const recordMonth = new Date(record['Date of Admission']).getMonth() + 1;
        if (recordMonth.toString() !== filters.month) return false;
      }
      
      // Country filter
      if (filters.country) {
        if (record.Country !== filters.country) return false;
      }
      
      // City filter
      if (filters.city) {
        if (record.City !== filters.city) return false;
      }
      
      return true;
    });
  }

  /**
   * Reset all filters
   */
  resetFilters() {
    console.log('Resetting filters...');
    
    // Clear all select values
    document.getElementById('filter-year').value = '';
    document.getElementById('filter-month').value = '';
    document.getElementById('filter-country').value = '';
    document.getElementById('filter-city').value = '';
    
    // Clear active filters
    this.activeFilters = {};
    this.filteredData = this.originalData;
    
    // Update UI
    this.updateFilterTags();
    
    // Trigger callback
    if (this.onFilterChange) {
      this.onFilterChange(this.filteredData);
    }
    
    this.showFilterMessage('Filters reset - showing all records');
  }

  /**
   * Update filter tags display
   */
  updateFilterTags() {
    const activeFiltersDiv = document.getElementById('active-filters');
    const filterTagsDiv = document.getElementById('filter-tags');
    
    if (!activeFiltersDiv || !filterTagsDiv) return;
    
    // Clear existing tags
    filterTagsDiv.innerHTML = '';
    
    // Check if there are active filters
    const hasFilters = Object.keys(this.activeFilters).length > 0;
    
    if (!hasFilters) {
      activeFiltersDiv.style.display = 'none';
      return;
    }
    
    activeFiltersDiv.style.display = 'flex';
    
    // Create tags for each active filter
    const filterLabels = {
      year: 'Year',
      month: 'Month',
      country: 'Country',
      city: 'City'
    };
    
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (const [key, value] of Object.entries(this.activeFilters)) {
      const tag = document.createElement('div');
      tag.className = 'filter-tag';
      
      let displayValue = value;
      if (key === 'month') {
        displayValue = monthNames[parseInt(value)];
      }
      
      tag.innerHTML = `
        ${filterLabels[key]}: ${displayValue}
        <button data-filter="${key}" title="Remove filter">×</button>
      `;
      
      // Add remove handler
      tag.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeFilter(key);
      });
      
      filterTagsDiv.appendChild(tag);
    }
  }

  /**
   * Remove a specific filter
   */
  removeFilter(filterKey) {
    console.log('Removing filter:', filterKey);
    
    // Clear the select value
    const selectMap = {
      year: 'filter-year',
      month: 'filter-month',
      country: 'filter-country',
      city: 'filter-city'
    };
    
    const selectId = selectMap[filterKey];
    if (selectId) {
      document.getElementById(selectId).value = '';
    }
    
    // Remove from active filters
    delete this.activeFilters[filterKey];
    
    // Re-apply remaining filters
    this.applyFilters();
  }

  /**
   * Show filter success message
   */
  showFilterMessage(message) {
    const existingMsg = document.querySelector('.filter-success-msg');
    if (existingMsg) existingMsg.remove();
    
    const msg = document.createElement('div');
    msg.className = 'filter-success-msg';
    msg.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #48BB78;
      color: white;
      padding: 0.875rem 1.25rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 0.875rem;
      font-weight: 500;
      z-index: 9999;
      animation: slideInUp 0.3s ease;
    `;
    msg.textContent = message;
    
    document.body.appendChild(msg);
    
    setTimeout(() => {
      msg.style.animation = 'slideOutDown 0.3s ease';
      setTimeout(() => msg.remove(), 300);
    }, 3000);
  }

  /**
   * Get current filtered data
   */
  getFilteredData() {
    return this.filteredData || this.originalData;
  }

  /**
   * Get filter statistics
   */
  getFilterStats() {
    return {
      total: this.originalData.length,
      filtered: this.filteredData.length,
      activeFilters: Object.keys(this.activeFilters).length,
      filters: this.activeFilters
    };
  }
}

// Export singleton instance
const filterManager = new FilterManager();
export default filterManager;

// Add CSS animations
if (!document.getElementById('filter-animations')) {
  const style = document.createElement('style');
  style.id = 'filter-animations';
  style.textContent = `
    @keyframes slideInUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    @keyframes slideOutDown {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}