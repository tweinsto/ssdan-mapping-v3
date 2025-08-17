export function initLanguageWidget({ stateDataUrl, countyDataUrl, containerSelector }) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = `
    <h3 style="margin-top: 0;"> <strong>Language</strong> Spoken at Home</h3>
    <label for="stateSelect">State:</label>
    <select id="stateSelect"></select>
    <br><br>
    <label for="countySelect">County:</label>
    <select id="countySelect"></select>
    <br><br>
    <canvas id="langChart" width="300" height="300"></canvas>
  `;

  let stateData, countyData, langChart;

  Promise.all([
    fetch(stateDataUrl).then(res => res.json()),
    fetch(countyDataUrl).then(res => res.json())
  ]).then(([state, county]) => {
    stateData = state;
    countyData = county;

    populateStates();
    updateStateChart("Alabama");
    populateCounties("Alabama");
  });

  function populateStates() {
    const stateSelect = container.querySelector("#stateSelect");
    const states = [...new Set(stateData.map(d => d.NAME))].sort();

    states.forEach(state => {
      const option = document.createElement("option");
      option.value = state;
      option.textContent = state;
      stateSelect.appendChild(option);
    });

    stateSelect.value = "Alabama";

    stateSelect.addEventListener("change", () => {
      updateStateChart(stateSelect.value);
      populateCounties(stateSelect.value);
    });
  }

  function populateCounties(stateName) {
    const countySelect = container.querySelector("#countySelect");
    const counties = countyData
      .filter(d => d.NAME.endsWith(stateName))
      .map(d => d.NAME)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();

    countySelect.innerHTML = '<option value="">-- Select a county --</option>';
    counties.forEach(county => {
      const option = document.createElement("option");
      option.value = county;
      option.textContent = county;
      countySelect.appendChild(option);
    });

    countySelect.addEventListener("change", () => {
      if (countySelect.value !== "") {
        updateCountyChart(countySelect.value);
      }
    });
  }

  function updateStateChart(stateName) {
    const filtered = stateData.filter(d => d.NAME === stateName);
    drawChart(filtered, `${stateName} (State-level)`);
  }

  function updateCountyChart(countyName) {
    const filtered = countyData.filter(d => d.NAME === countyName);
    drawChart(filtered, `${countyName} (County-level)`);
  }

  function drawChart(data, title) {
    const ctx = container.querySelector("#langChart").getContext("2d");
    const labels = data.map(d => d.group);
    const values = data.map(d => d.pct);

    if (langChart) langChart.destroy();

    langChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "% of Population",
          data: values,
          backgroundColor: "steelblue"
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 18 }
          },
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => value + "%"
            }
          }
        }
      }
    });
  }
}
