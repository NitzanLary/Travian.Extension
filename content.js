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
  
// Listen for messages from the popup to provide raid data
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getRaidsData") {
    const raids = extractRaidData();
    sendResponse({ raids: raids });
  }
});
  
