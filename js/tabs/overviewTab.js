import filterManager from '../utils/filterManager.js';

// Categorical colors stay constant across themes for data consistency
const COLORS = {
  testResults: {
    'Normal': '#48BB78',
    'Abnormal': '#FC8181',
    'Inconclusive': '#F6AD55'
  },
  medicalConditions: {
    'Cancer': '#FF6B9D',
    'Diabetes': '#667EEA',
    'Obesity': '#F6AD55',
    'Asthma': '#4ECDC4',
    'Hypertension': '#FC8181',
    'Arthritis': '#9F7AEA'
  },
  ageGroup: { 
    '0-18': '#A8D5BA', 
    '19-40': '#7FB3D5', 
    '41-65': '#9B7EBD', 
    '65+': '#E89B9B' 
  },
  admissionType: { 
    'Emergency': '#FF6B6B', 
    'Urgent': '#FFA500', 
    'Elective': '#4ECDC4' 
  }
};

function getTooltip() {
  let tooltip = d3.select('#shared-d3-tooltip');
  if (tooltip.empty()) {
    tooltip = d3.select('body').append('div')
      .attr('id', 'shared-d3-tooltip')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('z-index', '9999')
      .style('opacity', 0)
      .style('pointer-events', 'none')
      .style('transition', 'opacity 0.15s ease');
  }
  return tooltip;
}

function formatCurrency(value) {
  if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'k';
  return '$' + value.toLocaleString();
}

export function renderOverviewTab(data) {
  const container = d3.select('#overview-content');
  container.html('');

  // 1. Filter Statistics Banner
  const stats = filterManager.getFilterStats();
  if (stats.activeFilters > 0) {
    container.append('div')
      .attr('class', 'filter-info')
      .style('padding', '1rem')
      .style('border-radius', 'var(--radius-md)')
      .style('margin-bottom', '1.5rem')
      .html(`
        📊 Showing <strong>${stats.filtered.toLocaleString()}</strong> of 
        <strong>${stats.total.toLocaleString()}</strong> records 
        (${stats.activeFilters} filter${stats.activeFilters > 1 ? 's' : ''} active)
      `);
  }

  // 2. Summary Cards Section
  renderSummaryCards(container, data);

  // 3. Charts Grid Section
  const chartsSection = container.append('div').style('margin-top', '2rem');
  
  chartsSection.append('h2')
    .style('font-size', '1.25rem')
    .style('font-weight', '700')
    .style('margin-bottom', '1.5rem')
    .style('color', 'var(--text-primary)')
    .text('Key Insights');

  const chartsGrid = chartsSection.append('div').attr('class', 'charts-grid');

  // 4. Fire off all visualizations
  renderTestResultsDistribution(chartsGrid, data);
  renderMedicalConditionsVsTestResults(chartsGrid, data);
  renderLengthOfStayByConditionAndType(chartsGrid, data);
  renderAgeByCondition(chartsGrid, data);
  renderMedicalConditionsDistribution(chartsGrid, data);
  renderAdmissionTypesDistribution(chartsGrid, data);
}

// ============ 1. SUMMARY CARDS ============
function renderSummaryCards(container, data) {
  const metrics = [
    { title: 'Total Patients', value: data.length.toLocaleString(), subtitle: 'Active Records', icon: '👥', color: 'var(--primary)' },
    { title: 'Total Billing', value: formatCurrency(d3.sum(data, d => d['Billing Amount'])), subtitle: 'Revenue Generated', icon: '💰', color: 'var(--success)' },
    { title: 'Average Age', value: d3.mean(data, d => d.Age).toFixed(1), subtitle: 'Years', icon: '🎂', color: 'var(--secondary)' },
    { title: 'Avg Length of Stay', value: d3.mean(data, d => d['Length of Stay']).toFixed(1), subtitle: 'Days', icon: '🏥', color: 'var(--info)' }
  ];

  const metricsGrid = container.append('div').attr('class', 'metrics-grid');

  const cards = metricsGrid.selectAll('.metric-card')
    .data(metrics).enter().append('div')
    .attr('class', 'metric-card');

  cards.append('div')
    .attr('class', 'metric-icon')
    .style('background', d => `${d.color}15`) // Soft themed background
    .style('color', d => d.color)
    .text(d => d.icon);

  const content = cards.append('div').attr('class', 'metric-content');
  content.append('div').attr('class', 'metric-title').text(d => d.title);
  content.append('div').attr('class', 'metric-value').text(d => d.value);
  content.append('div').attr('class', 'metric-change').style('color', 'var(--text-muted)').text(d => d.subtitle);
}

// ============ 2. TEST RESULTS (Donut) ============
function renderTestResultsDistribution(container, data) {
  const card = container.append('div').attr('class', 'chart-card');
  card.append('div').attr('class', 'chart-header')
    .html('<div class="chart-title">Test Results</div><div class="chart-subtitle">Distribution of outcomes</div>');

  const chartDiv = card.append('div').attr('class', 'chart-container').style('min-height', '300px');
  const testCounts = d3.rollup(data, v => v.length, d => d['Test Results']);
  const testData = Array.from(testCounts, ([key, value]) => ({ result: key, count: value }));

  const width = 350, height = 300;
  const radius = Math.min(width, height) / 2 - 20;
  const svg = chartDiv.append('svg').attr('width', '100%').attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .append('g').attr('transform', `translate(${width/2}, ${height/2})`);

  const pie = d3.pie().value(d => d.count).sort(null);
  const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);
  const tooltip = getTooltip();

  svg.selectAll('path').data(pie(testData)).enter().append('path')
    .attr('d', arc)
    .attr('fill', d => COLORS.testResults[d.data.result])
    .attr('stroke', 'var(--bg-card)') // Segments separated by card color
    .attr('stroke-width', 2)
    .on('mouseenter', (event, d) => {
      tooltip.style('opacity', 1).html(`<strong>${d.data.result}</strong>: ${d.data.count}`);
    })
    .on('mousemove', e => tooltip.style('left', (e.pageX + 10) + 'px').style('top', (e.pageY - 10) + 'px'))
    .on('mouseleave', () => tooltip.style('opacity', 0));

  svg.append('text').attr('text-anchor', 'middle').attr('dy', '-0.3em')
    .style('font-size', '1.5rem').style('font-weight', '700').style('fill', 'var(--text-primary)')
    .text(data.length.toLocaleString());
  svg.append('text').attr('text-anchor', 'middle').attr('dy', '1.2em')
    .style('font-size', '0.75rem').style('fill', 'var(--text-secondary)').text('Total Patients');
}

// ============ 3. CONDITIONS vs TEST RESULTS (Grouped Bar) ============
function renderMedicalConditionsVsTestResults(container, data) {
  const card = container.append('div').attr('class', 'chart-card');
  card.append('div').attr('class', 'chart-header')
    .html('<div class="chart-title">Conditions vs Test Results</div>');

  const chartDiv = card.append('div').attr('class', 'chart-container');
  const conditions = Object.keys(COLORS.medicalConditions);
  const testResults = ['Normal', 'Abnormal', 'Inconclusive'];

  const nestedData = conditions.map(condition => {
    const subset = data.filter(d => d['Medical Condition'] === condition);
    const result = { condition };
    testResults.forEach(r => result[r] = subset.filter(d => d['Test Results'] === r).length);
    return result;
  });

  const margin = {top: 20, right: 20, bottom: 60, left: 40}, width = 450 - 60, height = 240;
  const svg = chartDiv.append('svg').attr('viewBox', `0 0 450 300`)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand().domain(conditions).range([0, width]).padding(0.2);
  const x1 = d3.scaleBand().domain(testResults).range([0, x0.bandwidth()]).padding(0.05);
  const y = d3.scaleLinear().domain([0, d3.max(nestedData, d => Math.max(d.Normal, d.Abnormal, d.Inconclusive))]).nice().range([height, 0]);

  svg.selectAll('.g').data(nestedData).enter().append('g')
    .attr('transform', d => `translate(${x0(d.condition)},0)`)
    .selectAll('rect').data(d => testResults.map(key => ({key, value: d[key]})))
    .enter().append('rect')
    .attr('x', d => x1(d.key)).attr('y', d => y(d.value))
    .attr('width', x1.bandwidth()).attr('height', d => height - y(d.value))
    .attr('fill', d => COLORS.testResults[d.key]).attr('rx', 2);

  svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x0))
    .selectAll('text').attr('transform', 'rotate(-30)').style('text-anchor', 'end');
  svg.append('g').call(d3.axisLeft(y).ticks(5));
}

// ============ 4. AGE & CONDITION (Stacked Bar) ============
function renderAgeByCondition(container, data) {
  const card = container.append('div').attr('class', 'chart-card');
  card.append('div').attr('class', 'chart-header').html('<div class="chart-title">Age Groups</div>');
  const chartDiv = card.append('div').attr('class', 'chart-container');

  const conditions = Object.keys(COLORS.medicalConditions);
  const ageGroups = ['0-18', '19-40', '41-65', '65+'];
  const stackData = conditions.map(cond => {
    const subset = data.filter(d => d['Medical Condition'] === cond);
    const obj = { condition: cond };
    ageGroups.forEach(age => obj[age] = subset.filter(d => d['Age Group'] === age).length);
    return obj;
  });

  const margin = {top: 20, right: 20, bottom: 60, left: 40}, width = 390, height = 240;
  const svg = chartDiv.append('svg').attr('viewBox', `0 0 450 300`)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(conditions).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(stackData, d => d3.sum(ageGroups, a => d[a]))]).nice().range([height, 0]);
  const stack = d3.stack().keys(ageGroups);

  svg.selectAll('.series').data(stack(stackData)).enter().append('g')
    .attr('fill', d => COLORS.ageGroup[d.key])
    .selectAll('rect').data(d => d).enter().append('rect')
    .attr('x', d => x(d.data.condition)).attr('y', d => y(d[1])).attr('height', d => y(d[0]) - y(d[1])).attr('width', x.bandwidth()).attr('rx', 2);

  svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x))
    .selectAll('text').attr('transform', 'rotate(-30)').style('text-anchor', 'end');
  svg.append('g').call(d3.axisLeft(y).ticks(5));
}

// ============ 5. MEDICAL CONDITIONS LIST ============
function renderMedicalConditionsDistribution(container, data) {
  const card = container.append('div').attr('class', 'chart-card');
  card.append('div').attr('class', 'chart-header').html('<div class="chart-title">Prevalence</div>');

  const counts = Array.from(d3.rollup(data, v => v.length, d => d['Medical Condition']), 
    ([key, value]) => ({ condition: key, count: value, pct: ((value/data.length)*100).toFixed(1) }))
    .sort((a, b) => b.count - a.count);

  const listDiv = card.append('div').style('padding', '1rem 0');
  counts.forEach(d => {
    const row = listDiv.append('div').style('display', 'flex').style('justify-content', 'space-between')
      .style('padding', '0.75rem 0').style('border-bottom', '1px solid var(--border-color)');
    
    const left = row.append('div').style('display', 'flex').style('align-items', 'center').style('gap', '0.75rem');
    left.append('div').style('width','12px').style('height','12px').style('border-radius','3px').style('background', COLORS.medicalConditions[d.condition]);
    left.append('span').style('font-weight','500').style('color','var(--text-primary)').text(d.condition);
    
    row.append('span').style('font-weight','600').style('color','var(--primary)').text(`${d.count.toLocaleString()} (${d.pct}%)`);
  });
}

// ============ 6. ADMISSION TYPES ============
function renderAdmissionTypesDistribution(container, data) {
  const card = container.append('div').attr('class', 'chart-card');
  card.append('div').attr('class', 'chart-header').html('<div class="chart-title">Admissions</div>');

  const counts = Array.from(d3.rollup(data, v => v.length, d => d['Admission Type']),
    ([key, value]) => ({ type: key, count: value, pct: ((value/data.length)*100).toFixed(1) }));

  const div = card.append('div').style('padding', '1rem 0');
  counts.forEach(d => {
    const row = div.append('div').style('margin-bottom', '1.25rem');
    row.append('div').style('display','flex').style('justify-content','space-between').style('margin-bottom','0.5rem')
      .html(`<span style="font-weight:500;color:var(--text-primary)">${d.type}</span><span style="font-weight:600;color:var(--text-primary)">${d.pct}%</span>`);
    
    row.append('div').style('width','100%').style('height','8px').style('background','var(--bg-primary)').style('border-radius','4px').style('overflow','hidden')
      .append('div').style('width','0%').style('height','100%').style('background', COLORS.admissionType[d.type])
      .transition().duration(1000).style('width', d.pct + '%');
  });
}

// ============ 7. LENGTH OF STAY BY CONDITION (Placeholder logic) ============
function renderLengthOfStayByConditionAndType(container, data) {
  const card = container.append('div').attr('class', 'chart-card');
  card.append('div').attr('class', 'chart-header').html('<div class="chart-title">Avg Stay (Days)</div>');
  const chartDiv = card.append('div').attr('class', 'chart-container');

  const conditions = Object.keys(COLORS.medicalConditions);
  const avgData = conditions.map(cond => ({
    condition: cond,
    stay: d3.mean(data.filter(d => d['Medical Condition'] === cond), d => d['Length of Stay'])
  })).sort((a,b) => b.stay - a.stay);

  const margin = {top: 20, right: 20, bottom: 60, left: 40}, width = 390, height = 240;
  const svg = chartDiv.append('svg').attr('viewBox', `0 0 450 300`)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(avgData.map(d => d.condition)).range([0, width]).padding(0.3);
  const y = d3.scaleLinear().domain([0, d3.max(avgData, d => d.stay)]).nice().range([height, 0]);

  svg.selectAll('rect').data(avgData).enter().append('rect')
    .attr('x', d => x(d.condition)).attr('y', d => y(d.stay)).attr('width', x.bandwidth()).attr('height', d => height - y(d.stay))
    .attr('fill', 'var(--info)').attr('rx', 4);

  svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x))
    .selectAll('text').attr('transform', 'rotate(-30)').style('text-anchor', 'end');
  svg.append('g').call(d3.axisLeft(y).ticks(5));
}