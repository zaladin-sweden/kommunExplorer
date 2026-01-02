// Main application logic
let geoData = null;
let projection = null;

// Initialize the application
async function init() {
    try {
        // Load GeoJSON data (embedded in geojson-data.js)
        geoData = geoJSONData;

        // Extract municipality names and initialize database
        const municipalityNames = geoData.features.map(f => f.properties.kom_namn).sort();
        db.setMunicipalities(municipalityNames);

        // Setup UI
        setupUserInterface();
        renderMap();

        // Load existing users or create default
        const users = db.getUsers();
        if (users.length === 0) {
            createDefaultUser();
        } else {
            populateUserSelect();
        }
    } catch (error) {
        console.error('Initialization failed:', error);
        alert('Failed to load municipality data. Please refresh the page.');
    }
}

// Create default user
function createDefaultUser() {
    const username = prompt('Välkommen! Ange ditt namn:');
    if (username) {
        if (db.createUser(username)) {
            db.setCurrentUser(username);
            populateUserSelect();
            updateStats();
            updateMap();
        }
    }
}

// Setup user interface event listeners
function setupUserInterface() {
    // User selection
    document.getElementById('userSelect').addEventListener('change', (e) => {
        if (e.target.value) {
            db.setCurrentUser(e.target.value);
            updateStats();
            updateMap();
        }
    });

    // Add user button
    document.getElementById('addUserBtn').addEventListener('click', () => {
        const username = prompt('Ange användarnamn:');
        if (username) {
            if (db.createUser(username)) {
                db.setCurrentUser(username);
                populateUserSelect();
                updateStats();
                updateMap();
            } else {
                alert('Användaren finns redan eller ogiltigt namn.');
            }
        }
    });

    // Delete user button
    document.getElementById('deleteUserBtn').addEventListener('click', () => {
        const currentUser = db.currentUser;
        if (!currentUser) {
            alert('Ingen användare vald.');
            return;
        }

        if (confirm(`Är du säker på att du vill ta bort användaren "${currentUser}"?`)) {
            db.deleteUser(currentUser);
            populateUserSelect();
            updateStats();
            updateMap();
        }
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (!db.currentUser) {
            alert('Ingen användare vald.');
            return;
        }

        if (confirm('Är du säker på att du vill återställa alla besök?')) {
            db.resetAll();
            updateStats();
            updateMap();
        }
    });

    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => {
        const data = db.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sweden-municipalities-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Import button
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (db.importData(event.target.result)) {
                    alert('Data importerad!');
                    populateUserSelect();
                    updateStats();
                    updateMap();
                } else {
                    alert('Import misslyckades. Kontrollera filen.');
                }
            };
            reader.readAsText(file);
        }
    });
}

// Populate user select dropdown
function populateUserSelect() {
    const select = document.getElementById('userSelect');
    const users = db.getUsers();

    select.innerHTML = '<option value="">Välj användare...</option>';
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        option.selected = user === db.currentUser;
        select.appendChild(option);
    });
}

// Update statistics display
function updateStats() {
    const stats = db.getStats();
    document.getElementById('visitedCount').textContent = stats.visited;
    document.getElementById('remainingCount').textContent = stats.remaining;
    document.getElementById('percentageCount').textContent = `${stats.percentage}%`;
}

// Calculate projection bounds using Mercator projection
function calculateProjection() {
    if (!geoData) return;

    // Get bounds from GeoJSON (in lon/lat)
    let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;

    geoData.features.forEach(feature => {
        const coords = feature.geometry.coordinates;

        function processBounds(coordArray) {
            if (typeof coordArray[0] === 'number') {
                const [lon, lat] = coordArray;
                minLon = Math.min(minLon, lon);
                maxLon = Math.max(maxLon, lon);
                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
            } else {
                coordArray.forEach(processBounds);
            }
        }

        processBounds(coords);
    });

    // Target dimensions - we want the map to fit nicely
    const maxWidth = 1000;
    const maxHeight = 1400;
    const padding = 20;

    // For Mercator projection, we need to account for latitude scaling
    // At the center latitude, calculate how many degrees of longitude equal one degree of latitude
    const centerLat = (minLat + maxLat) / 2;
    const latScale = Math.cos(centerLat * Math.PI / 180);

    // Calculate the effective width in "latitude-equivalent" units
    const lonRange = (maxLon - minLon) * latScale;
    const latRange = maxLat - minLat;

    // Calculate scale based on which dimension is the limiting factor
    const scaleX = (maxWidth - 2 * padding) / lonRange;
    const scaleY = (maxHeight - 2 * padding) / latRange;
    const scale = Math.min(scaleX, scaleY);

    // Calculate actual dimensions after scaling
    const width = lonRange * scale + 2 * padding;
    const height = latRange * scale + 2 * padding;

    projection = {
        scale,
        minLon,
        maxLon,
        minLat,
        maxLat,
        centerLat,
        latScale,
        width,
        height,
        padding
    };
}

// Convert latitude to Mercator Y coordinate
function latToMercatorY(lat) {
    // For this simplified version, we'll just use latitude directly
    // since we're applying the scale correction in the projection
    return lat;
}

// Project coordinates using Mercator projection
function project(coords) {
    if (!projection) return coords;

    if (typeof coords[0] === 'number') {
        const [lon, lat] = coords;

        // Apply latitude scale correction to longitude
        const x = (lon - projection.minLon) * projection.latScale * projection.scale + projection.padding;
        // Flip Y-axis so north is up
        const y = (projection.maxLat - lat) * projection.scale + projection.padding;

        return [x, y];
    }

    return coords.map(project);
}

// Convert coordinates to SVG path
function coordsToPath(coords) {
    const projected = project(coords);

    function arrayToPath(arr) {
        if (typeof arr[0][0] === 'number') {
            return arr.map((point, i) => `${i === 0 ? 'M' : 'L'}${point[0]},${point[1]}`).join(' ') + ' Z';
        }
        return arr.map(arrayToPath).join(' ');
    }

    return arrayToPath(projected);
}

// Render the map
function renderMap() {
    if (!geoData) return;

    calculateProjection();
    const svg = document.getElementById('map');
    svg.innerHTML = '';

    // Update SVG viewBox to match calculated dimensions
    svg.setAttribute('viewBox', `0 0 ${projection.width} ${projection.height}`);

    geoData.features.forEach(feature => {
        const municipalityName = feature.properties.kom_namn;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        path.setAttribute('d', coordsToPath(feature.geometry.coordinates));
        path.setAttribute('class', 'municipality unvisited');
        path.setAttribute('data-name', municipalityName);

        // Add event listeners
        path.addEventListener('click', () => handleMunicipalityClick(municipalityName));
        path.addEventListener('mouseenter', (e) => showTooltip(e, municipalityName));
        path.addEventListener('mousemove', (e) => moveTooltip(e));
        path.addEventListener('mouseleave', hideTooltip);

        svg.appendChild(path);
    });

    updateMap();
}

// Update map colors based on visited status
function updateMap() {
    if (!db.currentUser) {
        // Reset all to unvisited if no user selected
        document.querySelectorAll('.municipality').forEach(path => {
            path.classList.remove('visited');
            path.classList.add('unvisited');
        });
        return;
    }

    document.querySelectorAll('.municipality').forEach(path => {
        const name = path.getAttribute('data-name');
        const visited = db.isVisited(name);

        if (visited) {
            path.classList.remove('unvisited');
            path.classList.add('visited');
        } else {
            path.classList.remove('visited');
            path.classList.add('unvisited');
        }
    });
}

// Handle municipality click
function handleMunicipalityClick(municipalityName) {
    if (!db.currentUser) {
        alert('Välj en användare först!');
        return;
    }

    db.toggleVisited(municipalityName);
    updateStats();
    updateMap();
}

// Tooltip functions
function showTooltip(event, municipalityName) {
    const tooltip = document.getElementById('tooltip');
    const visited = db.isVisited(municipalityName);
    tooltip.textContent = `${municipalityName}${visited ? ' ✓' : ''}`;
    tooltip.classList.add('visible');
    moveTooltip(event);
}

function moveTooltip(event) {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY + 10) + 'px';
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.classList.remove('visible');
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
