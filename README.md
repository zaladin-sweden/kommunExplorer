# Sveriges Kommuner - Interactive Map

An interactive web application to explore and track visits to all 290 municipalities of Sweden.

DISCLAIMER: This is a lightweight test of Google Antigravity. It appears to be somewhat working. Do not expect any production quality. Use at your own risk.


## Features

- **Interactive Map**: Click on any of Sweden's 290 municipalities to mark them as visited
- **Visual Feedback**: Unvisited municipalities are shown in yellow, visited ones turn green
- **Multi-User Support**: Create multiple users, each with their own visit tracking
- **Statistics**: Real-time tracking of visited municipalities, remaining ones, and completion percentage
- **Data Persistence**: All data is saved in your browser's localStorage
- **Import/Export**: Backup and restore your data with JSON export/import functionality

## How to Use

1. **Open the Application**: Simply open `index.html` in a modern web browser
2. **Create a User**: On first launch, you'll be prompted to create a user account
3. **Explore the Map**: Click on any municipality to toggle its visited status
4. **Track Progress**: View your statistics in the control panel
5. **Manage Users**: Add new users or switch between existing ones using the dropdown

## File Structure

```
kommunExplorer/
├── index.html                      # Main HTML file
├── styles.css                      # Styling and layout
├── app.js                          # Main application logic
├── database.js                     # Database management
├── sweden-municipalities.geojson   # GeoJSON data for all 290 municipalities
└── README.md                       # This file
```

## Technical Details

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Map Rendering**: SVG-based rendering from GeoJSON data
- **Data Storage**: Browser localStorage
- **Data Source**: GeoJSON from [okfse/sweden-geojson](https://github.com/okfse/sweden-geojson)

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- SVG rendering
- localStorage API
- Fetch API

Recommended browsers: Chrome, Firefox, Edge, Safari (latest versions)

## Data Management

### Export Data
Click the "Exportera data" button to download a JSON file containing all users and their visit data.

### Import Data
Click the "Importera data" button to restore data from a previously exported JSON file.

### Reset
Click "Återställ alla" to mark all municipalities as unvisited for the current user.

## Credits

- Municipality boundaries: [okfse/sweden-geojson](https://github.com/okfse/sweden-geojson)
- Original data: Valmyndigheten via OpenDataSoft

## License

Free to use and modify for personal and educational purposes.
