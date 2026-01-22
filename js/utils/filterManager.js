class FilterManager {
  constructor() {
    this.activeFilters = {};
    this.originalData = null;
    this.filteredData = null;
    this.onFilterChange = null;
    this.isFiltering = false;
  }

  init(data, onFilterChangeCallback) {
    this.originalData = data;
    this.filteredData = data;
    this.onFilterChange = onFilterChangeCallback;
    
    this.populateFilterOptions(data);
    this.setupEventListeners();
    console.log('FilterManager initialized with', data.length, 'records');
  }

  populateFilterOptions(data) {
    const countries = [...new Set(data.map(d => d.Country).filter(Boolean))].sort();
    const countrySelect = document.getElementById('filter-country');
    if (countrySelect) {
      countrySelect.innerHTML = '<option value="">All Countries</option>';
      countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countrySelect.appendChild(option);
      });
    }

    const cities = [...new Set(data.map(d => d.City).filter(Boolean))].sort();
    const citySelect = document.getElementById('filter-city');
    if (citySelect) {
      citySelect.innerHTML = '<option value="">All Cities</option>';
      cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
    }

    // Add Hospital filter options
    const hospitals = [...new Set(data.map(d => d.Hospital).filter(Boolean))].sort();
    const hospitalSelect = document.getElementById('filter-hospital');
    if (hospitalSelect) {
      hospitalSelect.innerHTML = '<option value="">All Hospitals</option>';
      hospitals.forEach(hospital => {
        const option = document.createElement('option');
        option.value = hospital;
        option.textContent = hospital;
        hospitalSelect.appendChild(option);
      });
    }
  }

  setupEventListeners() {
    const applyBtn = document.getElementById('apply-filters');
    const resetBtn = document.getElementById('reset-filters');
    
    const newApply = applyBtn?.cloneNode(true);
    const newReset = resetBtn?.cloneNode(true);

    if (applyBtn && newApply) {
      applyBtn.parentNode.replaceChild(newApply, applyBtn);
      newApply.addEventListener('click', () => this.applyFilters());
    }
    
    if (resetBtn && newReset) {
      resetBtn.parentNode.replaceChild(newReset, resetBtn);
      newReset.addEventListener('click', () => this.resetFilters());
    }

    const selects = document.querySelectorAll('.filter-select');
    selects.forEach(select => {
      select.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.applyFilters();
      });
    });
  }

  applyFilters() {
    if (this.isFiltering) return;
    this.isFiltering = true;

    const applyBtn = document.getElementById('apply-filters');
    const originalText = applyBtn ? applyBtn.innerHTML : 'Apply';
    
    if (applyBtn) {
      applyBtn.innerHTML = 'Filtering...';
      applyBtn.style.opacity = '0.7';
      applyBtn.style.cursor = 'wait';
    }

    setTimeout(() => {
      try {
        this.activeFilters = {};
        const year = document.getElementById('filter-year')?.value;
        const month = document.getElementById('filter-month')?.value;
        const country = document.getElementById('filter-country')?.value;
        const city = document.getElementById('filter-city')?.value;
        const hospital = document.getElementById('filter-hospital')?.value;
        
        if (year) this.activeFilters.year = year;
        if (month) this.activeFilters.month = month;
        if (country) this.activeFilters.country = country;
        if (city) this.activeFilters.city = city;
        if (hospital) this.activeFilters.hospital = hospital;
        
        this.filteredData = this.filterData(this.originalData, this.activeFilters);
        
        console.log('Filtered data:', this.filteredData.length);
        
        if (this.onFilterChange) {
          this.onFilterChange(this.filteredData);
        }
        
        this.showFilterMessage(`Showing ${this.filteredData.length.toLocaleString()} records`);

      } catch (err) {
        console.error("Filtering error:", err);
      } finally {
        if (applyBtn) {
          applyBtn.innerHTML = originalText;
          applyBtn.style.opacity = '1';
          applyBtn.style.cursor = 'pointer';
        }
        this.isFiltering = false;
      }
    }, 50);
  }

  filterData(data, filters) {
    if (Object.keys(filters).length === 0) return data;

    return data.filter(record => {
      if (filters.year) {
        const recordYear = new Date(record['Date of Admission']).getFullYear();
        if (recordYear.toString() !== filters.year) return false;
      }
      if (filters.month) {
        const recordMonth = new Date(record['Date of Admission']).getMonth() + 1;
        if (recordMonth.toString() !== filters.month) return false;
      }
      if (filters.country && record.Country !== filters.country) return false;
      if (filters.city && record.City !== filters.city) return false;
      if (filters.hospital && record.Hospital !== filters.hospital) return false;
      
      return true;
    });
  }

  // NEW METHOD: Programmatically set a filter from external components
  setHospitalFilter(hospitalName) {
    const hospitalSelect = document.getElementById('filter-hospital');
    if (hospitalSelect) {
      hospitalSelect.value = hospitalName;
    }
    
    this.activeFilters.hospital = hospitalName;
    this.filteredData = this.filterData(this.originalData, this.activeFilters);
    
    if (this.onFilterChange) {
      this.onFilterChange(this.filteredData);
    }
    
    this.showFilterMessage(`Filtered by hospital: ${hospitalName}`);
  }

  resetFilters() {
    ['filter-year', 'filter-month', 'filter-country', 'filter-city', 'filter-hospital'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    
    this.activeFilters = {};
    this.filteredData = this.originalData;
    
    if (this.onFilterChange) {
      this.onFilterChange(this.filteredData);
    }
    
    this.showFilterMessage('Filters reset');
  }

  showFilterMessage(message) {
    const existingMsg = document.querySelector('.filter-toast');
    if (existingMsg) existingMsg.remove();
    
    const msg = document.createElement('div');
    msg.className = 'filter-toast';
    msg.textContent = message;
    document.body.appendChild(msg);
    
    setTimeout(() => {
      msg.style.opacity = '0';
      msg.style.transform = 'translateY(10px)';
      setTimeout(() => msg.remove(), 300);
    }, 3000);
  }

  getFilteredData() {
    return this.filteredData || this.originalData;
  }

  getFilterStats() {
    return {
      total: this.originalData ? this.originalData.length : 0,
      filtered: this.filteredData ? this.filteredData.length : 0,
      activeFilters: Object.keys(this.activeFilters).length
    };
  }
}

const filterManager = new FilterManager();
export default filterManager;