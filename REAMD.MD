# Travian Raid Analyzer

Travian Raid Analyzer is a Chrome extension designed to simplify your gameplay in Travian by analyzing incoming raids on the rally point overview page. It extracts relevant raid data (such as troop counts, resources, arrival times, etc.) from the page and provides a user-friendly interface to view and analyze this information using multiple functions.

## Features

- **Troops by Time:** Aggregate troop counts for raids arriving within a given time range.
- **Arrival Time by Units:** Determine the arrival time when a specified number of a particular unit is met.
- **All Resources:** Calculate and display the total resources (crop, wood, clay, iron) from all incoming raids.
- **Village Data:** Filter and display raid details based on the village name.

## Installation

1. **Clone or Download the Repository:**
   - Clone the repository or download the ZIP file and extract it.
   
2. **Load the Extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode" using the toggle in the top right corner.
   - Click "Load unpacked" and select the folder containing the extension files.

3. **Permissions:**
   - Ensure that the extension has permission to run on the Travian domain (e.g., `https://*.travian.com/*`).

## File Structure
├── manifest.json # Extension manifest file defining permissions and scripts ├── content.js # Content script that extracts raid data from the Travian page ├── popup.html # Popup HTML file providing the UI for the extension └── popup.js # JavaScript for handling UI interactions and data processing

## How It Works

- **Data Extraction:**
  - The content script (`content.js`) scans the Travian rally point overview page for elements with the class `troop_details` and extracts data such as troop counts, resources, village details, and timer values.

- **User Interface:**
  - The popup (accessed via the extension icon) presents a tabbed interface where you can select different functions:
    - **Troops by Time:** Enter a time (in seconds) and get the sum of troops for raids arriving before that time.
    - **Arrival Time by Units:** Choose a unit type and input the required count to calculate the arrival time.
    - **All Resources:** View the aggregated resources from all incoming raids.
    - **Village Data:** Filter raid data by entering a village name.

- **Data Processing:**
  - The logic from your original Python scripts is translated into JavaScript functions in `popup.js`, which handle data aggregation and filtering based on user inputs.

## Customization

- **UI Customization:** Feel free to modify the HTML and CSS in `popup.html` to better suit your preferences.
- **Functionality Enhancements:** You can extend the JavaScript code in `popup.js` or `content.js` to include additional features or refine the data extraction logic as needed.

## Troubleshooting

- **Invalid Host Patterns:** If you encounter errors related to host permissions (e.g., "Invalid host wildcard"), ensure that your manifest uses valid match patterns such as:
  ```json
  "matches": [
    "https://*.travian.com/*",
    "http://*.travian.com/*"
  ]