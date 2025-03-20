// Helper: Format seconds as hh:mm:ss
function secondsToTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins}:${secs}`;
  }
  
  // Request raid data from the content script
  function getRaidData(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "getRaidsData" }, function(response) {
        callback(response ? response.raids : []);
      });
    });
  }
  
  // Troops by Time (mimics get_troops_by_time)
  document.getElementById("analyzeTroops").addEventListener("click", () => {
    const timeRange = parseInt(document.getElementById("timeInput").value);
    if (isNaN(timeRange)) {
      document.getElementById("troopsResult").innerText = "Please enter a valid time.";
      return;
    }
    getRaidData((raids) => {
      let sumTroops = Array(raids[0]?.troop_values?.length || 0).fill(0);
      raids.forEach(raid => {
        if (raid.timer_value <= timeRange) {
          raid.troop_values.forEach((val, i) => {
            sumTroops[i] += val;
          });
        }
      });
      document.getElementById("troopsResult").innerText = JSON.stringify(sumTroops, null, 2);
    });
  });
  
  // Arrival Time by Units (mimics get_arrival_time_by_num_uints)
  document.getElementById("analyzeArrival").addEventListener("click", () => {
    const unit = document.getElementById("unitSelect").value;
    const unitCount = parseInt(document.getElementById("unitCount").value);
    if (isNaN(unitCount)) {
      document.getElementById("arrivalResult").innerText = "Please enter a valid number.";
      return;
    }
    
    // Unit order mapping based on your Python list
    const unitIndexMapping = {
      "clubs": 0,
      "spearman": 1,
      "axeman": 2,
      "scout": 3,
      "paladin": 4,
      "knight": 5,
      "ram": 6,
      "catapult": 7,
      "chief": 8,
      "settler": 9
    };
    
    getRaidData((raids) => {
      let accumulated = Array(raids[0]?.troop_values?.length || 0).fill(0);
      let arrivalTime = 0;
      for (let i = 0; i < raids.length; i++) {
        const raid = raids[i];
        accumulated = accumulated.map((val, idx) => val + raid.troop_values[idx]);
        if (accumulated[unitIndexMapping[unit]] >= unitCount) {
          arrivalTime = raid.timer_value;
          break;
        }
      }
      document.getElementById("arrivalResult").innerText = `Arrival Time: ${secondsToTime(arrivalTime)}`;
    });
  });
  
  // All Resources (mimics get_all_resources)
  document.getElementById("analyzeResources").addEventListener("click", () => {
    getRaidData((raids) => {
      let totalResources = { crop: 0, wood: 0, clay: 0, iron: 0 };
      raids.forEach(raid => {
        totalResources.crop += raid.resources.crop || 0;
        totalResources.wood += raid.resources.wood || 0;
        totalResources.clay += raid.resources.clay || 0;
        totalResources.iron += raid.resources.iron || 0;
      });
      document.getElementById("resourcesResult").innerText = JSON.stringify(totalResources, null, 2);
    });
  });
  
  // Village Data (mimics get_data_by_village_name)
  document.getElementById("analyzeVillage").addEventListener("click", () => {
    const villageName = document.getElementById("villageName").value.trim().toLowerCase();
    if (!villageName) {
      document.getElementById("villageResult").innerText = "Please enter a village name.";
      return;
    }
    getRaidData((raids) => {
      const filtered = raids.filter(raid =>
        raid.village_name && raid.village_name.toLowerCase().includes(villageName)
      );
      if (filtered.length === 0) {
        document.getElementById("villageResult").innerText = "No data found for that village.";
      } else {
        document.getElementById("villageResult").innerText = JSON.stringify(filtered, null, 2);
      }
    });
  });
  
  // Tab switching functionality
  const tabButtons = document.querySelectorAll(".tablinks");
  const tabContents = document.querySelectorAll(".tabcontent");
  
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");
      tabContents.forEach(content => content.classList.remove("active"));
      tabButtons.forEach(btn => btn.classList.remove("active"));
      document.getElementById(targetTab).classList.add("active");
      button.classList.add("active");
    });
  });
  
  // Activate the first tab by default
  if (tabButtons.length) {
    tabButtons[0].click();
  };
