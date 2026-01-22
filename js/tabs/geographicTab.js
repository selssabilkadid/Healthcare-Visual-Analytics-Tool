import themeManager from '../utils/themeManager.js';

let mapView = null;
let currentMap = null;

export async function renderGeographicTab(data) {
    const container = d3.select('#geographic-content');
    d3.selectAll('.tab-content').style('display', 'none');
    container.style('display', 'block').selectAll('*').remove();

    // Conteneur principal en Flexbox
    const mainLayout = container.append('div')
        .style('display', 'flex')
        .style('gap', '20px')
        .style('position', 'relative') // Important pour positionner la légende par-dessus
        .style('height', 'calc(100vh - 250px)');

    // Zone de la carte
    mainLayout.append('div')
        .attr('id', 'viewDiv')
        .style('flex', '3') 
        .style('border-radius', '8px');

    // Panneau d'information (Side Panel)
    const infoPanel = mainLayout.append('div')
        .attr('id', 'hospital-info-panel')
        .style('flex', '1')
        .style('background', '#f8fafc')
        .style('padding', '20px')
        .style('border', '1px solid #e2e8f0')
        .style('border-radius', '8px')
        .html(`
            <h3 style="margin-top:0">Sélectionnez un hôpital</h3>
            <p style="color: #64748b">Cliquez sur un point sur la carte pour voir les détails.</p>
        `);

    // RÉINTÉGRATION DE LA LÉGENDE
    createLegend(mainLayout);

    initArcGISMap(data);
}

function createLegend(parent) {
    const isDark = themeManager.isDarkMode();
    
    const legend = parent.append('div')
        .attr('class', 'map-legend')
        .style('position', 'absolute')
        .style('bottom', '20px')
        .style('left', '20px')
        .style('background', 'white')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
        .style('z-index', '100');

    legend.html(`
        <h4 style="margin:0 0 8px 0; font-size:13px; color: ${isDark ? '#F7FAFC' : '#1A202C'};">Facturation Moyenne</h4>
        <div style="display:flex; flex-direction:column; gap:5px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:12px; height:12px; border-radius:50%; background:#FF6B6B;"></div>
                <span style="font-size:11px; color: ${isDark ? '#E2E8F0' : '#4A5568'};"> > 25,000 $</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:12px; height:12px; border-radius:50%; background:#FFA500;"></div>
                <span style="font-size:11px; color: ${isDark ? '#E2E8F0' : '#4A5568'};"> 15,000 - 25,000 $</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:12px; height:12px; border-radius:50%; background:#c1e7ff;"></div>
                <span style="font-size:11px; color: ${isDark ? '#E2E8F0' : '#4A5568'};"> < 15,000 $</span>
            </div>
        </div>
        <p style="margin:8px 0 0 0; font-size:10px; border-top:1px solid ${isDark ? '#4A5568' : '#eee'}; padding-top:5px; color:${isDark ? '#A0AEC0' : '#666'};">
            Taille du point = Nombre de patients
        </p>
    `);
}

function initArcGISMap(data) {
    require(["esri/Map", "esri/views/MapView", "esri/layers/GraphicsLayer", "esri/Graphic"], 
    function(Map, MapView, GraphicsLayer, Graphic) {
        
        const map = new Map({ basemap: "gray-vector" });
        const view = new MapView({
            container: "viewDiv",
            map: map,
            center: [15.0, 50.0],
            zoom: 4,
            popup: {
                dockEnabled: false,
                dockOptions: {
                    buttonEnabled: false,
                    breakpoint: false
                },
                alignment: "auto",
                visibleElements: {
                    closeButton: true
                }
            },
            ui: {
                components: ["attribution", "zoom"]
            }
        });

        // Store view globally
        mapView = view;

        view.when(() => {
            applyPopupTheme(isDark);
        });

        const graphicsLayer = new GraphicsLayer();
        map.add(graphicsLayer);

        const hospitalGroups = d3.group(data, d => d.Hospital);
        
        hospitalGroups.forEach((records, name) => {
            const first = records[0];
            const patientCount = records.length;
            const avgBilling = d3.mean(records, d => +d['Billing Amount']);

            let color = "#c1e7ff"; // Faible (< 15k)
            if (avgBilling > 25000) color = "#FF6B6B"; // Elevé
            else if (avgBilling > 15000) color = "#FFA500"; // Moyen

            const graphic = new Graphic({
                geometry: { type: "point", longitude: +first.Longitude, latitude: +first.Latitude },
                symbol: { 
                    type: "simple-marker", 
                    color: color, 
                    size: Math.min(Math.max(patientCount / 2, 8), 22), // Taille proportionnelle
                    outline: {color: "white", width: 1} 
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
                const results = response.results.filter(r => r.graphic.layer === graphicsLayer);
                if (results.length > 0) {
                    const attr = results[0].graphic.attributes;
                    updateSidePanel(attr);
                }
            });
        });

        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        const filterBtn = node.querySelector('.hospital-filter-btn');
                        if (filterBtn && !filterBtn.dataset.listenerAttached) {
                            attachFilterButtonListener();
                            applyPopupTheme(themeManager.isDarkMode());
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function updateSidePanel(attr) {
    const panel = d3.select('#hospital-info-panel');
    panel.html(`
        <h3 style="color:#4f46e5">${attr.name}</h3>
        <hr style="border:0; border-top:1px solid #e2e8f0; margin:15px 0">
        <p><b>Patients :</b> ${attr.count}</p>
        <p><b>Average Bill :</b> ${attr.billing} $</p>
        <p><b>Dominant Result :</b> ${attr.dominant}</p>
        
        <button id="btn-analyze-hospital" 
                style="width:100%; padding:12px; background:#4f46e5; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; margin-top:20px;">
            ANALYSE 
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
            window.filterManager.showFilterMessage(`Analyse activée pour : ${hospitalName}`);
        }


    }
}