// js/tabs/demographicsTab.js - Enhanced with tooltips and fluid layout

const COLORS = {
  gender: { Male: '#6B9BD1', Female: '#E89AC7' },
  ageGroup: { '0-18': '#A8D5BA', '19-40': '#7FB3D5', '41-65': '#9B7EBD', '65+': '#E89B9B' },
  bloodType: { 'A': '#FF6B9D', 'B': '#4ECDC4', 'AB': '#C7A3D9', 'O': '#FFB84D' },
  admissionType: { 'Emergency': '#FF6B6B', 'Urgent': '#FFA500', 'Elective': '#4ECDC4' }
};

let cachedAggregations = null;

export function renderDemographicsTab(data) {
  console.time('Demographics Tab Render');
  
  const container = d3.select('#demographics-content');
  container.html('');

  // Clear cache and re-aggregate for filtered data
  cachedAggregations = aggregateData(data);

  const agg = cachedAggregations;

  // Create layout - REMOVED fixed height and overflow to prevent internal scrolling
  const layout = container.append('div')
    .attr('class', 'demographics-layout-compact')
    .style('width', '100%'); // Ensure full width usage

  // Render enhanced summary cards
  renderSummaryCards(layout, agg, data);
  
  // Create compact 2x2 grid for charts
  const chartsGrid = layout.append('div')
    .attr('class', 'charts-grid-compact')
    .style('display', 'grid')
    .style('grid-template-columns', 'repeat(2, 1fr)') // Keep side-by-side
    .style('gap', '1rem')
    .style('margin-top', '1.5rem')
    .style('padding-bottom', '2rem'); // Add padding at bottom for breathing room

  // Render all charts with shared tooltip logic
  renderGenderChart(chartsGrid, agg.gender, agg.total);
  renderAgeGroupChart(chartsGrid, agg.ageGroup, agg.total);
  renderBloodTypeChart(chartsGrid, agg.bloodType, agg.total);
  renderAdmissionTypeChart(chartsGrid, agg.admission, agg.total);

  console.timeEnd('Demographics Tab Render');
}

// --- Helper: Shared Tooltip ---
// Prevents creating multiple tooltip divs in the DOM and ensures styling
function getTooltip() {
  let tooltip = d3.select('#shared-d3-tooltip');
  
  if (tooltip.empty()) {
    tooltip = d3.select('body').append('div')
      .attr('id', 'shared-d3-tooltip')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('z-index', '9999')
      .style('opacity', 0)
      .style('background', 'rgba(30, 41, 59, 0.95)') // Dark background
      .style('color', '#fff')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '0.85rem')
      .style('box-shadow', '0 4px 6px rgba(0,0,0,0.1)')
      .style('pointer-events', 'none') // Crucial: prevents tooltip from blocking mouse events
      .style('transition', 'opacity 0.15s ease');
  }
  return tooltip;
}

// Pre-aggregate all data
function aggregateData(data) {
  const total = data.length;
  
  // Count children (age < 18)
  const childrenCount = data.filter(d => d.Age < 18).length;
  
  // Count unique admissions and discharges
  const admissionsCount = data.filter(d => d['Date of Admission']).length;
  const dischargesCount = data.filter(d => d['Discharge Date']).length;
  
  return {
    total: total,
    avgAge: d3.mean(data, d => d.Age),
    childrenCount: childrenCount,
    admissionsCount: admissionsCount,
    dischargesCount: dischargesCount,
    
    gender: Array.from(
      d3.rollup(data, v => v.length, d => d.Gender),
      ([key, value]) => ({ 
        gender: key, 
        count: value, 
        percentage: ((value / total) * 100).toFixed(1) 
      })
    ),
    
    ageGroup: ['0-18', '19-40', '41-65', '65+'].map(group => {
      const count = data.filter(d => d['Age Group'] === group).length;
      return {
        group: group,
        count: count,
        percentage: ((count / total) * 100).toFixed(1)
      };
    }),
    
    bloodType: ['A', 'B', 'AB', 'O'].map(group => {
      const positive = data.filter(d => d['Blood Type'] === `${group}+`).length;
      const negative = data.filter(d => d['Blood Type'] === `${group}-`).length;
      return { 
        group, 
        positive, 
        negative,
        total: positive + negative
      };
    }),
    
    admission: ['0-18', '19-40', '41-65', '65+'].map(age => {
      const byAge = data.filter(d => d['Age Group'] === age);
      return {
        ageGroup: age,
        Emergency: byAge.filter(d => d['Admission Type'] === 'Emergency').length,
        Urgent: byAge.filter(d => d['Admission Type'] === 'Urgent').length,
        Elective: byAge.filter(d => d['Admission Type'] === 'Elective').length
      };
    })
  };
}

function renderSummaryCards(container, agg, data) {
  const cards = [
    { 
      title: 'Total Patients', 
      value: agg.total.toLocaleString(), 
      subtitle: 'Active Records',
      icon: '👥',
      color: '#667EEA'
    },
    { 
      title: 'Children (0-18)', 
      value: agg.childrenCount.toLocaleString(),
      subtitle: `${((agg.childrenCount / agg.total) * 100).toFixed(1)}% of total`,
      icon: '👶',
      color: '#A8D5BA'
    },
    { 
      title: 'Average Age', 
      value: agg.avgAge.toFixed(1),
      subtitle: 'Years',
      icon: '🎂',
      color: '#9B7EBD'
    }
  ];

  const cardContainer = container.append('div')
    .attr('class', 'summary-cards-compact')
    .style('display', 'grid')
    .style('grid-template-columns', 'repeat(3, 1fr)')
    .style('gap', '1.5rem')
    .style('margin-bottom', '1rem');

  const cardDivs = cardContainer.selectAll('.metric-card')
    .data(cards).enter().append('div')
    .attr('class', 'metric-card')
    .style('padding', '1.5rem');

  cardDivs.append('div').attr('class', 'metric-icon')
    .style('width', '56px')
    .style('height', '56px')
    .style('font-size', '1.75rem')
    .style('background', d => `${d.color}15`)
    .text(d => d.icon);

  const cardContent = cardDivs.append('div').attr('class', 'metric-content');
  cardContent.append('div').attr('class', 'metric-title').text(d => d.title);
  cardContent.append('div')
    .attr('class', 'metric-value')
    .style('font-size', '1.875rem')
    .text(d => d.value);
  cardContent.append('div')
    .attr('class', 'metric-subtitle')
    .style('font-size', '0.8125rem')
    .text(d => d.subtitle);
}

function renderGenderChart(container, genderData, total) {
  const section = container.append('div')
    .attr('class', 'chart-card')
    .style('padding', '1.25rem');
  
  const header = section.append('div').attr('class', 'chart-header');
  header.append('h3')
    .style('font-size', '0.95rem')
    .style('margin-bottom', '1rem')
    .text('Gender Distribution');

  const chartDiv = section.append('div')
    .attr('class', 'chart-container')
    .style('min-height', '250px');

  const width = 300, height = 250, margin = 20;
  const radius = Math.min(width, height) / 2 - margin;

  const svg = chartDiv.append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width/2}, ${height/2})`);

  const pie = d3.pie().value(d => d.count).sort(null);
  const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);
  const arcHover = d3.arc().innerRadius(radius * 0.6).outerRadius(radius + 8);

  const tooltip = getTooltip();

  const slices = svg.selectAll('path')
    .data(pie(genderData))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', d => COLORS.gender[d.data.gender])
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseenter', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', arcHover);
      
      tooltip.style('opacity', 1)
        .html(`
          <strong>${d.data.gender}</strong><br/>
          Count: ${d.data.count.toLocaleString()}<br/>
          Percentage: ${d.data.percentage}%
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseleave', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', arc);
      
      tooltip.style('opacity', 0);
    });

  // Center text
  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.3em')
    .style('font-size', '1.5rem')
    .style('font-weight', '700')
    .text(total.toLocaleString());

  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1em')
    .style('font-size', '0.75rem')
    .style('fill', '#718096')
    .text('Patients');

  // Compact legend
  const legend = section.append('div')
    .attr('class', 'chart-legend')
    .style('margin-top', '0.75rem')
    .style('padding-top', '0.75rem');

  genderData.forEach(d => {
    const item = legend.append('div').attr('class', 'legend-item');
    item.append('div').attr('class', 'legend-color')
      .style('background', COLORS.gender[d.gender]);
    item.append('span')
      .style('font-size', '0.75rem')
      .text(`${d.gender}: ${d.percentage}%`);
  });
}

function renderAgeGroupChart(container, ageData, total) {
  const section = container.append('div')
    .attr('class', 'chart-card')
    .style('padding', '1.25rem');
  
  const header = section.append('div').attr('class', 'chart-header');
  header.append('h3')
    .style('font-size', '0.95rem')
    .style('margin-bottom', '1rem')
    .text('Age Group Distribution');

  const chartDiv = section.append('div')
    .attr('class', 'chart-container')
    .style('min-height', '250px');

  const margin = {top: 10, right: 80, bottom: 30, left: 60};
  const width = 350 - margin.left - margin.right;
  const height = 250 - margin.top - margin.bottom;

  const svg = chartDiv.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(ageData, d => d.count)])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(ageData.map(d => d.group))
    .range([0, height])
    .padding(0.25);

  const tooltip = getTooltip();

  svg.selectAll('rect')
    .data(ageData)
    .enter()
    .append('rect')
    .attr('x', 0)
    .attr('y', d => y(d.group))
    .attr('width', d => x(d.count))
    .attr('height', y.bandwidth())
    .attr('fill', d => COLORS.ageGroup[d.group])
    .attr('rx', 4)
    .style('cursor', 'pointer')
    .on('mouseenter', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 0.7);
      
      tooltip.style('opacity', 1)
        .html(`
          <strong>Age Group: ${d.group}</strong><br/>
          Count: ${d.count.toLocaleString()}<br/>
          Percentage: ${d.percentage}%
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseleave', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 1);
      
      tooltip.style('opacity', 0);
    });

  // Value labels
  svg.selectAll('.value-label')
    .data(ageData)
    .enter()
    .append('text')
    .attr('class', 'value-label')
    .attr('x', d => x(d.count) + 5)
    .attr('y', d => y(d.group) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', '0.7rem')
    .style('font-weight', '600')
    .text(d => d.count.toLocaleString());

  // Axes
  svg.append('g')
    .call(d3.axisLeft(y))
    .style('font-size', '0.75rem');

  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(4))
    .style('font-size', '0.7rem');
}

function renderBloodTypeChart(container, bloodData, total) {
  const section = container.append('div')
    .attr('class', 'chart-card')
    .style('padding', '1.25rem');
  
  const header = section.append('div').attr('class', 'chart-header');
  header.append('h3')
    .style('font-size', '0.95rem')
    .style('margin-bottom', '1rem')
    .text('Blood Type Distribution');

  const chartDiv = section.append('div')
    .attr('class', 'chart-container')
    .style('min-height', '250px');

  const margin = {top: 10, right: 15, bottom: 40, left: 45};
  const width = 320 - margin.left - margin.right;
  const height = 250 - margin.top - margin.bottom;

  const svg = chartDiv.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand()
    .domain(bloodData.map(d => d.group))
    .range([0, width])
    .padding(0.2);

  const x1 = d3.scaleBand()
    .domain(['positive', 'negative'])
    .range([0, x0.bandwidth()])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(bloodData, d => Math.max(d.positive, d.negative))])
    .nice()
    .range([height, 0]);

  const tooltip = getTooltip();

  const groups = svg.selectAll('.blood-group')
    .data(bloodData)
    .enter()
    .append('g')
    .attr('class', 'blood-group')
    .attr('transform', d => `translate(${x0(d.group)},0)`);

  // Positive bars
  groups.append('rect')
    .attr('x', x1('positive'))
    .attr('y', d => y(d.positive))
    .attr('width', x1.bandwidth())
    .attr('height', d => height - y(d.positive))
    .attr('fill', d => COLORS.bloodType[d.group])
    .attr('opacity', 0.9)
    .attr('rx', 2)
    .style('cursor', 'pointer')
    .on('mouseenter', function(event, d) {
      d3.select(this).attr('opacity', 0.7);
      tooltip.style('opacity', 1)
        .html(`
          <div style="text-align:center">
            <strong style="font-size:1.1em">${d.group}+</strong><br/>
            <span style="color:#cbd5e1">People:</span> <strong>${d.positive.toLocaleString()}</strong><br/>
            <span style="font-size:0.8em; opacity:0.8">(${((d.positive / total) * 100).toFixed(1)}%)</span>
          </div>
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseleave', function() {
      d3.select(this).attr('opacity', 0.9);
      tooltip.style('opacity', 0);
    });

  // Negative bars
  groups.append('rect')
    .attr('x', x1('negative'))
    .attr('y', d => y(d.negative))
    .attr('width', x1.bandwidth())
    .attr('height', d => height - y(d.negative))
    .attr('fill', d => COLORS.bloodType[d.group])
    .attr('opacity', 0.6)
    .attr('rx', 2)
    .style('cursor', 'pointer')
    .on('mouseenter', function(event, d) {
      d3.select(this).attr('opacity', 0.4);
      tooltip.style('opacity', 1)
        .html(`
          <div style="text-align:center">
            <strong style="font-size:1.1em">${d.group}-</strong><br/>
            <span style="color:#cbd5e1">People:</span> <strong>${d.negative.toLocaleString()}</strong><br/>
            <span style="font-size:0.8em; opacity:0.8">(${((d.negative / total) * 100).toFixed(1)}%)</span>
          </div>
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseleave', function() {
      d3.select(this).attr('opacity', 0.6);
      tooltip.style('opacity', 0);
    });

  // Axes
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x0))
    .style('font-size', '0.75rem');

  svg.append('g')
    .call(d3.axisLeft(y).ticks(4))
    .style('font-size', '0.7rem');

  // Compact legend
  const legend = section.append('div')
    .attr('class', 'chart-legend')
    .style('margin-top', '0.75rem')
    .style('padding-top', '0.75rem');

  [{label: 'Positive (+)', opacity: 0.9}, {label: 'Negative (-)', opacity: 0.6}].forEach(item => {
    const legendItem = legend.append('div').attr('class', 'legend-item');
    legendItem.append('div').attr('class', 'legend-color')
      .style('background', '#718096')
      .style('opacity', item.opacity);
    legendItem.append('span')
      .style('font-size', '0.75rem')
      .text(item.label);
  });
}

function renderAdmissionTypeChart(container, admissionData, total) {
  const section = container.append('div')
    .attr('class', 'chart-card')
    .style('padding', '1.25rem');
  
  const header = section.append('div').attr('class', 'chart-header');
  header.append('h3')
    .style('font-size', '0.95rem')
    .style('margin-bottom', '1rem')
    .text('Admission Type by Age');

  const chartDiv = section.append('div')
    .attr('class', 'chart-container')
    .style('min-height', '250px');

  const margin = {top: 10, right: 100, bottom: 40, left: 60};
  const width = 350 - margin.left - margin.right;
  const height = 250 - margin.top - margin.bottom;

  const svg = chartDiv.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const admissionTypes = ['Emergency', 'Urgent', 'Elective'];
  const stack = d3.stack().keys(admissionTypes);
  const series = stack(admissionData);

  const x = d3.scaleLinear()
    .domain([0, d3.max(series[series.length - 1], d => d[1])])
    .nice()
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(admissionData.map(d => d.ageGroup))
    .range([0, height])
    .padding(0.25);

  const tooltip = getTooltip();

  svg.selectAll('.serie')
    .data(series)
    .enter()
    .append('g')
    .attr('class', 'serie')
    .attr('fill', d => COLORS.admissionType[d.key])
    .selectAll('rect')
    .data(d => d)
    .enter()
    .append('rect')
    .attr('x', d => x(d[0]))
    .attr('y', d => y(d.data.ageGroup))
    .attr('width', d => x(d[1]) - x(d[0]))
    .attr('height', y.bandwidth())
    .attr('rx', 3)
    .style('cursor', 'pointer')
    .on('mouseenter', function(event, d) {
      const type = d3.select(this.parentNode).datum().key;
      const value = d.data[type];
      
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 0.7);
      
      tooltip.style('opacity', 1)
        .html(`
          <strong>${type}</strong><br/>
          Age Group: ${d.data.ageGroup}<br/>
          Count: ${value.toLocaleString()}<br/>
          Percentage: ${((value / total) * 100).toFixed(1)}%
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseleave', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 1);
      
      tooltip.style('opacity', 0);
    });

  // Axes
  svg.append('g')
    .call(d3.axisLeft(y))
    .style('font-size', '0.75rem');

  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(4))
    .style('font-size', '0.7rem');

  // Compact legend
  const legend = section.append('div')
    .attr('class', 'chart-legend')
    .style('margin-top', '0.75rem')
    .style('padding-top', '0.75rem');

  admissionTypes.forEach(type => {
    const item = legend.append('div').attr('class', 'legend-item');
    item.append('div').attr('class', 'legend-color')
      .style('background', COLORS.admissionType[type]);
    item.append('span')
      .style('font-size', '0.75rem')
      .text(type);
  });
}

export function clearDemographicsCache() {
  cachedAggregations = null;
}