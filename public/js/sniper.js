const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  }; 
};

//

const header = document.querySelector("div.fc-header-view");
header.innerHTML = "";

const count = document.createElement("div");
count.id = "mosan-count";

const cycleCount = document.createElement("div");
cycleCount.id = "mosan-cycle";
cycleCount.dataset.label = "C";
cycleCount.textContent = "C: 0 / 0";

const winCount = document.createElement("div");
winCount.id = "mosan-win";
winCount.dataset.label = "W";
winCount.textContent = "W: 0";

const lossCount = document.createElement("div");
lossCount.id = "mosan-loss";
lossCount.dataset.label = "L";
lossCount.textContent = "L: 0";

const errorCount = document.createElement("div");
errorCount.id = "mosan-error";
errorCount.dataset.label = "E";
errorCount.textContent = "E: 0";

count.appendChild(cycleCount);
count.appendChild(winCount);
count.appendChild(lossCount);
count.appendChild(errorCount);

const fact = document.createElement("div");
fact.id = "mosan-fact";

const searchCount = document.createElement("div");
searchCount.id = "mosan-search";
searchCount.dataset.label = "S";
searchCount.textContent = "S: 0";

const searchTimer = document.createElement("div");
searchTimer.id = "mosan-timer";
searchTimer.textContent = "00:00";

fact.appendChild(searchCount);
fact.appendChild(searchTimer);

header.appendChild(count);
header.appendChild(fact);

//
const main = document.querySelector("body > main");

const stopSearch = document.createElement("button");
const span = document.createElement("span");
span.textContent = "Stop";
stopSearch.appendChild(span);
stopSearch.classList.add("ut-tab-bar-item");
stopSearch.addEventListener("click", () => {
  window.stopSniper();

  sniperSearch.classList.remove("hidden");

  const tabBar = document.querySelector("nav.ut-tab-bar");

  for (const tab of tabBar.childNodes) {
    if (tab.classList.contains("hidden")) {
      tab.classList.remove("hidden");
    }
  }

  tabBar.removeChild(stopSearch);
});

const sniperSearch = document.createElement("button");
sniperSearch.id = "start-mosan";
sniperSearch.textContent = "Search+";
sniperSearch.classList.add("btn-standard", "call-to-action");
sniperSearch.addEventListener("click", () => {
  window.startSniper();

  sniperSearch.classList.add("hidden");

  const tabBar = document.querySelector("nav.ut-tab-bar");

  for (const tab of tabBar.childNodes) {
    if (!tab.classList.contains("hidden")) {
      tab.classList.add("hidden");
    }
  }

  tabBar.appendChild(stopSearch);
});

const divider = document.createElement("div");
divider.id = "mosan-divider";

const sniperSettings = document.createElement("div");
sniperSettings.id = "mosan-settings";

const createFilterHeader = (title) => {
  const header = document.createElement("div");
  header.classList.add("search-price-header");

  const h1 = document.createElement("h1");
  h1.textContent = title;
  header.appendChild(h1);

  const reset = document.createElement("button");
  reset.textContent = "Reset";
  reset.classList.add("flat");
  header.appendChild(reset);

  return header;
};

const createFilterInput = (label, defaultValue, onChnage) => {
  const container = document.createElement("div");
  container.classList.add("price-filter");

  const info = document.createElement("div");
  info.classList.add("info");

  const span = document.createElement("span");
  span.classList.add("label");
  span.textContent = label;
  info.appendChild(span);

  container.appendChild(info);

  const input = document.createElement("input");
  input.type = "tel";
  input.value = defaultValue;
  input.classList.add("ut-number-input-control");
  input.addEventListener("input", (event) => {
    onChnage(event.target.value);
  });

  container.appendChild(input);
  
  return container;
};

const cycleRange = createFilterHeader("Cycle Range");
const cycleMin = createFilterInput("Min", window.settings.cycle.min, debounce((value) => {
  window.settings.cycle.min = parseInt(value, 10);
  window.setSettings(window.settings);
}, 500));
const cycleMax = createFilterInput("Max", window.settings.cycle.max, debounce((value) => {
  window.settings.cycle.max = parseInt(value, 10);
  window.setSettings(window.settings);
}, 500));

const pauseCycle = createFilterHeader("Pause Cycle");
const pauseCycleMin = createFilterInput("Min", window.settings.pauseCycle.min, debounce((value) => {
  window.settings.pauseCycle.min = parseInt(value, 10);
  window.setSettings(window.settings);
}, 500));
const pauseCycleMax = createFilterInput("Max", window.settings.pauseCycle.max, debounce((value) => {
  window.settings.pauseCycle.max = parseInt(value, 10);
  window.setSettings(window.settings);
}, 500));

const searchDelay = createFilterHeader("Search Delay");
const searchDelayMin = createFilterInput("Min", window.settings.searchDelay.min, debounce((value) => {
  window.settings.searchDelay.min = parseInt(value, 10);
  window.setSettings(window.settings);
}, 500));
const searchDelayMax = createFilterInput("Max", window.settings.searchDelay.max, debounce((value) => {
  window.settings.searchDelay.max = parseInt(value, 10);
  window.setSettings(window.settings);
}, 500));

const delayAfterBid = createFilterHeader("Delay After Bid");
const delayAfterBidMin = createFilterInput("Min", window.settings.delayAfterBid.min, debounce((value) => {
  window.settings.delayAfterBid.min = parseInt(value, 10);
  window.setSettings(window.settings);
}, 500));
const delayAfterBidMax = createFilterInput("Max", window.settings.delayAfterBid.max, debounce((value) => {
  window.settings.delayAfterBid.max = parseInt(value, 10);
  window.setSettings(window.settings);
}, 500));

const sell = createFilterHeader("Sell");
const sellEnabled = createFilterInput("Enable Sell", window.settings.sell ? 1 : 0, debounce((value) => {
  window.settings.sell = Number(value) === 1;
  window.setSettings(window.settings);
}));
const sellFor = createFilterInput("Sell For", window.settings.sellFor, debounce((value) => {
  window.settings.sellFor = Number(value);
  window.setSettings(window.settings);
}));

sniperSettings.appendChild(cycleRange);
sniperSettings.appendChild(cycleMin);
sniperSettings.appendChild(cycleMax);

sniperSettings.appendChild(pauseCycle);
sniperSettings.appendChild(pauseCycleMin);
sniperSettings.appendChild(pauseCycleMax);

sniperSettings.appendChild(searchDelay);
sniperSettings.appendChild(searchDelayMin);
sniperSettings.appendChild(searchDelayMax);

sniperSettings.appendChild(delayAfterBid);
sniperSettings.appendChild(delayAfterBidMin);
sniperSettings.appendChild(delayAfterBidMax);

sniperSettings.appendChild(sell);
sniperSettings.appendChild(sellEnabled);
sniperSettings.appendChild(sellFor);
//

const injectSniper = debounce(() => {
  const buttonContainer = main.querySelector("div.button-container");

  if (!buttonContainer) {
    return;
  }

  if (buttonContainer.querySelector("#start-mosan")) {
    return;
  }

  buttonContainer.appendChild(sniperSearch);

  const pinnedList = document.querySelector("div.ut-pinned-list");
  pinnedList.appendChild(divider);
  pinnedList.appendChild(sniperSettings);
}, 500);

//

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      const buttonContainer = main.querySelector("div.button-container");
      if (buttonContainer) {
        injectSniper();
        break;
      }
    }
  }
});

observer.observe(main, {
  childList: true,
  subtree: true,
});
