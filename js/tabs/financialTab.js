// js/tabs/demographicsTab.js - Enhanced with tooltips and fluid layout

const COLORS = {
  insurance: {
    'Aetna': '#667EEA', 'Blue Cross': '#4ECDC4', 'Cigna': '#9B7EBD',
    'Medicare': '#FFA500', 'UnitedHealthcare': '#FF6B6B'
  },
  years: {
    '2020': '#FF6B6B', '2021': '#4ECDC4', '2022': '#9B7EBD',
    '2023': '#FFA500', '2024': '#667EEA', '2025': '#E89B9B'
  }
};
let cachedAggregations = null;

export function renderFinancialTab(data) {
  console.time('Financial Tab Render');
  
  const container = d3.select('#financial-content');
  container.html('');

  // Clear cache and re-aggregate for filtered data
  cachedAggregations = aggregateData(data);

  const agg = cachedAggregations;

  // Create layout - REMOVED fixed height and overflow to prevent internal scrolling
  const layout = container.append('div')
    .attr('class', 'financial-layout-compact')
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
  renderCostDistribution(chartsGrid, agg);
  renderInsuranceCostAnalysis(chartsGrid, agg);
  renderAnnualBillingTrend(chartsGrid, agg);
  renderAnnual(chartsGrid, agg);
  console.timeEnd('Financial Tab Render');
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
  const uniquePatients = new Set(data.map(d => d.Name)).size;
  const normalBills = data.filter(d => d['Type of Bill'] === 'Normal');
  const refundBills = data.filter(d => d['Type of Bill'] === 'Refund');
  
  const totalRevenue = d3.sum(normalBills, d => d['Billing Amount']);
  const totalRefunds = d3.sum(refundBills, d => d['Billing Amount']);
  const avgLengthOfStay = d3.mean(data, d => d['Length of Stay'] || 0);
  const avgCost = d3.mean(data, d => d['Billing Amount']);
  
  const costBins = [0, 1000, 5000, 10000, 20000, 50000, 100000];
  const costDistribution = costBins.slice(0, -1).map((bin, i) => {
    const nextBin = costBins[i + 1];
    const count = data.filter(d => d['Billing Amount'] >= bin && d['Billing Amount'] < nextBin).length;
    return {
      range: `${bin.toLocaleString()} - ${nextBin.toLocaleString()}`,
      count,
      percentage: ((count / total) * 100).toFixed(1)
    };
  });

  const insuranceGroups = d3.group(data, d => d['Insurance Provider']);
  const insuranceAnalysis = Array.from(insuranceGroups, ([provider, records]) => {
    return {
      provider,
      avgAmount: d3.mean(records, d => d['Billing Amount']),
      totalAmount: d3.sum(records, d => d['Billing Amount']),
      patientCount: records.length,
      refundCount: records.filter(d => d['Type of Bill'] === 'Refund').length,
      refundPercentage: ((records.filter(d => d['Type of Bill'] === 'Refund').length / records.length) * 100).toFixed(1)
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  const annualTrend = {};
  data.forEach(d => {
    const date = new Date(d['Date of Admission']);
    const year = date.getFullYear();
    const month = date.getMonth();
    if (!annualTrend[year]) annualTrend[year] = Array(12).fill(0);
    annualTrend[year][month] += d['Billing Amount'];
  });

  const countryData = d3.rollup(data, v => d3.sum(v, d => d['Billing Amount']), d => d.Country, d => new Date(d['Date of Admission']).getFullYear());
  const annualByCountry = {};
  Array.from(countryData).forEach(([country, yearData]) => {
    Array.from(yearData).forEach(([year, amount]) => {
      if (!annualByCountry[year]) annualByCountry[year] = [];
      annualByCountry[year].push({ country, amount });
    });
  });

  return {
    kpis: { totalRevenue, totalRefunds, totalPatients: total, distinctPatients: uniquePatients, avgLengthOfStay, avgCost, normalBillCount: normalBills.length, refundBillCount: refundBills.length },
    costDistribution, insuranceAnalysis, annualTrend, annualByCountry
  };
}


function renderSummaryCards(container, agg, data) {
  const  kpi = agg.kpis;
  
  const cards = [
    { title: 'Total Revenue', value: `$${kpi.totalRevenue.toLocaleString()}`, subtitle: 'Normal Bills', icon: '💰', color: '#667EEA' },
    { title: 'Total Refunds', value: `$${kpi.totalRefunds.toLocaleString()}`, subtitle: 'Reimbursements', icon: '🔄', color: '#FF6B6B' },
    { title: 'Total Patients', value: kpi.totalPatients.toLocaleString(), subtitle: `${kpi.distinctPatients.toLocaleString()} unique`, icon: '👥', color: '#4ECDC4' },
    { title: 'Avg Length of Stay', value: kpi.avgLengthOfStay.toFixed(1), subtitle: 'Days', icon: '🏥', color: '#9B7EBD' },
    { title: 'Avg Cost per Visit', value: `$${kpi.avgCost.toFixed(0)}`, subtitle: 'Per patient', icon: '💳', color: '#FFA500' },
    { title: 'Bill Types', value: `${kpi.normalBillCount.toLocaleString()} / ${kpi.refundBillCount}`, subtitle: 'Normal / Refund', icon: '📊', color: '#E89AC7' }
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

function renderCostDistribution(container, agg) {
  // Utilisation de la classe chart-card pour l'unité visuelle
  const section = container.append('div')
    .attr('class', 'chart-card')
    .style('padding', '1.25rem');
  
  const header = section.append('div').attr('class', 'chart-header');
  header.append('h3')
    .style('font-size', '0.95rem')
    .style('margin-bottom', '0.25rem')
    .style('color', '#1e293b')
    .text('Cost Distribution');
  header.append('p')
    .style('font-size', '0.8rem')
    .style('color', '#64748b')
    .style('margin-bottom', '1rem')
    .text('Patient volume by billing range');

  const chartDiv = section.append('div')
    .attr('class', 'chart-container')
    .style('min-height', '280px'); // Aligné sur la carte Insurance

  // Marges optimisées pour agrandir la zone de dessin
  const margin = { top: 10, right: 15, bottom: 55, left: 45 };
  const width = 380 - margin.left - margin.right; 
  const height = 280 - margin.top - margin.bottom;

  const svg = chartDiv.append('svg')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('width', '100%')
    .attr('height', '100%')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const data = agg.costDistribution;
  const tooltip = getTooltip();

  // Scales
  const x = d3.scaleBand()
    .domain(data.map(d => d.range))
    .range([0, width])
    .padding(0.3); // Barres légèrement plus fines pour un look élégant

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count)]).nice()
    .range([height, 0]);

  // Échelle de couleur (Orange Admission -> Female Pink)
  const colorScale = d3.scaleLinear()
    .domain([0, data.length - 1])
    .range(['#FFA500', '#E89AC7']);

  // Grille horizontale subtile
  svg.append('g')
    .attr('class', 'grid')
    .style('color', '#f1f5f9') 
    .call(d3.axisLeft(y).tickSize(-width).tickFormat('').ticks(5))
    .call(g => g.select('.domain').remove());

  // --- Barres ---
  const bars = svg.selectAll('.cost-bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'cost-bar')
    .attr('x', d => x(d.range))
    .attr('width', x.bandwidth())
    .attr('fill', (d, i) => colorScale(i))
    .attr('rx', 4) // Coins arrondis style "pilule"
    .attr('y', height)
    .attr('height', 0);

  // Animation fluide
  bars.transition()
    .duration(800)
    .delay((d, i) => i * 50)
    .attr('y', d => y(d.count))
    .attr('height', d => height - y(d.count));

  // Interactivité
  bars.on('mouseenter', function(event, d) {
      d3.select(this).transition().duration(200).attr('filter', 'brightness(0.9)');
      
      tooltip.style('opacity', 1)
        .html(`
          <div style="text-align:center">
            <strong style="font-size:1.1em">${d.range}</strong><br/>
            <span style="color:#cbd5e1">Patients:</span> <strong>${d.count.toLocaleString()}</strong><br/>
            <span style="color:#4ECDC4; font-weight:600">${d.percentage}%</span>
          </div>
        `);
    })
    .on('mousemove', (event) => {
      tooltip.style('left', (event.pageX + 10) + 'px')
             .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseleave', function() {
      d3.select(this).transition().duration(200).attr('filter', null);
      tooltip.style('opacity', 0);
    });

  // --- Axes ---
  const xAxis = svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));
    
  xAxis.selectAll('text')
    .style('color', '#64748b')
    .attr('transform', 'rotate(-40)') // Rotation un peu plus forte pour l'espace
    .style('text-anchor', 'end')
    .style('font-size', '0.7rem')
    .style('font-weight', '500');

  xAxis.select('.domain').style('stroke', '#e2e8f0');
  xAxis.selectAll('.tick line').remove();

  const yAxis = svg.append('g').call(d3.axisLeft(y).ticks(5));
  yAxis.select('.domain').remove();
  yAxis.selectAll('text').style('color', '#94a3b8').style('font-size', '0.7rem');
}
function renderInsuranceCostAnalysis(container, agg) {
  const section = container.append('div')
    .attr('class', 'chart-card')
    .style('padding', '1.25rem');
  
  const header = section.append('div').attr('class', 'chart-header');
  header.append('h3')
    .style('font-size', '0.95rem')
    .style('margin-bottom', '1rem')
    .text('Insurance Provider Performance');

  const chartDiv = section.append('div')
    .attr('class', 'chart-container')
    .style('min-height', '280px'); // Augmenté pour donner plus d'espace vertical

  // MARGES OPTIMISÉES : on réduit pour gagner de la place
  const margin = {top: 5, right: 45, bottom: 25, left: 85};
  const width = 380 - margin.left - margin.right; // Largeur augmentée
  const height = 280 - margin.top - margin.bottom; // Hauteur augmentée

  const svg = chartDiv.append('svg')
    // Utilisation de viewBox pour que le graphique soit responsive et plus grand
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('width', '80%')
    .attr('height', '100%')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const data = [...agg.insuranceAnalysis].sort((a, b) => b.totalAmount - a.totalAmount);
  const tooltip = getTooltip();

  const y = d3.scaleBand()
    .domain(data.map(d => d.provider))
    .range([0, height])
    .padding(0.25); // Un peu moins de padding pour des barres plus épaisses

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.totalAmount)])
    .range([0, width]);

  // Barres
  svg.selectAll('.insurance-bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('y', d => y(d.provider))
    .attr('x', 0)
    .attr('height', y.bandwidth())
    .attr('width', d => x(d.totalAmount))
    .attr('fill', d => COLORS.insurance[d.provider] || '#667EEA')
    .attr('opacity', 0.9)
    .attr('rx', 3) // Arrondi légèrement plus prononcé car les barres sont plus grandes
    .style('cursor', 'pointer')
    .on('mouseenter', function(event, d) {
      d3.select(this).attr('opacity', 0.7);
      tooltip.style('opacity', 1)
        .html(`
          <div style="text-align:center">
            <strong>${d.provider}</strong><br/>
            <span>Total:</span> <strong>$${(d.totalAmount/1000).toFixed(1)}k</strong>
          </div>
        `);
    })
    .on('mousemove', (event) => {
      tooltip.style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseleave', function() {
      d3.select(this).attr('opacity', 0.9);
      tooltip.style('opacity', 0);
    });

  // Axe Y (Noms) - On augmente un peu la police
  svg.append('g')
    .call(d3.axisLeft(y).tickSize(0))
    .style('font-size', '0.8rem')
    .call(g => g.select('.domain').remove())
    .selectAll('text')
    .style('color', '#334155')
    .style('font-weight', '500');

  // Labels de valeurs (Agrandis et plus lisibles)
  svg.selectAll('.bar-label')
    .data(data)
    .enter()
    .append('text')
    .attr('x', d => x(d.totalAmount) + 8)
    .attr('y', d => y(d.provider) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', '0.75rem')
    .style('font-weight', '700')
    .style('fill', '#64748b')
    .text(d => `$${(d.totalAmount / 1000).toFixed(0)}k`);
}
function renderAnnualBillingTrend(container, agg) {
  const section = container.append('div')
    .attr('class', 'chart-card')
    .style('padding', '1rem')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('height', '100%'); // Force la section à prendre toute la hauteur flex
  
  const header = section.append('div').attr('class', 'chart-header');
  header.append('h3').text('Annual Billing Comparison').style('font-size', '0.95rem');

  const chartDiv = section.append('div').attr('class', 'chart-container').style('min-height', '280px')    .style('flex-grow', '1'); // Le graphique "pousse" pour remplir l'espace vide


  const margin = { top: 30, right: 30, bottom: 40, left: 55 };
  const width = 480 - margin.left - margin.right;
  const height = 280 - margin.top - margin.bottom;

  const svg = chartDiv.append('svg')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('width', '100%')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Object.keys(agg.annualTrend).sort();
  const maxValue = d3.max(years.flatMap(y => agg.annualTrend[y])) || 0;

  const x = d3.scalePoint().domain(months).range([0, width]);
  const y = d3.scaleLinear().domain([0, maxValue * 1.1]).range([height, 0]);
  const colorPalette = d3.scaleOrdinal().domain(years).range(d3.schemeTableau10);

  const tooltip = getTooltip();

  // Axes et Grille
  svg.append('g').style('color', '#f1f5f9').call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat('')).call(g => g.select('.domain').remove());
  svg.append('g').style('color', '#94a3b8').style('font-size', '0.7rem').call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d/1000000}M`).tickSize(0)).call(g => g.select('.domain').remove());

  // Dessin des courbes
  years.forEach((year) => {
    const data = agg.annualTrend[year];
    const color = colorPalette(year);
    const line = d3.line().x((d, i) => x(months[i])).y(d => y(d)).curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2.5)
      .attr('d', line);
  });

  // --- INTERACTIVITÉ AVANCÉE : OVERLAY POUR LE HOVER ---
  
  // Ligne verticale de focus
  const focusLine = svg.append('line')
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', '#cbd5e1')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .style('opacity', 0);

  // Overlay invisible pour capturer les mouvements de souris sur toute la zone
  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('mousemove', function(event) {
      // Trouver le mois le plus proche de la souris
      const [mouseX] = d3.pointer(event);
      const index = Math.round((mouseX / width) * (months.length - 1));
      const currentMonth = months[index];
      const xPos = x(currentMonth);

      focusLine.attr('x1', xPos).attr('x2', xPos).style('opacity', 1);

      // Préparer le contenu du tooltip avec toutes les années pour ce mois
      let tooltipHtml = `<div style="font-weight:bold; margin-bottom:8px; border-bottom:1px solid #eee;">${currentMonth} Comparison</div>`;
      
      years.forEach(year => {
        const val = agg.annualTrend[year][index];
        tooltipHtml += `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:15px; margin-bottom:3px;">
            <span style="display:flex; align-items:center; gap:5px;">
              <div style="width:8px; height:8px; border-radius:50%; background:${colorPalette(year)}"></div>
              <span style="font-size:0.8rem">${year}:</span>
            </span>
            <strong style="font-size:0.85rem">$${(val/1000000).toFixed(2)}M</strong>
          </div>`;
      });

      tooltip.style('opacity', 1)
        .html(tooltipHtml)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 20) + 'px');
    })
    .on('mouseleave', () => {
      focusLine.style('opacity', 0);
      tooltip.style('opacity', 0);
    });

  // Axe X
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSize(0))
    .call(g => g.select('.domain').style('stroke', '#f1f5f9'))
    .selectAll('text').style('font-size', '0.75rem').style('fill', '#94a3b8').attr('dy', '15px');

  // Légende simple en bas (sans répétition de détails pour garder le Data-Ink ratio bas)
  const legend = section.append('div').style('display', 'flex').style('justify-content', 'center').style('gap', '15px').style('margin-top', '15px');
  years.forEach(year => {
    const item = legend.append('div').style('display', 'flex').style('align-items', 'center').style('gap', '5px');
    item.append('div').style('width', '10px').style('height', '10px').style('border-radius', '50%').style('background', colorPalette(year));
    item.append('span').style('font-size', '0.75rem').text(year);
  });
}

function renderAnnual(container, agg) {
  const section = container.append('div')
    .attr('class', 'chart-card')
    .style('padding', '1.5rem')
    .style('margin-bottom', '1.5rem')
    .style('box-sizing', 'border-box')
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('height', '100%'); // Alignement vertical avec l'autre carte
  
  const header = section.append('div').attr('class', 'chart-header');
  header.append('h3').text('Annual Billing by Country')
    .style('font-size', '1.2rem')
    .style('margin-bottom', '0.5rem');
  header.append('p')
    .style('font-size', '0.9rem')
    .style('color', '#64748b')
    .style('margin-bottom', '1.5rem')
    .text('Detailed revenue distribution across all geographic regions ');

  const chartDiv = section.append('div')
    .attr('class', 'chart-container')
    .style('width', '100%')
    .style('min-height', '450px') 
    .style('flex-grow', '1'); 

  const containerWidth = chartDiv.node().getBoundingClientRect().width || 1000;
  
  const margin = { top: 30, right: 30, bottom: 80, left: 65 };
  const width = containerWidth - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;

  const svg = chartDiv.append('svg')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('width', '100%')
    .attr('height', '100%')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const tooltip = getTooltip();
  const years = Object.keys(agg.annualByCountry).sort();
  const countries = [...new Set(years.flatMap(year => 
    agg.annualByCountry[year].map(d => d.country)
  ))].sort();

  // --- CONFIGURATION DES COULEURS PERSONNALISÉES ---
  const customColors = {
    '2020': '#FF6B6B', '2021': '#4ECDC4', '2022': '#9B7EBD',
    '2023': '#FFA500', '2024': '#667EEA', '2025': '#E89B9B'
  };

  const color = d3.scaleOrdinal()
    .domain(Object.keys(customColors))
    .range(Object.values(customColors));

  // Scales
  const x0 = d3.scaleBand().domain(countries).range([0, width]).paddingInner(0.15);
  const x1 = d3.scaleBand().domain(years).range([0, x0.bandwidth()]).padding(0.05);
  const y = d3.scaleLinear()
    .domain([0, d3.max(years.flatMap(year => agg.annualByCountry[year].map(d => d.amount)))])
    .nice().range([height, 0]);

  // Grille
  svg.append('g').style('color', '#f1f5f9')
    .call(d3.axisLeft(y).ticks(8).tickSize(-width).tickFormat(''))
    .call(g => g.select('.domain').remove());

  // Tracé des barres
  const countryGroups = svg.selectAll('.country-group')
    .data(countries).enter().append('g')
    .attr('transform', d => `translate(${x0(d)},0)`);

  years.forEach((year) => {
    countryGroups.append('rect')
      .attr('x', x1(year))
      .attr('y', d => {
        const entry = agg.annualByCountry[year]?.find(item => item.country === d);
        return y(entry?.amount || 0);
      })
      .attr('width', x1.bandwidth())
      .attr('height', d => {
        const entry = agg.annualByCountry[year]?.find(item => item.country === d);
        return height - y(entry?.amount || 0);
      })
      .attr('fill', color(year))
      .attr('rx', 2)
      .on('mouseenter', function(event, d) {
        const entry = agg.annualByCountry[year]?.find(item => item.country === d);
        d3.select(this).attr('filter', 'brightness(0.9)');
        tooltip.style('opacity', 1).html(`
          <div style="font-weight:bold; border-bottom:1px solid #eee; margin-bottom:5px;">${d}</div>
          <span style="color:${color(year)}">●</span> ${year}: <strong>$${(entry?.amount || 0).toLocaleString()}</strong>
        `);
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 25) + 'px');
      })
      .on('mouseleave', function() {
        d3.select(this).attr('filter', null);
        tooltip.style('opacity', 0);
      });
  });

  // Axes
  svg.append('g').attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x0).tickSize(5))
    .selectAll('text').style('text-anchor', 'end')
    .attr('dx', '-.8em').attr('dy', '.15em').attr('transform', 'rotate(-45)')
    .style('font-size', '0.75rem').style('fill', '#475569');

  svg.append('g').call(d3.axisLeft(y).ticks(8).tickFormat(d => `$${d/1000}k`).tickSize(0))
    .call(g => g.select('.domain').remove())
    .selectAll('text').style('font-size', '0.75rem').style('fill', '#94a3b8');

  // Légende
  const legend = svg.append('g')
    .attr('transform', `translate(${width - (years.length * 70)}, -20)`);

  years.forEach((year, i) => {
    const legendItem = legend.append('g').attr('transform', `translate(${i * 70}, 0)`);
    legendItem.append('rect').attr('width', 10).attr('height', 10).attr('rx', 2).attr('fill', color(year));
    legendItem.append('text').attr('x', 15).attr('y', 10).style('font-size', '0.75rem').style('fill', '#64748b').text(year);
  });
}
export function clearFinancialCache() {
  cachedAggregations = null;
}