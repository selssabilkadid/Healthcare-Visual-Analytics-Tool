
//  les couleurs
const FINANCIAL_COLORS = {
  insurance: {
    'Aetna': '#667EEA',
    'Blue Cross': '#4ECDC4',
    'Cigna': '#9B7EBD',
    'Medicare': '#FFA500',
    'UnitedHealth': '#FF6B6B'
  },
  years: {
    '2020': '#FF6B6B',  // Rouge
    '2021': '#4ECDC4',  // Turquoise
    '2022': '#9B7EBD',  // Violet
    '2023': '#FFA500',  // Orange
    '2024': '#667EEA',  // Bleu
    '2025': '#E89B9B'   // Rose
  }
};

// Cache for financial data aggregations
let cachedFinancialData = null;

export function renderFinancialTab(data) {
  console.time('Financial Tab Render');
  
  const container = d3.select('#financial-content');
  container.html('');

  // Pre-aggregate data
  if (!cachedFinancialData) {
    console.time('Financial Data Aggregation');
    cachedFinancialData = aggregateFinancialData(data);
    console.timeEnd('Financial Data Aggregation');
  }

  const agg = cachedFinancialData;

  // Create layout
  const layout = container.append('div').attr('class', 'financial-layout');

  // Add filter controls
  //renderFilterControls(layout, data);

  // Render KPIs
  renderKPICards(layout, agg);

  // Create charts grid
  const chartsGrid = layout.append('div').attr('class', 'charts-grid-2col');
  const leftCol = chartsGrid.append('div').attr('class', 'chart-column');
  const rightCol = chartsGrid.append('div').attr('class', 'chart-column');

  // Render charts with animation
  requestAnimationFrame(() => {
    renderCostDistribution(leftCol, agg);
    renderInsuranceCostAnalysis(rightCol, agg);
  });

  requestAnimationFrame(() => {
    renderTemporalTrend(leftCol, agg);
    renderAnnualBillingTrend(rightCol, agg);
  });

  // Full width charts
  const fullWidthRow = layout.append('div').attr('class', 'full-width-row');
  requestAnimationFrame(() => {
    renderAnnualByCountry(fullWidthRow, agg);
  });

  console.timeEnd('Financial Tab Render');
}

// Filter controls
function renderFilterControls(container, data) {
  const filterSection = container.append('div').attr('class', 'filter-section');
  filterSection.append('h3').text('Filters');
  
  const filters = filterSection.append('div').attr('class', 'filter-controls');

  // Year filter
  const years = [...new Set(data.map(d => new Date(d['Date of Admission']).getFullYear()))].sort();
  const yearFilter = filters.append('div').attr('class', 'filter-group');
  yearFilter.append('label').text('Year: ');
  yearFilter.append('select')
    .attr('class', 'filter-select')
    .attr('id', 'year-filter')
    .selectAll('option')
    .data(['All', ...years])
    .enter()
    .append('option')
    .attr('value', d => d)
    .text(d => d);

  // Insurance filter
  const insurers = [...new Set(data.map(d => d['Insurance Provider']))].sort();
  const insFilter = filters.append('div').attr('class', 'filter-group');
  insFilter.append('label').text('Insurance: ');
  insFilter.append('select')
    .attr('class', 'filter-select')
    .attr('id', 'insurance-filter')
    .selectAll('option')
    .data(['All', ...insurers])
    .enter()
    .append('option')
    .attr('value', d => d)
    .text(d => d);

  // Bill type filter
  const billFilter = filters.append('div').attr('class', 'filter-group');
  billFilter.append('label').text('Bill Type: ');
  billFilter.append('select')
    .attr('class', 'filter-select')
    .attr('id', 'billtype-filter')
    .selectAll('option')
    .data(['All', 'Normal', 'Refund'])
    .enter()
    .append('option')
    .attr('value', d => d)
    .text(d => d);

  // Add event listeners for filters
  d3.selectAll('.filter-select').on('change', function() {
    applyFilters(data);
  });
}

function applyFilters(data) {
  const yearFilter = d3.select('#year-filter').property('value');
  const insFilter = d3.select('#insurance-filter').property('value');
  const billFilter = d3.select('#billtype-filter').property('value');

  let filteredData = data;

  // Apply year filter
  if (yearFilter !== 'All') {
    filteredData = filteredData.filter(d => 
      new Date(d['Date of Admission']).getFullYear() === parseInt(yearFilter)
    );
  }

  // Apply insurance filter
  if (insFilter !== 'All') {
    filteredData = filteredData.filter(d => d['Insurance Provider'] === insFilter);
  }

  // Apply bill type filter
  if (billFilter !== 'All') {
    filteredData = filteredData.filter(d => d['Type of Bill'] === billFilter);
  }

  // Clear cache and re-render
  cachedFinancialData = null;
  renderFinancialTab(filteredData);
}

// Data aggregation
function aggregateFinancialData(data) {
  const total = data.length;
  const uniquePatients = new Set(data.map(d => d.Name)).size;
  
  // Calculate total revenue (only normal bills)
  const normalBills = data.filter(d => d['Type of Bill'] === 'Normal');
  const refundBills = data.filter(d => d['Type of Bill'] === 'Refund');
  
  const totalRevenue = d3.sum(normalBills, d => d['Billing Amount']);
  const totalRefunds = d3.sum(refundBills, d => d['Billing Amount']);
  const avgLengthOfStay = d3.mean(data, d => d['Length of Stay'] || 0);
  const avgCost = d3.mean(data, d => d['Billing Amount']);
  
  // Cost distribution bins
  const costBins = [0, 1000, 5000, 10000, 20000, 50000, 100000];
  const costDistribution = costBins.slice(0, -1).map((bin, i) => {
    const nextBin = costBins[i + 1];
    const count = data.filter(d => {
      const amount = d['Billing Amount'];
      return amount >= bin && amount < nextBin;
    }).length;
    return {
      range: `${bin.toLocaleString()} - ${nextBin.toLocaleString()}`,
      count,
      percentage: ((count / total) * 100).toFixed(1)
    };
  });

  // Insurance provider analysis
  const insuranceGroups = d3.group(data, d => d['Insurance Provider']);
  const insuranceAnalysis = Array.from(insuranceGroups, ([provider, records]) => {
    const avgAmount = d3.mean(records, d => d['Billing Amount']);
    const totalAmount = d3.sum(records, d => d['Billing Amount']);
    const patientCount = records.length;
    const refundCount = records.filter(d => d['Type of Bill'] === 'Refund').length;
    
    return {
      provider,
      avgAmount,
      totalAmount,
      patientCount,
      refundCount,
      refundPercentage: ((refundCount / patientCount) * 100).toFixed(1)
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  // Monthly trend
  const monthlyData = d3.rollup(
    data,
    v => ({
      total: d3.sum(v, d => d['Billing Amount']),
      count: v.length,
      avg: d3.mean(v, d => d['Billing Amount'])
    }),
    d => {
      const date = new Date(d['Date of Admission']);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  );

  
  // Annual trend (multi-year)
  const annualTrend = {};
  data.forEach(d => {
    const date = new Date(d['Date of Admission']);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    if (!annualTrend[year]) annualTrend[year] = Array(12).fill(0);
    annualTrend[year][month - 1] += d['Billing Amount'];
  });

  // Annual by country
  const countryData = d3.rollup(
    data,
    v => d3.sum(v, d => d['Billing Amount']),
    d => d.Country,
    d => new Date(d['Date of Admission']).getFullYear()
  );

  const annualByCountry = {};
  Array.from(countryData).forEach(([country, yearData]) => {
    Array.from(yearData).forEach(([year, amount]) => {
      if (!annualByCountry[year]) annualByCountry[year] = [];
      annualByCountry[year].push({
        country,
        amount
      });
    });
  });

  // Monthly trend avec format d'affichage
  const monthlyTrend = Array.from(monthlyData, ([month, stats]) => {
    const [year, monthNum] = month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      month,
      monthDisplay: `${monthNames[parseInt(monthNum) - 1]} '${year.slice(2)}`,
      ...stats
    };
  }).sort((a, b) => a.month.localeCompare(b.month));

  return {
    kpis: {
      totalRevenue,
      totalRefunds,
      totalPatients: total,
      distinctPatients: uniquePatients,
      avgLengthOfStay,
      avgCost,
      normalBillCount: normalBills.length,
      refundBillCount: refundBills.length
    },
    costDistribution,
    insuranceAnalysis,
    monthlyTrend,
    annualTrend,
    annualByCountry
  };
}

// KPI Cards
function renderKPICards(container, agg) {
  const kpi = agg.kpis;
  
  const kpis = [
    {
      title: 'Total Revenue',
      value: `$${kpi.totalRevenue.toLocaleString()}`,
      subtitle: '',
      icon: '💰',
      color: '#667EEA',
      change: ''
    },
    {
      title: 'Total Refunds',
      value: `$${kpi.totalRefunds.toLocaleString()}`,
      subtitle: 'Insurance Reimbursements',
      icon: '🔄',
      color: '#FF6B6B'
      
    },
    {
      title: 'Total Patients',
      value: kpi.totalPatients.toLocaleString(),
      subtitle: `${kpi.distinctPatients.toLocaleString()} unique`,
      icon: '👥',
      color: '#4ECDC4',
      change: ''
    },
    {
      title: 'Avg Length of Stay',
      value: kpi.avgLengthOfStay.toFixed(1),
      subtitle: 'Days',
      icon: '🏥',
      color: '#9B7EBD',
      change: ''
    },
    {
      title: 'Avg Cost per Visit',
      value: `$${kpi.avgCost.toFixed(2)}`,
      subtitle: 'Per patient visit',
      icon: '💳',
      color: '#FFA500',
      change: ''
    },
    {
      title: 'Bill Types',
      value: `${kpi.normalBillCount.toLocaleString()} / ${kpi.refundBillCount.toLocaleString()}`,
      subtitle: 'Normal / Refund',
      icon: '📊',
      color: '#E89AC7',
      change: ''
    }
  ];

  const cardContainer = container.append('div').attr('class', 'summary-cards-row');
  const cardDivs = cardContainer.selectAll('.metric-card')
    .data(kpis).enter().append('div').attr('class', 'metric-card');

  cardDivs.append('div').attr('class', 'metric-icon')
    .style('background', d => `${d.color}15`).text(d => d.icon);

  const cardContent = cardDivs.append('div').attr('class', 'metric-content');
  cardContent.append('div').attr('class', 'metric-title').text(d => d.title);
  
  const valueRow = cardContent.append('div').attr('class', 'metric-value-row');
  valueRow.append('div').attr('class', 'metric-value').text(d => d.value);
  valueRow.append('div').attr('class', 'metric-change')
    .text(d => d.change);

  cardContent.append('div').attr('class', 'metric-subtitle').text(d => d.subtitle);
}

// Cost Distribution Chart
function renderCostDistribution(container, agg) {
  const section = container.append('div').attr('class', 'chart-section');
  section.append('h3').text('Cost Distribution');
  section.append('p').attr('class', 'chart-description')
    .text('Distribution of billing amounts across different ranges');
  
  const chartDiv = section.append('div').attr('class', 'chart-container')
    .attr('id', 'cost-distribution-chart');

  const margin = { top: 20, right: 30, bottom: 60, left: 80 };
  const width = 450 - margin.left - margin.right;
  const height = 350 - margin.top - margin.bottom;

  const svg = d3.select('#cost-distribution-chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(agg.costDistribution.map(d => d.range))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(agg.costDistribution, d => d.count)])
    .nice()
    .range([height, 0]);

  // Bars
  svg.selectAll('.cost-bar')
    .data(agg.costDistribution)
    .enter()
    .append('rect')
    .attr('class', 'cost-bar')
    .attr('x', d => x(d.range))
    .attr('y', d => y(d.count))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.count))
    .attr('fill', (d, i) => d3.interpolateBlues(0.3 + (i * 0.15)))
    .attr('rx', 4)
    .on('mouseenter', function(event, d) {
      d3.select(this).transition().duration(200).attr('opacity', 0.8);
      
      // Show tooltip
      const tooltip = section.append('div').attr('class', 'chart-tooltip');
      tooltip.style('opacity', 0)
        .html(`
          <strong>${d.range}</strong><br/>
          Patients: ${d.count.toLocaleString()}<br/>
          Percentage: ${d.percentage}%
        `)
        .transition().duration(300)
        .style('opacity', 1);
    })
    .on('mouseleave', function() {
      d3.select(this).transition().duration(200).attr('opacity', 1);
      section.selectAll('.chart-tooltip').remove();
    })
    .on('mousemove', function(event) {
      section.select('.chart-tooltip')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    });

  // Add value labels
  svg.selectAll('.cost-label')
    .data(agg.costDistribution)
    .enter()
    .append('text')
    .attr('class', 'cost-label')
    .attr('x', d => x(d.range) + x.bandwidth() / 2)
    .attr('y', d => y(d.count) - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '0.75rem')
    .style('font-weight', '600')
    .text(d => d.count.toLocaleString());

  // Axes
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(-45)');

  svg.append('g')
    .call(d3.axisLeft(y).ticks(5));
}

// Insurance Cost Analysis Chart
function renderInsuranceCostAnalysis(container, agg) {
  const section = container.append('div').attr('class', 'chart-section');
  section.append('h3').text('Insurance Provider Performance');
  section.append('p').attr('class', 'chart-description')
    .text('Total billed amounts by insurance provider');
  
  const chartDiv = section.append('div').attr('class', 'chart-container')
    .attr('id', 'insurance-performance-chart');

  const margin = { top: 40, right: 30, bottom: 80, left: 100 };
  const width = 450 - margin.left - margin.right;
  const height = 350 - margin.top - margin.bottom;

  const svg = d3.select('#insurance-performance-chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Sort insurance providers by total amount (descending)
  const sortedInsurance = [...agg.insuranceAnalysis].sort((a, b) => b.totalAmount - a.totalAmount);

  // Create scales
  const x = d3.scaleBand()
    .domain(sortedInsurance.map(d => d.provider))
    .range([0, width])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(sortedInsurance, d => d.totalAmount)])
    .nice()
    .range([height, 0]);

  // Create a color scale based on total amount
  const colorScale = d3.scaleSequential()
    .domain([0, d3.max(sortedInsurance, d => d.totalAmount)])
    .interpolator(d3.interpolateBlues);

  // Add bars
  svg.selectAll('.insurance-bar')
    .data(sortedInsurance)
    .enter()
    .append('rect')
    .attr('class', 'insurance-bar')
    .attr('x', d => x(d.provider))
    .attr('y', d => y(d.totalAmount))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.totalAmount))
    .attr('fill', d => colorScale(d.totalAmount))
    .attr('rx', 4)
    .on('mouseenter', function(event, d) {
      d3.select(this).transition().duration(200)
        .attr('opacity', 0.8)
        .attr('stroke', '#2D3748')
        .attr('stroke-width', 2);
      
      const tooltip = section.append('div').attr('class', 'chart-tooltip');
      tooltip.style('opacity', 0)
        .html(`
          <strong>${d.provider}</strong><br/>
          Total Billed: $${d.totalAmount.toLocaleString()}<br/>
          Avg per Patient: $${d.avgAmount.toFixed(2)}<br/>
          Patients: ${d.patientCount.toLocaleString()}<br/>
          Refund Rate: ${d.refundPercentage}%
        `)
        .transition().duration(300)
        .style('opacity', 1);
    })
    .on('mouseleave', function() {
      d3.select(this).transition().duration(200)
        .attr('opacity', 1)
        .attr('stroke', 'none');
      section.selectAll('.chart-tooltip').remove();
    })
    .on('mousemove', function(event) {
      section.select('.chart-tooltip')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    });

  // Add value labels on top of bars
  svg.selectAll('.insurance-label')
    .data(sortedInsurance)
    .enter()
    .append('text')
    .attr('class', 'insurance-label')
    .attr('x', d => x(d.provider) + x.bandwidth() / 2)
    .attr('y', d => y(d.totalAmount) - 8)
    .attr('text-anchor', 'middle')
    .style('font-size', '0.75rem')
    .style('font-weight', '600')
    .style('fill', '#2D3748')
    .text(d => `$${(d.totalAmount / 1000000).toFixed(1)}M`);

  // Add X-axis
  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(-45)');

  // Add Y-axis
  svg.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(y).ticks(5)
      .tickFormat(d => `$${(d / 1000000).toFixed(0)}M`))
    .call(g => g.select('.domain').remove());

  // Add Y-axis label
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left + 20)
    .attr('x', -height / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('fill', '#718096')
    .style('font-size', '0.875rem')
    .text('Total Billed Amount ($)');

  // Add grid lines
  svg.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(y)
      .ticks(5)
      .tickSize(-width)
      .tickFormat('')
    )
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-opacity', 0.7));



  // Create a simple legend showing the color scale
  const legend = section.append('div').attr('class', 'chart-legend');
  const legendTitle = legend.append('div').attr('class', 'legend-title')
    .style('font-weight', '600')
    .style('margin-bottom', '0.5rem')
    .text('Total Billed Amount');
  
  const legendScale = legend.append('div').attr('class', 'legend-scale')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '0.5rem');

  // Add color gradient
  const gradientDiv = legendScale.append('div')
    .style('width', '120px')
    .style('height', '15px')
    .style('background', 'linear-gradient(to right, #E3F2FD, #1565C0)')
    .style('border-radius', '3px');

  // Add min/max labels
  const minMax = legendScale.append('div')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('font-size', '0.75rem')
    .style('color', '#718096');

  minMax.append('div').text(`$${(Math.min(...sortedInsurance.map(d => d.totalAmount)) / 1000000).toFixed(1)}M`);
  minMax.append('div').text(`$${(Math.max(...sortedInsurance.map(d => d.totalAmount)) / 1000000).toFixed(1)}M`);
}
// Temporal Trend Chart
function renderTemporalTrend(container, agg) {
 
}

// Annual Billing Trend (Multi-year)
function renderAnnualBillingTrend(container, agg) {
  const section = container.append('div').attr('class', 'chart-section');
  section.append('h3').text('Annual Billing Comparison');
  section.append('p').attr('class', 'chart-description')
    .text('Monthly billing trends by year (in millions)');
  
  const chartDiv = section.append('div').attr('class', 'chart-container')
    .attr('id', 'annual-trend-chart');

  const margin = { top: 40, right: 100, bottom: 60, left: 80 };
  const width = 450 - margin.left - margin.right;
  const height = 350 - margin.top - margin.bottom;

  const svg = d3.select('#annual-trend-chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Get years from data, sort them
  const years = Object.keys(agg.annualTrend).sort();
  
  // Vérifier que nous avons des données
  if (years.length === 0) {
    chartDiv.append('p').text('No annual data available');
    return;
  }

  // Préparer les données pour chaque année
  const yearData = years.map(year => {
    return {
      year: year,
      values: agg.annualTrend[year] || Array(12).fill(0),
      total: (agg.annualTrend[year] || []).reduce((sum, val) => sum + val, 0)
    };
  });

  // Trouver le maximum pour l'échelle Y
  const allValues = years.flatMap(year => agg.annualTrend[year] || []);
  const maxValue = d3.max(allValues) || 0;

  const x = d3.scalePoint()
    .domain(months)
    .range([0, width])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([0, maxValue * 1.1]) // 10% de marge
    .nice()
    .range([height, 0]);

  // Couleurs distinctes pour chaque année
  const yearColors = {
    '2020': '#FF6B6B', // Rouge
    '2021': '#4ECDC4', // Turquoise
    '2022': '#9B7EBD', // Violet
    '2023': '#FFA500', // Orange
    '2024': '#667EEA', // Bleu
    '2025': '#E89B9B'  // Rose
  };

  // Tracer les lignes pour chaque année
  years.forEach((year, index) => {
    const data = agg.annualTrend[year] || Array(12).fill(0);
    
    // Créer la ligne
    const line = d3.line()
      .x((d, i) => x(months[i]))
      .y(d => y(d))
      .curve(d3.curveMonotoneX);

    // Ajouter la ligne
    svg.append('path')
      .datum(data)
      .attr('class', 'annual-line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', yearColors[year] || d3.schemeCategory10[index % 10])
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', year === years[years.length - 1] ? 'none' : 'none') // Toutes pleines
      .attr('opacity', 0.9);

    // Ajouter des points sur la ligne
    svg.selectAll(`.point-${year}`)
      .data(data)
      .enter()
      .append('circle')
      .attr('class', `data-point year-${year}`)
      .attr('cx', (d, i) => x(months[i]))
      .attr('cy', d => y(d))
      .attr('r', 4)
      .attr('fill', yearColors[year] || d3.schemeCategory10[index % 10])
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .on('mouseenter', function(event, d) {
        d3.select(this).transition().duration(200).attr('r', 6);
        
        // Afficher le tooltip
        const monthIndex = d3.select(this.parentNode).selectAll('.data-point').nodes().indexOf(this);
        const tooltip = section.append('div').attr('class', 'chart-tooltip');
        tooltip.style('opacity', 0)
          .html(`
            <strong>${months[monthIndex]} ${year}</strong><br/>
            Amount: $${(d / 1000000).toFixed(2)}M
          `)
          .transition().duration(300)
          .style('opacity', 1);
      })
      .on('mouseleave', function() {
        d3.select(this).transition().duration(200).attr('r', 4);
        section.selectAll('.chart-tooltip').remove();
      })
      .on('mousemove', function(event) {
        section.select('.chart-tooltip')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      });
  });

  // Ajouter l'axe X
  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('font-size', '0.75rem')
    .style('fill', '#718096');

  // Ajouter l'axe Y
  svg.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(y).ticks(5)
      .tickFormat(d => `$${(d / 1000000).toFixed(0)}M`))
    .call(g => g.select('.domain').remove());

  // Ajouter le label de l'axe Y
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left + 15)
    .attr('x', -height / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('fill', '#718096')
    .style('font-size', '0.875rem')
    .text('Monthly Amount ($)');

  // Ajouter des lignes de grille
  svg.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(y)
      .ticks(5)
      .tickSize(-width)
      .tickFormat('')
    )
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-opacity', 0.7));

  // Ajouter une légende
  const legend = section.append('div').attr('class', 'chart-legend')
    .style('margin-top', '1rem');

  years.forEach(year => {
    const item = legend.append('div').attr('class', 'legend-item')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '0.5rem')
      .style('margin-right', '1.5rem');

    item.append('div').attr('class', 'legend-color')
      .style('width', '15px')
      .style('height', '3px')
      .style('background', yearColors[year] || d3.schemeCategory10[years.indexOf(year) % 10]);

    item.append('span')
      .style('font-size', '0.875rem')
      .style('color', '#4a5568')
      .text(`${year} ($${(yearData.find(d => d.year === year)?.total / 1000000 || 0).toFixed(1)}M)`);
  });

  // Ajouter un titre au graphique
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .style('font-size', '1rem')
    .style('font-weight', '600')
    .style('fill', '#2D3748')
    .text('Annual Comparison');
}

// Annual Billing by Country
function renderAnnualByCountry(container, agg) {
  const section = container.append('div').attr('class', 'chart-section full-width');
  section.append('h3').text('Annual Billing by Country');
  section.append('p').attr('class', 'chart-description')
    .text('Total billing amount by country across years');
  
  const chartDiv = section.append('div').attr('class', 'chart-container')
    .attr('id', 'annual-country-chart');

  const margin = { top: 40, right: 150, bottom: 100, left: 100 };
  const width = 900 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select('#annual-country-chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Prepare data for grouped bar chart
  const years = Object.keys(agg.annualByCountry).sort();
  const countries = [...new Set(years.flatMap(year => 
    agg.annualByCountry[year].map(d => d.country)
  ))];

  const x0 = d3.scaleBand()
    .domain(countries)
    .range([0, width])
    .padding(0.2);

  const x1 = d3.scaleBand()
    .domain(years)
    .range([0, x0.bandwidth()])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(years.flatMap(year => 
      agg.annualByCountry[year].map(d => d.amount)
    ))])
    .nice()
    .range([height, 0]);

  // Groups for each country
  const countryGroups = svg.selectAll('.country-group')
    .data(countries)
    .enter()
    .append('g')
    .attr('class', 'country-group')
    .attr('transform', d => `translate(${x0(d)},0)`);

  // Bars for each year within country group
  years.forEach((year, i) => {
    countryGroups.append('rect')
      .attr('x', x1(year))
      .attr('y', d => {
        const data = agg.annualByCountry[year]?.find(item => item.country === d);
        return y(data?.amount || 0);
      })
      .attr('width', x1.bandwidth())
      .attr('height', d => {
        const data = agg.annualByCountry[year]?.find(item => item.country === d);
        return height - y(data?.amount || 0);
      })
      .attr('fill', FINANCIAL_COLORS.years[year] || d3.schemeSet3[i])
      .attr('opacity', 0.8)
      .attr('rx', 3);
  });

  // Axes
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x0))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(-45)');

  svg.append('g')
    .call(d3.axisLeft(y).ticks(5));

  // Legend
  const legend = svg.append('g')
    .attr('transform', `translate(${width + 20}, 0)`);

  years.forEach((year, i) => {
    const legendItem = legend.append('g')
      .attr('transform', `translate(0, ${i * 25})`);

    legendItem.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', FINANCIAL_COLORS.years[year] || d3.schemeSet3[i]);

    legendItem.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .text(year)
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle');
  });
}

// Clear cache function
export function clearFinancialCache() {
  cachedFinancialData = null;
}

// Filter data function
export function filterFinancialData(data, filters) {
  let filtered = data;
  
  if (filters.year && filters.year !== 'All') {
    filtered = filtered.filter(d => 
      new Date(d['Date of Admission']).getFullYear() === parseInt(filters.year)
    );
  }
  
  if (filters.insurance && filters.insurance !== 'All') {
    filtered = filtered.filter(d => d['Insurance Provider'] === filters.insurance);
  }
  
  if (filters.billType && filters.billType !== 'All') {
    filtered = filtered.filter(d => d['Type of Bill'] === filters.billType);
  }
  
  return filtered;
}