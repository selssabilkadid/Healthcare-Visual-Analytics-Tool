import themeManager from '../utils/themeManager.js';

let mapView = null;

export async function renderGeographicTab(data) {
    const isDark = themeManager.isDarkMode();
    const container = d3.select('#geographic-content');
    
    // UI Setup
    d3.selectAll('.tab-content').style('display', 'none');
    container.style('display', 'block').selectAll('*').remove();

    // Main Layout (Using your CSS variables for colors)
    const mainLayout = container.append('div')
        .style('display', 'flex')
        .style('gap', '20px')
        .style('position', 'relative')
        .style('height', 'calc(100vh - 250px)');

    // Map Container
    mainLayout.append('div')
        .attr('id', 'viewDiv')
        .style('flex', '3') 
        .style('border-radius', 'var(--radius-md)')
        .style('border', '1px solid var(--border-color)')
        .style('overflow', 'hidden');

    // Side Panel (Theme-aware)
    const infoPanel = mainLayout.append('div')
        .attr('id', 'hospital-info-panel')
        .style('flex', '1')
        .style('background', 'var(--bg-card)')
        .style('padding', '20px')
        .style('border', '1px solid var(--border-color)')
        .style('border-radius', 'var(--radius-md)')
        .style('color', 'var(--text-primary)')
        .html(`
            <h3 style="margin-top:0">Select a hospital</h3>
            <p style="color: var(--text-secondary)">Click a point on the map to see more details.</p>
        `);

    createLegend(mainLayout);
    initArcGISMap(data);
}

function createLegend(parent) {
    // Legend Container (Theme-aware)
    const legend = parent.append('div')
        .attr('class', 'map-legend')
        .style('position', 'absolute')
        .style('bottom', '20px')
        .style('left', '20px')
        .style('background', 'var(--bg-card)')
        .style('padding', '12px')
        .style('border-radius', 'var(--radius-sm)')
        .style('border', '1px solid var(--border-color)')
        .style('box-shadow', 'var(--shadow-md)')
        .style('z-index', '10');

    legend.html(`
        <h4 style="margin:0 0 8px 0; font-size:13px; color: var(--text-primary);">Average Billing</h4>
        <div style="display:flex; flex-direction:column; gap:5px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:12px; height:12px; border-radius:50%; background:#FF6B6B;"></div>
                <span style="font-size:11px; color: var(--text-secondary);"> > 25,000 $</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:12px; height:12px; border-radius:50%; background:#FFA500;"></div>
                <span style="font-size:11px; color: var(--text-secondary);"> 15,000 - 25,000 $</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:12px; height:12px; border-radius:50%; background:#4299E1;"></div>
                <span style="font-size:11px; color: var(--text-secondary);"> < 15,000 $</span>
            </div>
        </div>
        <p style="margin:8px 0 0 0; font-size:10px; border-top:1px solid var(--border-color); padding-top:5px; color: var(--text-muted);">
            Point size = Number of patients
        </p>
    `);
}

function initArcGISMap(data) {
    require(["esri/Map", "esri/views/MapView", "esri/layers/GraphicsLayer", "esri/Graphic"], 
    function(Map, MapView, GraphicsLayer, Graphic) {
        
        const isDark = themeManager.isDarkMode();
        
        // Fix: Select basemap based on themeManager
        const map = new Map({ 
            basemap: isDark ? "dark-gray-vector" : "gray-vector" 
        });

        const view = new MapView({
            container: "viewDiv",
            map: map,
            center: [15.0, 50.0],
            zoom: 4,
            popup: {
                dockEnabled: false,
                alignment: "auto"
            },
            ui: { components: ["attribution", "zoom"] }
        });

        mapView = view;

        const graphicsLayer = new GraphicsLayer();
        map.add(graphicsLayer);

        const hospitalGroups = d3.group(data, d => d.Hospital);
        
        hospitalGroups.forEach((records, name) => {
            const first = records[0];
            const patientCount = records.length;
            const avgBilling = d3.mean(records, d => +d['Billing Amount']);

            // Marker Color Logic
            let color = "#4299E1"; 
            if (avgBilling > 25000) color = "#FF6B6B"; 
            else if (avgBilling > 15000) color = "#FFA500"; 

            const graphic = new Graphic({
                geometry: { type: "point", longitude: +first.Longitude, latitude: +first.Latitude },
                symbol: { 
                    type: "simple-marker", 
                    color: color, 
                    size: Math.min(Math.max(patientCount / 2, 8), 22),
                    outline: { 
                        color: isDark ? "#2D3748" : "white", 
                        width: 1 
                    } 
                },
                attributes: { 
                    name: name,
                    count: patientCount,
                    billing: avgBilling.toFixed(0),
                    dominant: Array.from(d3.rollup(records, v => v.length, d => d['Test Results']))
                                   .reduce((a, b) => a[1] > b[1] ? a : b)[0]
                }
            });
            graphicsLayer.add(graphic);
        });

        view.on("click", (event) => {
            view.hitTest(event).then((response) => {
                const results = response.results.filter(r => r.graphic && r.graphic.layer === graphicsLayer);
                if (results.length > 0) {
                    updateSidePanel(results[0].graphic.attributes);
                }
            });
        });
    });
}

function updateSidePanel(attr) {
    const panel = d3.select('#hospital-info-panel');
    panel.html(`
        <h3 style="color:var(--primary); margin-bottom: 5px;">${attr.name}</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 15px;">Healthcare Provider Details</p>
        <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0">
        
        <div style="display:flex; flex-direction:column; gap:12px; color: var(--text-primary);">
            <p><b>Patients:</b> ${attr.count}</p>
            <p><b>Average Billing:</b> <span style="color:var(--success)">$${parseInt(attr.billing).toLocaleString()}</span></p>
            <p><b>Dominant Result:</b> ${attr.dominant}</p>
        </div>
        
        <button id="btn-analyze-hospital" class="btn-primary" 
                style="width:100%; margin-top:25px; justify-content:center; padding: 12px;">
            ANALYZE HOSPITAL
        </button>
    `);

    document.getElementById('btn-analyze-hospital').onclick = () => {
        applyGlobalFilter(attr.name);
    };
}

function applyGlobalFilter(hospitalName) {
    if (window.filterManager) {
        window.filterManager.updateFilter('Hospital', hospitalName); 
        if (window.filterManager.showFilterMessage) {
            window.filterManager.showFilterMessage(`Analysis focused on: ${hospitalName}`);
        }
    }
}