import themeManager from '../utils/themeManager.js';

let mapView = null;
let currentMap = null;

export async function renderGeographicTab(data) {
    const container = d3.select('#geographic-content');
    d3.selectAll('.tab-content').style('display', 'none');
    container.style('display', 'block').selectAll('*').remove();

    const geoLayout = container.append('div')
        .attr('class', 'chart-card')
        .style('height', 'calc(100vh - 250px)')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('padding', '0')
        .style('position', 'relative');

    geoLayout.append('div')
        .attr('id', 'viewDiv')
        .style('flex-grow', '1')
        .style('width', '100%')
        .style('position', 'relative')
        .style('z-index', '1'); // Ensure map is below popup

    createLegend(container);

    setTimeout(() => initArcGISMap(data), 150);
}

function createLegend(parent) {
    const isDark = themeManager.isDarkMode();
    
    const legend = parent.append('div')
        .attr('class', 'map-legend')
        .style('position', 'absolute')
        .style('bottom', '40px')
        .style('left', '40px')
        .style('background', isDark ? '#2D3748' : 'white')
        .style('color', isDark ? '#F7FAFC' : '#1A202C')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
        .style('z-index', '1000')
        .style('border', `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`);

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
    require([
        "esri/Map", 
        "esri/views/MapView", 
        "esri/layers/GraphicsLayer", 
        "esri/Graphic"
    ], function(Map, MapView, GraphicsLayer, Graphic) {

        const isDark = themeManager.isDarkMode();
        
        // Choose basemap based on theme
        const basemap = isDark ? "dark-gray-vector" : "gray-vector";
        
        const map = new Map({ basemap: basemap });
        currentMap = map;
        
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
                // Ensure popup appears above map
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

        // Apply popup theme styling after view loads
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
            
            let color = "#c1e7ff";
            if (avgBilling > 25000) color = "#FF6B6B";
            else if (avgBilling > 15000) color = "#FFA500";

            const safeId = name.replace(/[^a-zA-Z0-9]/g, '_');

            const graphic = new Graphic({
                geometry: { 
                    type: "point", 
                    longitude: +first.Longitude, 
                    latitude: +first.Latitude 
                },
                symbol: {
                    type: "simple-marker",
                    color: color,
                    size: Math.min(Math.max(patientCount / 2, 8), 22),
                    outline: { color: isDark ? "#1A202C" : "white", width: 2 }
                },
                attributes: { 
                    hospitalName: name,
                    patientCount: patientCount,
                    avgBilling: avgBilling.toFixed(0),
                    dominant: Array.from(d3.rollup(records, v => v.length, d => d['Test Results']))
                        .reduce((a, b) => a[1] > b[1] ? a : b)[0],
                    buttonId: safeId
                },
                popupTemplate: {
                    title: "{hospitalName}",
                    outFields: ["*"],
                    content: function(feature) {
                        return createPopupContent(feature);
                    }
                }
            });
            graphicsLayer.add(graphic);
        });

        // Listen for click events on the view
        view.on("click", function(event) {
            view.hitTest(event).then(function(response) {
                if (response.results.length > 0) {
                    const graphic = response.results[0].graphic;
                    if (graphic && graphic.layer === graphicsLayer) {
                        // Popup will open automatically, wait then attach listener
                        setTimeout(() => {
                            attachFilterButtonListener();
                            applyPopupTheme(themeManager.isDarkMode());
                        }, 200);
                    }
                }
            });
        });

        // Also use MutationObserver as backup
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

        // Observe the entire document for popup additions
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

// Apply theme to ArcGIS popup
function applyPopupTheme(isDark) {
    // Style the popup container
    const popupContainers = document.querySelectorAll('.esri-popup__main-container');
    popupContainers.forEach(container => {
        if (isDark) {
            container.style.background = '#2D3748';
            container.style.color = '#F7FAFC';
            container.style.borderColor = '#4A5568';
        } else {
            container.style.background = '#FFFFFF';
            container.style.color = '#1A202C';
            container.style.borderColor = '#E2E8F0';
        }
    });

    // Style popup header
    const popupHeaders = document.querySelectorAll('.esri-popup__header');
    popupHeaders.forEach(header => {
        if (isDark) {
            header.style.background = '#1A202C';
            header.style.color = '#F7FAFC';
            header.style.borderColor = '#4A5568';
        } else {
            header.style.background = '#F7FAFC';
            header.style.color = '#1A202C';
            header.style.borderColor = '#E2E8F0';
        }
    });

    // Style popup content
    const popupContents = document.querySelectorAll('.esri-popup__content');
    popupContents.forEach(content => {
        if (isDark) {
            content.style.background = '#2D3748';
            content.style.color = '#F7FAFC';
        } else {
            content.style.background = '#FFFFFF';
            content.style.color = '#1A202C';
        }
    });

    // Force popup to appear on top
    const popups = document.querySelectorAll('.esri-popup');
    popups.forEach(popup => {
        popup.style.zIndex = '9999';
        popup.style.position = 'absolute';
    });
}

// Create custom popup content with the filter button
function createPopupContent(feature) {
    const attrs = feature.graphic.attributes;
    const isDark = themeManager.isDarkMode();
    
    const div = document.createElement('div');
    div.className = 'custom-popup-content';
    div.style.fontFamily = 'sans-serif';
    div.style.lineHeight = '1.6';
    div.style.padding = '12px';
    div.style.background = isDark ? '#2D3748' : '#FFFFFF';
    div.style.color = isDark ? '#F7FAFC' : '#1A202C';
    
    div.innerHTML = `
        <div style="margin-bottom: 12px;">
            <div style="margin-bottom: 8px;">
                <strong style="color: ${isDark ? '#A78BFA' : '#4f46e5'};">Number of patients:</strong> 
                <span style="font-size: 15px; font-weight: 600;">${attrs.patientCount}</span>
            </div>
            <div style="margin-bottom: 8px;">
                <strong style="color: ${isDark ? '#34D399' : '#059669'};">Average billing:</strong> 
                <span style="font-size: 15px; font-weight: 600;">$${parseInt(attrs.avgBilling).toLocaleString()}</span>
            </div>
            <div style="margin-bottom: 12px;">
                <strong style="color: ${isDark ? '#F87171' : '#dc2626'};">Dominant result:</strong> 
                <span style="font-weight: 500;">${attrs.dominant}</span>
            </div>
        </div>
        <button 
            id="filter-btn-${attrs.buttonId}" 
            class="hospital-filter-btn"
            data-hospital="${attrs.hospitalName}"
            style="
                width: 100%;
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                font-size: 13px;
                transition: all 0.2s;
                box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
            "
        >
            FILTER BY THIS HOSPITAL
        </button>
    `;
    
    return div;
}

// Attach event listener to the filter button
function attachFilterButtonListener() {
    const buttons = document.querySelectorAll('.hospital-filter-btn');
    
    buttons.forEach(btn => {
        // Check if listener already attached
        if (btn.dataset.listenerAttached === 'true') {
            return;
        }
        
        btn.dataset.listenerAttached = 'true';
        
        // Add hover effects
        btn.addEventListener('mouseenter', function() {
            if (!this.classList.contains('applied')) {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.4)';
            }
        });
        
        btn.addEventListener('mouseleave', function() {
            if (!this.classList.contains('applied')) {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 2px 8px rgba(79, 70, 229, 0.3)';
            }
        });
        
        // Add click listener
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const hospitalName = this.getAttribute('data-hospital');
            console.log('Filtering by hospital:', hospitalName);
            
            // Visual feedback
            this.classList.add('applied');
            this.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            this.innerHTML = '✓ FILTER APPLIED';
            this.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
            this.style.transform = 'scale(0.98)';
            
            // Apply filter after brief delay
            setTimeout(() => {
                applyHospitalFilter(hospitalName);
                
                // Close popup
                if (mapView && mapView.popup) {
                    mapView.popup.close();
                }
            }, 400);
        });
    });
}

function applyHospitalFilter(hospitalName) {
    console.log("Applying global filter for hospital:", hospitalName);
    
    if (window.filterManager) {
        // Call the setHospitalFilter method
        window.filterManager.setHospitalFilter(hospitalName);
        
        // Show confirmation message
        console.log(`Filter applied: ${hospitalName}`);
        
        // Navigate to overview tab to see filtered results
        setTimeout(() => {
            const overviewTab = document.querySelector('[data-tab="overview"]');
            if (overviewTab) {
                overviewTab.click();
            }
        }, 100);
    } else {
        console.error("FilterManager not available on window object");
        alert("Filter system not ready. Please refresh the page and try again.");
    }
}

// Export function to update theme when theme changes
export function updateMapTheme() {
    if (mapView && currentMap) {
        const isDark = themeManager.isDarkMode();
        currentMap.basemap = isDark ? "dark-gray-vector" : "gray-vector";
        
        // Update legend
        const legend = document.querySelector('.map-legend');
        if (legend) {
            legend.style.background = isDark ? '#2D3748' : 'white';
            legend.style.color = isDark ? '#F7FAFC' : '#1A202C';
            legend.style.borderColor = isDark ? '#4A5568' : '#E2E8F0';
            
            // Update all text colors in legend
            const h4 = legend.querySelector('h4');
            if (h4) h4.style.color = isDark ? '#F7FAFC' : '#1A202C';
            
            const spans = legend.querySelectorAll('span');
            spans.forEach(span => {
                span.style.color = isDark ? '#E2E8F0' : '#4A5568';
            });
            
            const p = legend.querySelector('p');
            if (p) {
                p.style.borderTopColor = isDark ? '#4A5568' : '#eee';
                p.style.color = isDark ? '#A0AEC0' : '#666';
            }
        }
        
        // Update marker outlines
        applyPopupTheme(isDark);
    }
}