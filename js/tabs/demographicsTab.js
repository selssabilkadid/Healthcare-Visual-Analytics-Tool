//import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const COLORS = {
  gender: { Male: '#6B9BD1', Female: '#E89AC7' },
  ageGroup: { '0-18': '#A8D5BA', '19-40': '#7FB3D5', '41-65': '#9B7EBD', '65+': '#E89B9B' },
  bloodType: { 'A': '#FF6B9D', 'B': '#4ECDC4', 'AB': '#C7A3D9', 'O': '#FFB84D' },
  admissionType: { 'Emergency': '#FF6B6B', 'Urgent': '#FFA500', 'Elective': '#4ECDC4' }
};

// Cache aggregated data to avoid recalculating
let cachedAggregations = null;

export function renderDemographicsTab(data) {
  console.time('Demographics Tab Render');
  
  const container = d3.select('#demographics-content');
  container.html('');

  // Pre-aggregate data ONCE (cache it)
  if (!cachedAggregations) {
    console.time('Data Aggregation');
    cachedAggregations = aggregateData(data);
    console.timeEnd('Data Aggregation');
  }

  const agg = cachedAggregations;

  // Create layout
  const layout = container.append('div').attr('class', 'demographics-layout');

  // Render components using aggregated data
  renderSummaryCards(layout, agg);
  
  const chartsGrid = layout.append('div').attr('class', 'charts-grid-2col');
  const leftCol = chartsGrid.append('div').attr('class', 'chart-column');
  const rightCol = chartsGrid.append('div').attr('class', 'chart-column');

  // Use requestAnimationFrame for smooth rendering
  requestAnimationFrame(() => {
    renderGenderChart(leftCol, agg.gender);
    renderAgeGroupChart(rightCol, agg.ageGroup);
  });

  requestAnimationFrame(() => {
    renderBloodTypeChart(leftCol, agg.bloodType);
    renderAdmissionTypeChart(rightCol, agg.admission);
  });

  console.timeEnd('Demographics Tab Render');
}

// Pre-aggregate all data at once (FAST)
function aggregateData(data) {
  const total = data.length;
  
  return {
    total: total,
    avgAge: d3.mean(data, d => d.Age),
    
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
      return { group, positive, negative };
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

function renderSummaryCards(container, agg) {
  const malePercent = agg.gender.find(g => g.gender === 'Male')?.percentage || 50;
  
  const cards = [
    { 
      title: 'Total Patients', 
      value: agg.total.toLocaleString(), 
      subtitle: 'Active Records',
      icon: '👥',
      color: '#667EEA'
    },
    { 
      title: 'Gender Split', 
      value: `${malePercent}% / ${(100 - malePercent).toFixed(1)}%`,
      subtitle: 'Male / Female',
      icon: '⚥',
      color: '#E89AC7'
    },
    { 
      title: 'Average Age', 
      value: agg.avgAge.toFixed(1),
      subtitle: 'Years',
      icon: '🎂',
      color: '#9B7EBD'
    }
  ];

  const cardContainer = container.append('div').attr('class', 'summary-cards-row');
  const cardDivs = cardContainer.selectAll('.metric-card')
    .data(cards).enter().append('div').attr('class', 'metric-card');

  cardDivs.append('div').attr('class', 'metric-icon')
    .style('background', d => `${d.color}15`).text(d => d.icon);

  const cardContent = cardDivs.append('div').attr('class', 'metric-content');
  cardContent.append('div').attr('class', 'metric-title').text(d => d.title);
  cardContent.append('div').attr('class', 'metric-value').text(d => d.value);
  cardContent.append('div').attr('class', 'metric-subtitle').text(d => d.subtitle);
}

function renderGenderChart(container, genderData) {
  const section = container.append('div').attr('class', 'chart-section');
  section.append('h3').text('Gender Distribution');
  const chartDiv = section.append('div').attr('class', 'chart-container').attr('id', 'gender-chart');

  const width = 400, height = 350, margin = 40;
  const radius = Math.min(width, height) / 2 - margin;

  const svg = d3.select('#gender-chart').append('svg')
    .attr('width', width).attr('height', height)
    .append('g').attr('transform', `translate(${width/2}, ${height/2})`);

  const pie = d3.pie().value(d => d.count).sort(null);
  const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);
  const arcHover = d3.arc().innerRadius(radius * 0.6).outerRadius(radius + 10);

  svg.selectAll('path').data(pie(genderData)).enter().append('path')
    .attr('d', arc)
    .attr('fill', d => COLORS.gender[d.data.gender])
    .attr('stroke', 'white').attr('stroke-width', 3)
    .on('mouseenter', function(event, d) {
      d3.select(this).transition().duration(200).attr('d', arcHover);
    })
    .on('mouseleave', function() {
      d3.select(this).transition().duration(200).attr('d', arc);
    });

  svg.append('text').attr('text-anchor', 'middle').attr('dy', '-0.5em')
    .style('font-size', '2rem').style('font-weight', '700')
    .text(genderData.reduce((sum, d) => sum + d.count, 0).toLocaleString());

  svg.append('text').attr('text-anchor', 'middle').attr('dy', '1.2em')
    .style('font-size', '0.875rem').style('fill', '#718096').text('Patients');

  const legend = section.append('div').attr('class', 'chart-legend');
  genderData.forEach(d => {
    const item = legend.append('div').attr('class', 'legend-item');
    item.append('div').attr('class', 'legend-color')
      .style('background', COLORS.gender[d.gender]);
    item.append('span').text(`${d.gender}: ${d.percentage}%`);
  });
}

function renderAgeGroupChart(container, ageData) {
  const section = container.append('div').attr('class', 'chart-section');
  section.append('h3').text('Age Group Distribution');
  const chartDiv = section.append('div').attr('class', 'chart-container').attr('id', 'age-group-chart');

  const margin = {top: 20, right: 100, bottom: 40, left: 80};
  const width = 450 - margin.left - margin.right;
  const height = 350 - margin.top - margin.bottom;

  const svg = d3.select('#age-group-chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(ageData, d => d.count)]).range([0, width]);

  const y = d3.scaleBand()
    .domain(ageData.map(d => d.group)).range([0, height]).padding(0.3);

  svg.selectAll('rect').data(ageData).enter().append('rect')
    .attr('x', 0).attr('y', d => y(d.group))
    .attr('width', d => x(d.count)).attr('height', y.bandwidth())
    .attr('fill', d => COLORS.ageGroup[d.group]).attr('rx', 6);

  svg.selectAll('.value-label').data(ageData).enter().append('text')
    .attr('class', 'value-label')
    .attr('x', d => x(d.count) + 10)
    .attr('y', d => y(d.group) + y.bandwidth() / 2)
    .attr('dy', '0.35em').style('font-size', '0.875rem').style('font-weight', '600')
    .text(d => `${d.count.toLocaleString()} (${d.percentage}%)`);

  svg.append('g').call(d3.axisLeft(y)).style('font-size', '0.875rem');
  svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(5));
}

function renderBloodTypeChart(container, bloodData) {
  const section = container.append('div').attr('class', 'chart-section');
  section.append('h3').text('Blood Type Distribution');
  const chartDiv = section.append('div').attr('class', 'chart-container').attr('id', 'blood-type-chart');

  const margin = {top: 20, right: 20, bottom: 60, left: 60};
  const width = 400 - margin.left - margin.right;
  const height = 350 - margin.top - margin.bottom;

  const svg = d3.select('#blood-type-chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand().domain(bloodData.map(d => d.group)).range([0, width]).padding(0.2);
  const x1 = d3.scaleBand().domain(['positive', 'negative']).range([0, x0.bandwidth()]).padding(0.1);
  const y = d3.scaleLinear()
    .domain([0, d3.max(bloodData, d => Math.max(d.positive, d.negative))]).nice().range([height, 0]);

  const groups = svg.selectAll('.blood-group').data(bloodData).enter().append('g')
    .attr('class', 'blood-group').attr('transform', d => `translate(${x0(d.group)},0)`);

  groups.append('rect')
    .attr('x', x1('positive')).attr('y', d => y(d.positive))
    .attr('width', x1.bandwidth()).attr('height', d => height - y(d.positive))
    .attr('fill', d => COLORS.bloodType[d.group]).attr('opacity', 0.9).attr('rx', 3);

  groups.append('rect')
    .attr('x', x1('negative')).attr('y', d => y(d.negative))
    .attr('width', x1.bandwidth()).attr('height', d => height - y(d.negative))
    .attr('fill', d => COLORS.bloodType[d.group]).attr('opacity', 0.6).attr('rx', 3);

  svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x0));
  svg.append('g').call(d3.axisLeft(y).ticks(5));

  const legend = section.append('div').attr('class', 'chart-legend');
  [{label: 'Positive (+)', opacity: 0.9}, {label: 'Negative (-)', opacity: 0.6}].forEach(item => {
    const legendItem = legend.append('div').attr('class', 'legend-item');
    legendItem.append('div').attr('class', 'legend-color')
      .style('background', '#718096').style('opacity', item.opacity);
    legendItem.append('span').text(item.label);
  });
}

function renderAdmissionTypeChart(container, admissionData) {
  const section = container.append('div').attr('class', 'chart-section');
  section.append('h3').text('Admission Type by Age Group');
  const chartDiv = section.append('div').attr('class', 'chart-container').attr('id', 'admission-type-chart');

  const margin = {top: 20, right: 120, bottom: 60, left: 80};
  const width = 450 - margin.left - margin.right;
  const height = 350 - margin.top - margin.bottom;

  const svg = d3.select('#admission-type-chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const admissionTypes = ['Emergency', 'Urgent', 'Elective'];
  const stack = d3.stack().keys(admissionTypes);
  const series = stack(admissionData);

  const x = d3.scaleLinear()
    .domain([0, d3.max(series[series.length - 1], d => d[1])]).nice().range([0, width]);
  const y = d3.scaleBand()
    .domain(admissionData.map(d => d.ageGroup)).range([0, height]).padding(0.3);

  svg.selectAll('.serie').data(series).enter().append('g')
    .attr('class', 'serie').attr('fill', d => COLORS.admissionType[d.key])
    .selectAll('rect').data(d => d).enter().append('rect')
    .attr('x', d => x(d[0])).attr('y', d => y(d.data.ageGroup))
    .attr('width', d => x(d[1]) - x(d[0])).attr('height', y.bandwidth()).attr('rx', 4);

  svg.append('g').call(d3.axisLeft(y));
  svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(5));

  const legend = section.append('div').attr('class', 'chart-legend');
  admissionTypes.forEach(type => {
    const item = legend.append('div').attr('class', 'legend-item');
    item.append('div').attr('class', 'legend-color').style('background', COLORS.admissionType[type]);
    item.append('span').text(type);
  });
}

// Clear cache when needed
export function clearDemographicsCache() {
  cachedAggregations = null;
}