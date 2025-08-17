export function initGrowthWidget({ stateDataUrl, countyDataUrl, containerSelector }) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = `
    <div class="growth-widget-box" style="
      font-family: sans-serif;
      font-size: 14px;
      color: #333;
    ">
      <h3 style="
        margin-top: 0;
        font-size: 1.1rem;
        color: #3e49a8;
        border-bottom: 1px solid #ccc;
        padding-bottom: 0.5rem;
      ">Explore Growth by Race (2018–2023)</h3>

      <div style="margin-bottom: 0.75rem;">
        <label for="stateSelect" style="font-weight: bold;">State:</label><br>
        <select id="stateSelect" style="
          width: 100%;
          padding: 0.4rem;
          font-size: 0.9rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        ">
          <option value="">Select a state</option>
        </select>
      </div>

      <div style="margin-bottom: 1rem;">
        <label for="countySelect" style="font-weight: bold;">County:</label><br>
        <select id="countySelect" disabled style="
          width: 100%;
          padding: 0.4rem;
          font-size: 0.9rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        ">
          <option value="">Select a county</option>
        </select>
      </div>

      <div id="growthResults"></div>
    </div>
  `;

  let stateData = [], countyData = [];

  Promise.all([
    fetch(stateDataUrl).then(r => r.json()),
    fetch(countyDataUrl).then(r => r.json())
  ]).then(([state, county]) => {
    stateData = state;
    countyData = county;

    const stateSelect = container.querySelector("#stateSelect");
    const countySelect = container.querySelector("#countySelect");
    const resultBox = container.querySelector("#growthResults");

    const uniqueStates = [...new Set(state.map(d => d.NAME))];
    uniqueStates.forEach(name => {
      stateSelect.innerHTML += `<option value="${name}">${name}</option>`;
    });

    stateSelect.addEventListener("change", () => {
      const selected = stateSelect.value;
      const counties = county.filter(d => d.NAME.includes(selected));
      const countyNames = [...new Set(counties.map(d => d.NAME))];

      countySelect.disabled = false;
      countySelect.innerHTML = `<option value="">Select a county</option>`;
      countyNames.forEach(name => {
        countySelect.innerHTML += `<option value="${name}">${name}</option>`;
      });

      const filtered = state.filter(d => d.NAME === selected);
      showResults(filtered);
    });

    countySelect.addEventListener("change", () => {
      const selected = countySelect.value;
      if (!selected) return;
      const filtered = county.filter(d => d.NAME === selected);
      showResults(filtered, true);
    });

    function showResults(data, isCounty = false) {
      const sorted = data.sort((a, b) => b.pct_change - a.pct_change);

      // Format race names to be capitalized
      function capitalizeRace(race) {
        return race.charAt(0).toUpperCase() + race.slice(1);
      }

      // Get total population if it's a county
      let populationNote = "";
      if (isCounty) {
        const totalRow = data.find(d => d.race.toLowerCase() === "total");
        if (totalRow && typeof totalRow["2023"] === "number") {
          const pop = totalRow["2023"].toLocaleString();
          populationNote = `<p style="margin-bottom: 0.5rem; font-weight: bold;">2023 Population: ${pop}</p>`;
        }
      }

      resultBox.innerHTML = `
        ${populationNote}
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #ddd;">
              <th style="text-align: left; padding: 0.3rem;">Race</th>
              <th style="text-align: right; padding: 0.3rem;">% Change</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(d => `
              <tr>
                <td style="padding: 0.3rem;">${capitalizeRace(d.race)}</td>
                <td style="padding: 0.3rem; text-align: right;">${(d.pct_change * 100).toFixed(1)}%</td>
              </tr>`).join("")}
          </tbody>
        </table>
      `;
    }
  }).catch(err => {
    container.innerHTML = "<p style='color:red;'>⚠️ Failed to load data.</p>";
    console.error("Widget error:", err);
  });
}
