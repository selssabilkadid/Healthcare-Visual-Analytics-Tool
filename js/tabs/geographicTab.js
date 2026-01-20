// tabs/geographicTab.js
let mapView = null;

export async function renderGeographicTab(data) {
    const container = d3.select('#geographic-content');
    d3.selectAll('.tab-content').style('display', 'none');
    container.style('display', 'block').selectAll('*').remove();

    const geoLayout = container.append('div')
        .attr('class', 'chart-card')
        .style('height', 'calc(100vh - 250px)')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('padding', '0');

    geoLayout.append('div')
        .attr('id', 'viewDiv')
        .style('flex-grow', '1')
        .style('width', '100%');

    // Ajout d'une légende propre
    createLegend(container);

    setTimeout(() => initArcGISMap(data), 150);
}

function createLegend(parent) {
    const legend = parent.append('div')
        .style('position', 'absolute')
        .style('bottom', '40px')
        .style('left', '40px')
        .style('background', 'white')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
        .style('z-index', '1000');

    legend.html(`
        <h4 style="margin:0 0 8px 0; font-size:13px;">Facturation Moyenne</h4>
        <div style="display:flex; flex-direction:column; gap:5px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:12px; height:12px; border-radius:50%; background:#FF6B6B;"></div>
                <span style="font-size:11px;"> > 25,000 $</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:12px; height:12px; border-radius:50%; background:#FFA500;"></div>
                <span style="font-size:11px;"> 15,000 - 25,000 $</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:12px; height:12px; border-radius:50%; background:#c1e7ff;"></div>
                <span style="font-size:11px;"> < 15,000 $</span>
            </div>
        </div>
        <p style="margin:8px 0 0 0; font-size:10px; border-top:1px solid #eee; padding-top:5px; color:#666;">
            Taille du point = Nombre de patients
        </p>
    `);
}

function initArcGISMap(data) {
    require([
        "esri/Map", "esri/views/MapView", "esri/layers/GraphicsLayer", "esri/Graphic"
    ], function(Map, MapView, GraphicsLayer, Graphic) {

        const map = new Map({ basemap: "gray-vector" });
        const view = new MapView({
            container: "viewDiv",
            map: map,
            center: [15.0, 50.0],
            zoom: 4
        });

        const graphicsLayer = new GraphicsLayer();
        map.add(graphicsLayer);

        const hospitalGroups = d3.group(data, d => d.Hospital);
        
        hospitalGroups.forEach((records, name) => {
            const first = records[0];
            const patientCount = records.length;
            const avgBilling = d3.mean(records, d => +d['Billing Amount']);
            
            // Logique de couleur financière
            let color = "#4ECDC4"; // Faible
            if (avgBilling > 25000) color = "#FF6B6B"; // Elevé
            else if (avgBilling > 15000) color = "#FFA500"; // Moyen

            const graphic = new Graphic({
                geometry: { type: "point", longitude: +first.Longitude, latitude: +first.Latitude },
                symbol: {
                    type: "simple-marker",
                    color: color,
                    size: Math.min(Math.max(patientCount / 2, 8), 22),
                    outline: { color: "white", width: 1 }
                },
                attributes: { 
                    name, 
                    count: patientCount, 
                    billing: avgBilling.toFixed(0),
                    dominant: Array.from(d3.rollup(records, v => v.length, d => d['Test Results'])).reduce((a, b) => a[1] > b[1] ? a : b)[0]
                },
                popupTemplate: {
                    title: "{name}",
                    content: `
                        <div style="font-family:sans-serif; line-height:1.5;">
                            <b>Number of patients :</b> {count}<br>
                            <b>Average billing amount :</b> {billing} $<br>
                            <b>Dominant test result category :</b> {dominant}<br>
                            <button id="filter-btn-${name.replace(/\s+/g, '')}" 
                                    style="margin-top:12px; width:100%; background:#4f46e5; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer; font-weight:bold;">
                                ANALYSER CE CENTRE
                            </button>
                            
                        </div>`
                }
            });
            graphicsLayer.add(graphic);
        });

        // RÉPARATION DU BOUTON : Détection globale des clics
        view.on("click", (event) => {
            view.hitTest(event).then((response) => {
                const results = response.results.filter(r => r.graphic.layer === graphicsLayer);
                if (results.length > 0) {
                    const hospitalName = results[0].graphic.attributes.name;
                    // On utilise un délégué d'événement car le popup met du temps à apparaître
                    document.addEventListener('click', function(e) {
                        if (e.target && e.target.id === `filter-btn-${hospitalName.replace(/\s+/g, '')}`) {
                            applyGlobalFilter(hospitalName);
                        }
                    }, { once: true });
                }
            });
        });
    });
}

function applyGlobalFilter(hospitalName) {
    console.log("Filtrage pour :", hospitalName);
    if (window.filterManager) {
        window.filterManager.updateFilter('Hospital', hospitalName); // Interaction ArcGIS -> D3 
        // On retourne à l'overview pour voir les changements [cite: 42]
        document.querySelector('[data-tab="overview"]').click();
    }
}