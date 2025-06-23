// Function to extract raid data from the DOM
function extractRaidData() {
  let raids = [];
  const tables = document.querySelectorAll("table.troop_details");

  tables.forEach(table => {
    let raid = {};

    // Extract troop values similar to travian_parser.py
    const troopSection = table.querySelector("tbody.units.last");
    if (troopSection) {
      raid.troop_values = Array.from(troopSection.querySelectorAll("td.unit"))
                                .map(td => parseInt(td.innerText) || 0);
    }
    
    // Extract resources (r1: crop, r2: wood, r3: clay, r4: iron)
    raid.resources = {};
    const resourceMapping = { r1: "crop", r2: "wood", r3: "clay", r4: "iron" };
    Object.entries(resourceMapping).forEach(([iconClass, resourceName]) => {
      const resourceElement = table.querySelector(`i.${iconClass}`);
      if (resourceElement) {
        // Assuming the value is in the next span element
        const valueSpan = resourceElement.nextElementSibling;
        raid.resources[resourceName] = parseInt(valueSpan.innerText.replace(/[^0-9]/g, "")) || 0;
      }
    });

    // Extract village reference and name
    const headline = table.querySelector("td.troopHeadline a");
    if (headline) {
      raid.village_ref = headline.href;
      let villageName = headline.innerText;
      // Clean the village name
      // possible values where the village name is Aladeen faluja:
      // Return from Aladeen faluja
      // Benji raids Aladeen faluja
      villageName = villageName.replace(/Return from |Benji raids /, "");
      // Remove the leading and trailing whitespace
      villageName = villageName.trim();
      // Remove the village name from the village reference
      raid.village_name = villageName;
    }

    // Extract timer value and arrival time
    const timerElement = table.querySelector("div.in span.timer");
    if (timerElement) {
      raid.timer_value = parseInt(timerElement.getAttribute("value"));
      raid.arrival_time = timerElement.innerText;
    }

    raids.push(raid);
  });
  return raids;
}

// ---- New Immediate Building Costs Accumulation functionality ----

// Global accumulator for building resources
let accumulatedBuildingCosts = { wood: 0, clay: 0, iron: 0, crop: 0 };

// Add CSS so that selected buildings are highlighted
const style = document.createElement('style');
style.textContent = `
  .building-selected {
    outline: 2px solid red;
  }
`;
document.head.appendChild(style);

// Function to immediately fetch building details and update accumulator
async function updateBuildingAccumulation(building, add = true) {
  const linkElement = building.querySelector("a[href]");
  if (!linkElement) return;
  const href = linkElement.getAttribute('href');

  try {
    // Fetch the building detail page immediately
    const response = await fetch(href, { credentials: 'include' });
    if (!response.ok) {
      window.alert("Failed to fetch building details for", href);
      return;
    }
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const resourceWrapper = doc.querySelector("div.inlineIconList.resourceWrapper");
    if (!resourceWrapper) return;

    // Get the first four resource values (assumed to be crop, wood, clay, iron)
    const resourceDivs = resourceWrapper.querySelectorAll("div.inlineIcon.resource");
    const keys = ['wood', 'clay', 'iron', 'crop'];
    let buildingCosts = { crop: 0, wood: 0, clay: 0, iron: 0 };

    resourceDivs.forEach((div, index) => {
      if (index < 4) {
        const valueSpan = div.querySelector("span.value");
        const value = parseInt(valueSpan ? valueSpan.innerText.replace(/[^0-9]/g, '') : '0') || 0;
        buildingCosts[keys[index]] = value;
      }
    });

    // Update the global accumulator based on whether we are adding or removing
    if (add) {
      accumulatedBuildingCosts.crop += buildingCosts.crop;
      accumulatedBuildingCosts.wood += buildingCosts.wood;
      accumulatedBuildingCosts.clay += buildingCosts.clay;
      accumulatedBuildingCosts.iron += buildingCosts.iron;
    } else {
      accumulatedBuildingCosts.crop -= buildingCosts.crop;
      accumulatedBuildingCosts.wood -= buildingCosts.wood;
      accumulatedBuildingCosts.clay -= buildingCosts.clay;
      accumulatedBuildingCosts.iron -= buildingCosts.iron;
    }
    console.log("Updated Accumulated Building Costs:", accumulatedBuildingCosts);
  } catch (err) {
    console.error("Error fetching building details:", err);
  }
}

// Toggle selection on right-click (contextmenu) and immediately fetch & update costs
function toggleBuildingSelection(event) {
  event.stopPropagation();
  event.preventDefault();
  const buildingSlot = event.currentTarget;
  const isSelected = buildingSlot.classList.contains('building-selected');
  buildingSlot.classList.toggle('building-selected');

  // If newly selected, add its cost; if deselected, subtract its cost.
  if (!isSelected) {
    updateBuildingAccumulation(buildingSlot, true);
  } else {
    updateBuildingAccumulation(buildingSlot, false);
  }
}

// Initialize building selection on all building elements using right-click
function initBuildingSelection() {
  const buildingSlots = document.querySelectorAll("div.buildingSlot");
  buildingSlots.forEach(slot => {
    // Listen for right-click events to toggle selection and update costs immediately
    slot.addEventListener('contextmenu', toggleBuildingSelection);
  });
}

// ...existing code...

// Function to add a sum row to the production table on dorf1.php page
function addProductionSum() {
  // Only run on dorf1.php pages
  if (!window.location.href.includes('/dorf1.php')) return;
  
  const productionTable = document.getElementById('production');
  if (!productionTable) return;
  
  // Get all the production values from the num cells
  const numCells = productionTable.querySelectorAll('td.num');
  let totalProduction = 0;
  
  numCells.forEach(cell => {
    // Extract the number, removing any non-numeric characters
    const value = parseInt(cell.innerText.replace(/[^0-9]/g, '')) || 0;
    totalProduction += value;
  });
  
  // Create a new row for the sum
  const sumRow = document.createElement('tr');
  sumRow.className = 'production-sum'; // Add a class to identify our custom row
  
  // Create the cells for the sum row
  const icoCell = document.createElement('td');
  icoCell.className = 'ico';
  icoCell.innerHTML = '<div><strong>∑</strong></div>'; // Using a sum symbol
  
  const resCell = document.createElement('td');
  resCell.className = 'res';
  resCell.innerText = 'Total:';
  
  const numCell = document.createElement('td');
  numCell.className = 'num';
  numCell.innerText = totalProduction;
  
  // Append cells to the row
  sumRow.appendChild(icoCell);
  sumRow.appendChild(resCell);
  sumRow.appendChild(numCell);
  
  // Append the row to the table body
  const tbody = productionTable.querySelector('tbody');
  if (tbody) {
    // Remove any existing sum row we might have added before (to avoid duplicates on page refresh)
    const existingSumRow = tbody.querySelector('.production-sum');
    if (existingSumRow) {
      tbody.removeChild(existingSumRow);
    }
    
    tbody.appendChild(sumRow);
  }
}

// Initialize both features when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initBuildingSelection();
    addProductionSum();
  });
} else {
  initBuildingSelection();
  addProductionSum();
}

// Listen for messages from the popup as before (if needed for other functionalities)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "accumulateBuildingCosts") {
    // Instead of performing async fetches here, simply return the accumulated values
    sendResponse({ totalCosts: accumulatedBuildingCosts });
    return;
  }
  if (message.type === "getRaidsData") {
    const raids = extractRaidData();
    sendResponse({ raids: raids });
  }
});