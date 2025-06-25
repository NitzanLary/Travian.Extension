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

// Function to add sum of resources to any page with resourceWrapper elements
function addResourcesSum() {
  // Find all resourceWrapper elements
  const resourceWrappers = document.querySelectorAll("div.inlineIconList.resourceWrapper");
  
  if (!resourceWrappers || resourceWrappers.length === 0) return;
  
  // Add CSS for the sum icon
  const sumStyle = document.createElement('style');
  sumStyle.textContent = `
    .resourceSum {
      font-weight: bold;
      font-style: normal;
      display: inline-block;
      text-align: center;
      width: 18px;
      height: 18px;
    }
  `;
  document.head.appendChild(sumStyle);
  
  resourceWrappers.forEach(wrapper => {
    // Get all resource elements except cropConsumption
    const resourceDivs = Array.from(wrapper.querySelectorAll("div.inlineIcon.resource"))
      .filter(div => {
        const icon = div.querySelector('i');
        return icon && icon.className.match(/(?:r[1-4]Big|Crop|Wood|Clay|Iron)/);
      });
    
    let totalResources = 0;
    
    // Sum up the resource values
    resourceDivs.forEach(div => {
      const valueSpan = div.querySelector('span.value');
      if (valueSpan) {
        const value = parseInt(valueSpan.innerText.replace(/[^0-9]/g, '')) || 0;
        totalResources += value;
      }
    });
    
    // Check if we already added a sum (to avoid duplicates)
    const existingSum = wrapper.querySelector('.resources-sum');
    if (existingSum) {
      existingSum.querySelector('span.value').innerText = totalResources;
      return;
    }
    
    // Create a new element for the sum
    const sumElement = document.createElement('div');
    sumElement.className = 'inlineIcon resource resources-sum';
    
    // Create icon element with sum symbol
    const iconElement = document.createElement('i');
    iconElement.className = 'resourceSum';
    iconElement.textContent = '∑';
    
    // Create value span
    const valueSpan = document.createElement('span');
    valueSpan.className = 'value value'; // Match the double 'value value' class
    valueSpan.innerText = totalResources;
    
    // Assemble the element
    sumElement.appendChild(iconElement);
    sumElement.appendChild(valueSpan);
    
    // Add to the wrapper
    wrapper.appendChild(sumElement);
  });
}

// Function to calculate and display improved values for unit research
function addUnitImprovementValues() {
  // Only run on the smithy page
  if (!window.location.href.includes('/build.php?id=') || !window.location.href.includes('&gid=13')) return;
  
  // Unit BASE and UPKEEP mappings
  const unitBaseValues = {
    'מניף אלה': 40,
    'לוחם חנית': 60,
    'סייר': 80,
    'פלאדין': 100
    // Add more units as needed
  };
  
  const unitUpkeepValues = {
    'מניף אלה': 1,
    'לוחם חנית': 1,
    'סייר': 1,
    'פלאדין': 2
    // Add more units as needed
  };

  // Function to calculate the improved value
  function calculateImprovedValue(unitType, level) {
    const BASE = unitBaseValues[unitType] || 0;
    const UPKEEP = unitUpkeepValues[unitType] || 0;

    // Formula: improved_value = round(BASE + (BASE + 300 * UPKEEP / 7) * (1.007^LEVEL - 1), 2)
    const improvedValue = BASE + (BASE + 300 * UPKEEP / 7) * (Math.pow(1.007, level + 1) - 1);
    console.log(`Calculating improved value for ${unitType} at level ${level + 1}: BASE=${BASE}, UPKEEP=${UPKEEP}, improvedValue=${improvedValue}`);
    return Math.round(improvedValue * 100) / 100; // Round to 2 decimal places
  }

  // Find all research elements
  const researchElements = document.querySelectorAll('div.research');

  researchElements.forEach(element => {
    // Find the title section
    const titleSection = element.querySelector('div.title');
    if (!titleSection) return;
    
    // Get the second anchor element which contains the unit name
    const links = titleSection.querySelectorAll('a');
    if (links.length < 2) return;
    
    // The second link contains the unit name text
    const unitType = links[1].textContent.trim();
    
    // Check if we have data for this unit type
    if (!unitBaseValues[unitType]) {
      console.log(`Unit type not in database: ${unitType}`);
      return;
    }
    
    // Extract level
    const levelSpan = titleSection.querySelector('span.level');
    if (!levelSpan) return;
    
    const levelMatch = levelSpan.textContent.match(/רמה (\d+)/);
    if (!levelMatch) return;
    
    console.log(`Processing unit: ${unitType}, Level: ${levelMatch[1]}`);
    
    const level = parseInt(levelMatch[1], 10);
    
    // Calculate improved value
    const improvedValue = calculateImprovedValue(unitType, level);
    console.log(`Improved value for ${unitType} at level ${level}: ${improvedValue}`);
    
    // Calculate percentage increase
    const baseValue = unitBaseValues[unitType] || 0;
    const percentageIncrease = baseValue > 0 ? ((improvedValue / baseValue - 1) * 100).toFixed(2) : 0;
    
    // Create or update improved value display
    let improvedValueElement = element.querySelector('.improved-value');
    
    if (!improvedValueElement) {
      improvedValueElement = document.createElement('div');
      improvedValueElement.className = 'improved-value';
      improvedValueElement.style.marginTop = '5px';
      improvedValueElement.style.fontWeight = 'bold';
      improvedValueElement.style.color = '#008000'; // Green color
      
      // Insert after resource wrapper
      const infoDiv = element.querySelector('.information');
      if (infoDiv) {
        const ctaDiv = infoDiv.querySelector('.cta');
        if (ctaDiv) {
          infoDiv.insertBefore(improvedValueElement, ctaDiv);
        } else {
          infoDiv.appendChild(improvedValueElement);
        }
      }
    }
    
    improvedValueElement.textContent = `Improved Value: ${improvedValue} (+${percentageIncrease}%)`;
  });
}

// Function to add sum of resources in the stockBar
function addStockBarResourcesSum() {
  // Find the stockBar element
  const stockBar = document.getElementById('stockBar');
  if (!stockBar) return;
  
  // Find all resource buttons (lumber, clay, iron, crop)
  const resourceButtons = stockBar.querySelectorAll('.stockBarButton[class*="resource"]');
  if (!resourceButtons || resourceButtons.length === 0) return;
  
  // Function to calculate and update the total
  function updateResourceTotal() {
    let totalResources = 0;
    
    // Sum up the resource values
    resourceButtons.forEach(button => {
      const valueDiv = button.querySelector('div.value');
      if (valueDiv) {
        // Get the raw text value
        const rawValue = valueDiv.innerText;
        // Parse the number, removing any non-numeric characters except decimal point
        const cleanValue = rawValue.replace(/[^\d.]/g, '');
        
        // Check if the number has a decimal point
        let value;
        if (cleanValue.includes('.')) {
          // If it has a decimal point, multiply by 1000
          value = parseFloat(cleanValue) * 1000;
        } else {
          // Otherwise keep as is
          value = parseInt(cleanValue) || 0;
        }
        
        totalResources += value;
      }
    });
    
    // Format the total with the same formatting as the original values
    const formattedTotal = Math.floor(totalResources).toLocaleString();
    
    // Update or create the sum element
    let sumElement = stockBar.querySelector('.stockBar-resources-sum');
    
    if (!sumElement) {
      // Create a new element that matches the style of the existing stockBarButtons
      sumElement = document.createElement('a');
      sumElement.className = 'stockBarButton stockBar-resources-sum';
      
      // Create an icon similar to the game's resource icons
      const iconElement = document.createElement('i');
      iconElement.style.fontSize = '16px';
      iconElement.style.fontWeight = 'bold';
      iconElement.style.display = 'block';
      iconElement.style.width = '25px';
      iconElement.style.height = '25px';
      iconElement.style.margin = '0 auto';
      iconElement.style.lineHeight = '25px';
      iconElement.style.textAlign = 'center';
      iconElement.textContent = '∑';
      
      // Create value div that matches the style of the game's resource values
      const valueDiv = document.createElement('div');
      valueDiv.className = 'value';
      valueDiv.style.fontWeight = 'bold';
      valueDiv.style.color = '#008000'; // Green color for positive values
      valueDiv.textContent = formattedTotal;
      
      // Add a bar box and bar like other resources have
      const barBox = document.createElement('div');
      barBox.className = 'barBox';
      
      const bar = document.createElement('div');
      bar.className = 'bar';
      // Set width based on the percentage of total compared to warehouse capacity
      // Just using a placeholder value for visual consistency
      bar.style.width = '20%'; 
      
      barBox.appendChild(bar);
      
      // Assemble the element
      sumElement.appendChild(iconElement);
      sumElement.appendChild(valueDiv);
      sumElement.appendChild(barBox);
      
      // Find a good place to insert it - after the last resource button
      // First check if there's a freeCrop button (which is not a resource<num> button)
      const freeCropButton = stockBar.querySelector('.stockBarButton:not([class*="resource"])');
      if (freeCropButton) {
        // Insert before the freeCrop button
        freeCropButton.parentNode.insertBefore(sumElement, freeCropButton);
      } else {
        // Insert after the last resource button
        const lastResourceButton = resourceButtons[resourceButtons.length - 1];
        lastResourceButton.parentNode.insertBefore(sumElement, lastResourceButton.nextSibling);
      }
    } else {
      // Just update the value if the element already exists
      const valueDiv = sumElement.querySelector('.value');
      if (valueDiv) {
        valueDiv.textContent = formattedTotal;
      }
    }
  }
  
  // Initial calculation
  updateResourceTotal();
  
  // Set up MutationObserver to watch for changes to resource values
  const observer = new MutationObserver(() => {
    updateResourceTotal();
  });
  
  // Watch for changes to all resource value elements
  resourceButtons.forEach(button => {
    const valueDiv = button.querySelector('div.value');
    if (valueDiv) {
      observer.observe(valueDiv, { 
        childList: true,     // Watch for changes to child nodes
        characterData: true, // Watch for changes to text content
        subtree: true        // Watch all descendants
      });
    }
  });
}

// Add this function to your initialization code
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initBuildingSelection();
    addProductionSum();
    addResourcesSum();
    addUnitImprovementValues();
    addStockBarResourcesSum(); // Add the new function
  });
} else {
  initBuildingSelection();
  addProductionSum();
  addResourcesSum();
  addUnitImprovementValues();
  addStockBarResourcesSum(); // Add the new function
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