import filterManager from '../utils/filterManager.js';

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

// --- Helper: Shared Tooltip ---
function getTooltip() {
  let tooltip = d3.select('#shared-d3-tooltip');
  if (tooltip.empty()) {
    tooltip = d3.select('body').append('div')
      .attr('id', 'shared-d3-tooltip')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('z-index', '9999')
      .style('opacity', 0)
      .style('background', 'rgba(30, 41, 59, 0.95)')
      .style('color', '#fff')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '0.85rem')
      .style('box-shadow', '0 4px 6px rgba(0,0,0,0.1)')
      .style('pointer-events', 'none')
      .style('transition', 'opacity 0.15s ease');
  }
  return tooltip;
}

// --- Helper: Format Large Currency ---
function formatCurrency(value) {
  if (value >= 1000000) {
    return '$' + (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return '$' + (value / 1000).toFixed(0) + 'k';
  }
  return '$' + value.toLocaleString();
}

export function renderOverviewTab(data) {
  console.log('Rendering Overview Tab with', data.length, 'records');
  
  const container = d3.select('#overview-content');
  container.html('');

  // Filter Info
  const stats = filterManager.getFilterStats();
  if (stats.activeFilters > 0) {
    container.append('div')
      .attr('class', 'filter-info')
      .style('padding', '1rem')
      .style('background', '#EBF8FF')
      .style('border-radius', '8px')
      .style('margin-bottom', '1.5rem')
      .style('color', '#2C5282')
      .style('font-size', '0.875rem')
      .html(`
        📊 Showing <strong>${stats.filtered.toLocaleString()}</strong> of 
        <strong>${stats.total.toLocaleString()}</strong> records 
        (${stats.activeFilters} filter${stats.activeFilters > 1 ? 's' : ''} active)
      `);
  }

  // Render summary cards
  renderSummaryCards(container, data);

  // Charts Section
  const chartsSection = container.append('div').style('margin-top', '2rem');
  
  chartsSection.append('h2')
    .style('font-size', '1.25rem')
    .style('font-weight', '700')
    .style('margin-bottom', '1.5rem')
    .style('color', '#2d3748')
    .text('Key Insights');

  // Charts Grid
  const chartsGrid = chartsSection.append('div')
    .attr('class', 'charts-grid')
    .style('display', 'grid')
    .style('grid-template-columns', 'repeat(auto-fit, minmax(450px, 1fr))')
    .style('gap', '1.5rem');

  // Render Visualizations
  renderTestResultsDistribution(chartsGrid, data);
  renderMedicalConditionsVsTestResults(chartsGrid, data);
  renderLengthOfStayByConditionAndType(chartsGrid, data); // UPDATED
  renderAgeByCondition(chartsGrid, data);
  renderMedicalConditionsDistribution(chartsGrid, data);
  renderAdmissionTypesDistribution(chartsGrid, data);
}

// ============ SUMMARY CARDS ============
function renderSummaryCards(container, data) {
  const totalBilling = d3.sum(data, d => d['Billing Amount']);
  const avgAge = d3.mean(data, d => d.Age);
  const avgLengthOfStay = d3.mean(data, d => d['Length of Stay']);

  const metrics = [
    {
      title: 'Total Patients',
      value: data.length.toLocaleString(),
      subtitle: 'Active Records',
      icon: '👥',
      color: '#667EEA'
    },
    {
      title: 'Total Billing',
      value: formatCurrency(totalBilling),
      subtitle: 'Revenue Generated',
      icon: '💰',
      color: '#48BB78'
    },
    {
      title: 'Average Age',
      value: avgAge.toFixed(1),
      subtitle: 'Years',
      icon: '🎂',
      color: '#9F7AEA'
    },
    {
      title: 'Avg Length of Stay',
      value: avgLengthOfStay.toFixed(1),
      subtitle: 'Days',
      icon: '🏥',
      color: '#4ECDC4'
    }
  ];

  const metricsGrid = container.append('div')
    .attr('class', 'metrics-grid')
    .style('display', 'grid')
    .style('grid-template-columns', 'repeat(auto-fit, minmax(200px, 1fr))')
    .style('gap', '1.5rem');

  const cards = metricsGrid.selectAll('.metric-card')
    .data(metrics).enter().append('div')
    .attr('class', 'metric-card')
    .style('padding', '1.5rem')
    .style('background', 'white')
    .style('border-radius', '12px')
    .style('box-shadow', '0 2px 4px rgba(0,0,0,0.05)');

  cards.append('div')
    .attr('class', 'metric-icon')
    .style('width', '48px')
    .style('height', '48px')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('border-radius', '10px')
    .style('font-size', '1.5rem')
    .style('margin-bottom', '1rem')
    .style('background', d => d.color + '20')
    .style('color', d => d.color)
    .text(d => d.icon);

  const content = cards.append('div').attr('class', 'metric-content');

  content.append('div').attr('class', 'metric-title')
    .style('font-size', '0.875rem')
    .style('color', '#718096')
    .text(d => d.title);

  content.append('div').attr('class', 'metric-value')
    .style('font-size', '1.5rem')
    .style('font-weight', '700')
    .style('color', '#2D3748')
    .text(d => d.value);

  content.append('div').attr('class', 'metric-subtitle')
    .style('font-size', '0.75rem')
    .style('color', '#A0AEC0')
    .text(d => d.subtitle);
}

// ============ 1. TEST RESULTS (Donut) ============
function renderTestResultsDistribution(container, data) {
  const card = container.append('div').attr('class', 'chart-card');
  card.append('div').attr('class', 'chart-header')
    .html('<div class="chart-title">Test Results</div><div class="chart-subtitle">Distribution of outcomes</div>');

  const chartDiv = card.append('div').attr('class', 'chart-container').style('min-height', '300px');

  const testCounts = d3.rollup(data, v => v.length, d => d['Test Results']);
  const testData = Array.from(testCounts, ([key, value]) => ({
    result: key, count: value, percentage: ((value / data.length) * 100).toFixed(1)
  }));

  const width = 350, height = 300, margin = 20;
  const radius = Math.min(width, height) / 2 - margin;
  const svg = chartDiv.append('svg').attr('width', '100%').attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .append('g').attr('transform', `translate(${width/2}, ${height/2})`);

  const pie = d3.pie().value(d => d.count).sort(null);
  const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);
  const arcHover = d3.arc().innerRadius(radius * 0.6).outerRadius(radius + 8);
  const tooltip = getTooltip();

  svg.selectAll('path').data(pie(testData)).enter().append('path')
    .attr('d', arc)
    .attr('fill', d => COLORS.testResults[d.data.result])
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseenter', function(event, d) {
      d3.select(this).transition().duration(200).attr('d', arcHover);
      tooltip.style('opacity', 1)
        .html(`<strong>${d.data.result}</strong><br/>Count: ${d.data.count}<br/>${d.data.percentage}%`)
        .style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 10) + 'px');
    })
    .on('mousemove', e => tooltip.style('left', (e.pageX + 10) + 'px').style('top', (e.pageY - 10) + 'px'))
    .on('mouseleave', function() {
      d3.select(this).transition().duration(200).attr('d', arc);
      tooltip.style('opacity', 0);
    });

  svg.append('text').attr('text-anchor', 'middle').attr('dy', '-0.3em')
    .style('font-size', '1.5rem').style('font-weight', '700').text(data.length.toLocaleString());
  svg.append('text').attr('text-anchor', 'middle').attr('dy', '1em')
    .style('font-size', '0.75rem').style('fill', '#718096').text('Total Tests');

  const legend = card.append('div').attr('class', 'chart-legend').style('margin-top', '1rem');
  testData.forEach(d => {
    const item = legend.append('div').attr('class', 'legend-item');
    item.append('div').attr('class', 'legend-color').style('background', COLORS.testResults[d.result]);
    item.append('span').text(`${d.result} (${d.percentage}%)`);
  });
}

// ============ 2. CONDITIONS vs TEST RESULTS (Grouped Bar) ============
function renderMedicalConditionsVsTestResults(container, data) {
  const card = container.append('div').attr('class', 'chart-card');
  card.append('div').attr('class', 'chart-header')
    .html('<div class="chart-title">Conditions vs Test Results</div><div class="chart-subtitle">Outcomes by condition</div>');

  const chartDiv = card.append('div').attr('class', 'chart-container').style('min-height', '300px');
  
  const conditions = Object.keys(COLORS.medicalConditions);
  const testResults = ['Normal', 'Abnormal', 'Inconclusive'];

  const nestedData = conditions.map(condition => {
    const conditionData = data.filter(d => d['Medical Condition'] === condition);
    const result = { condition };
    testResults.forEach(r => result[r] = conditionData.filter(d => d['Test Results'] === r).length);
    return result;
  });

  const margin = {top: 20, right: 20, bottom: 60, left: 40};
  const width = 450 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = chartDiv.append('svg')
    .attr('width', '100%').attr('height', height + margin.top + margin.bottom)
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand().domain(conditions).range([0, width]).padding(0.2);
  const x1 = d3.scaleBand().domain(testResults).range([0, x0.bandwidth()]).padding(0.05);
  const y = d3.scaleLinear().domain([0, d3.max(nestedData, d => Math.max(d.Normal, d.Abnormal, d.Inconclusive))]).nice().range([height, 0]);
  
  const tooltip = getTooltip();

  const group = svg.selectAll('.g').data(nestedData).enter().append('g')
    .attr('transform', d => `translate(${x0(d.condition)},0)`);

  group.selectAll('rect').data(d => testResults.map(key => ({key, value: d[key], condition: d.condition})))
    .enter().append('rect')
    .attr('x', d => x1(d.key)).attr('y', d => y(d.value))
    .attr('width', x1.bandwidth()).attr('height', d => height - y(d.value))
    .attr('fill', d => COLORS.testResults[d.key]).attr('rx', 2)
    .on('mouseenter', function(event, d) {
      d3.select(this).attr('opacity', 0.8);
      tooltip.style('opacity', 1)
        .html(`<strong>${d.condition}</strong><br/>${d.key}: ${d.value}<br/>Total: ${nestedData.find(x=>x.condition===d.condition)[d.key]}`)
        .style('left', (event.pageX+10)+'px').style('top', (event.pageY-10)+'px');
    })
    .on('mousemove', e => tooltip.style('left', (e.pageX + 10) + 'px').style('top', (e.pageY - 10) + 'px'))
    .on('mouseleave', function() {
      d3.select(this).attr('opacity', 1);
      tooltip.style('opacity', 0);
    });

  svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x0))
    .selectAll('text').attr('transform', 'rotate(-30)').style('text-anchor', 'end');
  svg.append('g').call(d3.axisLeft(y).ticks(5));
}

// ============ 3. AVG LENGTH OF STAY by CONDITION & TYPE (Grouped Bar) ============
function renderLengthOfStayByConditionAndType(container, data) {
  const card = container.append('div').attr('class', 'chart-card');
  card.append('div').attr('class', 'chart-header')
    .html('<div class="chart-title">Avg Length of Stay</div><div class="chart-subtitle">By condition and admission type</div>');

  const chartDiv = card.append('div').attr('class', 'chart-container').style('min-height', '300px');

  const conditions = Object.keys(COLORS.medicalConditions);
  const admissionTypes = ['Emergency', 'Urgent', 'Elective'];

  // Data Aggregation
  const nestedData = conditions.map(condition => {
    const condData = data.filter(d => d['Medical Condition'] === condition);
    const result = { condition };
    admissionTypes.forEach(type => {
        const typeData = condData.filter(d => d['Admission Type'] === type);
        result[type] = typeData.length ? d3.mean(typeData, d => d['Length of Stay']) : 0;
    });
    return result;
  });

  const margin = {top: 20, right: 20, bottom: 60, left: 40};
  const width = 450 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = chartDiv.append('svg')
    .attr('width', '100%').attr('height', height + margin.top + margin.bottom)
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Scales
  const x0 = d3.scaleBand().domain(conditions).range([0, width]).padding(0.2);
  const x1 = d3.scaleBand().domain(admissionTypes).range([0, x0.bandwidth()]).padding(0.05);
  const y = d3.scaleLinear()
    .domain([0, d3.max(nestedData, d => Math.max(d.Emergency, d.Urgent, d.Elective))])
    .nice()
    .range([height, 0]);
  
  const tooltip = getTooltip();

  const group = svg.selectAll('.g').data(nestedData).enter().append('g')
    .attr('transform', d => `translate(${x0(d.condition)},0)`);

  group.selectAll('rect').data(d => admissionTypes.map(key => ({key, value: d[key], condition: d.condition})))
    .enter().append('rect')
    .attr('x', d => x1(d.key))
    .attr('y', d => y(d.value))
    .attr('width', x1.bandwidth())
    .attr('height', d => height - y(d.value))
    .attr('fill', d => COLORS.admissionType[d.key])
    .attr('rx', 2)
    .on('mouseenter', function(event, d) {
      d3.select(this).attr('opacity', 0.8);
      tooltip.style('opacity', 1)
        .html(`
            <strong>${d.condition}</strong><br/>
            Type: ${d.key}<br/>
            Avg Stay: ${d.value.toFixed(1)} days
        `)
        .style('left', (event.pageX+10)+'px').style('top', (event.pageY-10)+'px');
    })
    .on('mousemove', e => tooltip.style('left', (e.pageX + 10) + 'px').style('top', (e.pageY - 10) + 'px'))
    .on('mouseleave', function() {
      d3.select(this).attr('opacity', 1);
      tooltip.style('opacity', 0);
    });

  // Axes
  svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x0))
    .selectAll('text').attr('transform', 'rotate(-30)').style('text-anchor', 'end');
  svg.append('g').call(d3.axisLeft(y).ticks(5));

  // Legend
  const legend = card.append('div').attr('class', 'chart-legend').style('margin-top', '1rem');
  admissionTypes.forEach(type => {
    const item = legend.append('div').attr('class', 'legend-item');
    item.append('div').attr('class', 'legend-color').style('background', COLORS.admissionType[type]);
    item.append('span').text(type);
  });
}

// ============ 4. AGE & CONDITION (Stacked Bar) ============
function renderAgeByCondition(container, data) {
  const card = container.append('div').attr('class', 'chart-card');
  card.append('div').attr('class', 'chart-header')
    .html('<div class="chart-title">Age Groups by Condition</div><div class="chart-subtitle">Demographics per condition</div>');

  const chartDiv = card.append('div').attr('class', 'chart-container').style('min-height', '300px');

  const conditions = Object.keys(COLORS.medicalConditions);
  const ageGroups = ['0-18', '19-40', '41-65', '65+'];
  
  const stackData = conditions.map(cond => {
    const condData = data.filter(d => d['Medical Condition'] === cond);
    const obj = { condition: cond, total: condData.length };
    ageGroups.forEach(age => {
      obj[age] = condData.filter(d => d['Age Group'] === age).length;
    });
    return obj;
  });

  const margin = {top: 20, right: 20, bottom: 60, left: 40};
  const width = 450 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = chartDiv.append('svg')
    .attr('width', '100%').attr('height', height + margin.top + margin.bottom)
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(conditions).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(stackData, d => d.total)]).nice().range([height, 0]);
  const stack = d3.stack().keys(ageGroups);
  const tooltip = getTooltip();

  const series = svg.selectAll('.series')
    .data(stack(stackData))
    .enter().append('g')
    .attr('fill', d => COLORS.ageGroup[d.key]);

  series.selectAll('rect')
    .data(d => d)
    .enter().append('rect')
    .attr('x', d => x(d.data.condition))
    .attr('y', d => y(d[1]))
    .attr('height', d => y(d[0]) - y(d[1]))
    .attr('width', x.bandwidth())
    .attr('rx', 2)
    .on('mouseenter', function(event, d) {
      const groupName = d3.select(this.parentNode).datum().key;
      const count = d[1] - d[0];
      d3.select(this).attr('opacity', 0.8);
      tooltip.style('opacity', 1)
        .html(`
          <strong>${d.data.condition}</strong><br/>
          Age ${groupName}: ${count}<br/>
          Percentage: ${((count / d.data.total) * 100).toFixed(1)}%
        `)
        .style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 10) + 'px');
    })
    .on('mousemove', e => tooltip.style('left', (e.pageX + 10) + 'px').style('top', (e.pageY - 10) + 'px'))
    .on('mouseleave', function() {
      d3.select(this).attr('opacity', 1);
      tooltip.style('opacity', 0);
    });

  svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x))
    .selectAll('text').attr('transform', 'rotate(-30)').style('text-anchor', 'end');
  svg.append('g').call(d3.axisLeft(y).ticks(5));

  const legend = card.append('div').attr('class', 'chart-legend').style('margin-top', '1rem');
  ageGroups.forEach(age => {
    const item = legend.append('div').attr('class', 'legend-item');
    item.append('div').attr('class', 'legend-color').style('background', COLORS.ageGroup[age]);
    item.append('span').text(age);
  });
}

// ============ 5. MEDICAL CONDITIONS LIST ============
function renderMedicalConditionsDistribution(container, data) {
  const card = container.append('div').attr('class', 'chart-card');
  card.append('div').attr('class', 'chart-header')
    .html('<div class="chart-title">Medical Conditions</div><div class="chart-subtitle">Total patient count</div>');

  const counts = Array.from(d3.rollup(data, v => v.length, d => d['Medical Condition']), 
    ([key, value]) => ({ condition: key, count: value, pct: ((value/data.length)*100).toFixed(1) }))
    .sort((a, b) => b.count - a.count);

  const listDiv = card.append('div').style('padding', '1rem 0').style('max-height', '300px').style('overflow-y', 'auto');

  counts.forEach(d => {
    const row = listDiv.append('div').style('display', 'flex').style('justify-content', 'space-between')
      .style('padding', '0.75rem 0').style('border-bottom', '1px solid #E2E8F0');
    
    const left = row.append('div').style('display', 'flex').style('align-items', 'center').style('gap', '0.75rem');
    left.append('div').style('width','12px').style('height','12px').style('border-radius','3px')
      .style('background', COLORS.medicalConditions[d.condition]);
    left.append('span').style('font-weight','500').style('color','#2D3748').text(d.condition);
    
    row.append('span').style('font-weight','600').style('color','#667EEA')
      .text(`${d.count.toLocaleString()} (${d.pct}%)`);
  });
}

// ============ 6. ADMISSION TYPES (Progress Bars) ============
function renderAdmissionTypesDistribution(container, data) {
  const card = container.append('div').attr('class', 'chart-card');
  card.append('div').attr('class', 'chart-header')
    .html('<div class="chart-title">Admission Types</div><div class="chart-subtitle">Emergency vs Urgent vs Elective</div>');

  const counts = Array.from(d3.rollup(data, v => v.length, d => d['Admission Type']),
    ([key, value]) => ({ type: key, count: value, pct: ((value/data.length)*100).toFixed(1) }));

  const div = card.append('div').style('padding', '1rem 0');
  const colors = COLORS.admissionType;

  counts.forEach(d => {
    const row = div.append('div').style('margin-bottom', '1rem');
    row.append('div').style('display','flex').style('justify-content','space-between').style('margin-bottom','0.5rem')
      .html(`<span style="font-weight:500;color:#2D3748">${d.type}</span><span style="font-weight:600">${d.count.toLocaleString()} (${d.pct}%)</span>`);
    
    row.append('div').style('width','100%').style('height','10px').style('background','#E2E8F0').style('border-radius','5px').style('overflow','hidden')
      .append('div').style('width','0%').style('height','100%').style('background', colors[d.type])
      .transition().duration(800).style('width', d.pct + '%');
  });
}