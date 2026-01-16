// demographicsTab.js
// import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const COLORS = {
  gender: { Male: '#6B9BD1', Female: '#E89AC7' },
  ageGroup: { '0-18': '#A8D5BA', '19-40': '#7FB3D5', '41-65': '#9B7EBD', '65+': '#E89B9B' },
  bloodType: { 'A': '#FF6B9D', 'B': '#4ECDC4', 'AB': '#C7A3D9', 'O': '#FFB84D' },
  admissionType: { 'Emergency': '#FF6B6B', 'Urgent': '#FFA500', 'Elective': '#4ECDC4' }
};

// Cache aggregated data to avoid recalculating
let cachedAggregations = null;

// =====================================================================
// Main render function
// =====================================================================
export function renderDemographicsTab(data) {
  const container = d3.select('#demographics-content');

  // Prevent multiple renders on the same container
  if (!container.empty() && !container.selectAll('.demographics-layout').empty()) return;

  container.html(''); // clear old content

  console.time('Demographics Tab Render');

  // Pre-aggregate data (once)
  if (!cachedAggregations) cachedAggregations = aggregateData(data);
  const agg = cachedAggregations;

  const layout = container.append('div').attr('class', 'demographics-layout');

  // Render summary cards
  renderSummaryCards(layout, agg);

  // Chart grid
  const chartsGrid = layout.append('div').attr('class', 'charts-grid-2col');
  const leftCol = chartsGrid.append('div').attr('class', 'chart-column');
  const rightCol = chartsGrid.append('div').attr('class', 'chart-column');

  // Render charts
  renderGenderChart(leftCol, agg.gender);
  renderAgeGroupChart(rightCol, agg.ageGroup);
  renderBloodTypeChart(leftCol, agg.bloodType);
  renderAdmissionTypeChart(rightCol, agg.admission);

  console.timeEnd('Demographics Tab Render');
}

// =====================================================================
// Data aggregation
// =====================================================================
function aggregateData(data) {
  const total = data.length;

  return {
    total,
    avgAge: d3.mean(data, d => +d.Age || 0),

    gender: Array.from(
      d3.rollup(data, v => v.length, d => d.Gender),
      ([key, value]) => ({ gender: key, count: value, percentage: ((value / total) * 100).toFixed(1) })
    ),

    ageGroup: ['0-18', '19-40', '41-65', '65+'].map(group => {
      const count = data.filter(d => d['Age Group'] === group).length;
      return { group, count, percentage: ((count / total) * 100).toFixed(1) };
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

// =====================================================================
// Summary Cards
// =====================================================================
function renderSummaryCards(container, agg) {
  const malePercent = agg.gender.find(g => g.gender === 'Male')?.percentage || 50;

  const cards = [
    { title: 'Total Patients', value: agg.total.toLocaleString(), subtitle: 'Active Records', icon: '👥', color: '#667EEA' },
    { title: 'Gender Split', value: `${malePercent}% / ${(100 - malePercent).toFixed(1)}%`, subtitle: 'Male / Female', icon: '⚥', color: '#E89AC7' },
    { title: 'Average Age', value: agg.avgAge.toFixed(1), subtitle: 'Years', icon: '🎂', color: '#9B7EBD' }
  ];

  const cardContainer = container.append('div').attr('class', 'summary-cards-row');
  const cardDivs = cardContainer.selectAll('.metric-card')
    .data(cards).enter().append('div').attr('class', 'metric-card');

  cardDivs.append('div').attr('class', 'metric-icon').style('background', d => `${d.color}15`).text(d => d.icon);

  const cardContent = cardDivs.append('div').attr('class', 'metric-content');
  cardContent.append('div').attr('class', 'metric-title').text(d => d.title);
  cardContent.append('div').attr('class', 'metric-value').text(d => d.value);
  cardContent.append('div').attr('class', 'metric-subtitle').text(d => d.subtitle);
}

// =====================================================================
// Charts
// =====================================================================
function renderGenderChart(container, data) {
  container.selectAll('*').remove(); // clear old charts

  container.append('h3').text('Gender Distribution');

  const width = 300, height = 300, margin = 20;
  const radius = Math.min(width, height) / 2 - margin;

  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width/2},${height/2})`);

  const pie = d3.pie().value(d => d.count);
  const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);

  svg.selectAll('path').data(pie(data)).enter().append('path')
    .attr('d', arc)
    .attr('fill', d => COLORS.gender[d.data.gender])
    .attr('stroke', 'white').attr('stroke-width', 2);
}

function renderAgeGroupChart(container, data) {
  container.selectAll('*').remove();
  container.append('h3').text('Age Group Distribution');

  const margin = {top: 20, right: 20, bottom: 30, left: 50};
  const width = 300 - margin.left - margin.right;
  const height = 250 - margin.top - margin.bottom;

  const svg = container.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).range([0, width]);
  const y = d3.scaleBand().domain(data.map(d => d.group)).range([0, height]).padding(0.3);

  svg.selectAll('rect').data(data).enter().append('rect')
    .attr('x', 0)
    .attr('y', d => y(d.group))
    .attr('width', d => x(d.count))
    .attr('height', y.bandwidth())
    .attr('fill', d => COLORS.ageGroup[d.group]);
}

// Render Blood Type and Admission Type charts similarly...
// Clear container first, use classes instead of fixed IDs

// =====================================================================
// Clear cached aggregations if needed
// =====================================================================
export function clearDemographicsCache() {
  cachedAggregations = null;
}
