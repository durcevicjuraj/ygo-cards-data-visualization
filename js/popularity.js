const csvPath = window.location.pathname.includes("/pages/")
  ? "../data/cards_cleaned.csv"
  : "data/cards_cleaned.csv";
let allData = [];

const margin = { top: 30, right: 20, bottom: 60, left: 240 };
const width = 1000 - margin.left - margin.right;
const height = 1800 - margin.top - margin.bottom;

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleBand().range([0, height]).padding(0.1);

const xAxisGroup = svg
  .append("g")
  .attr("transform", `translate(0,${height})`)
  .attr("class", "axis");
const yAxisGroup = svg.append("g").attr("class", "axis");

const title = svg
  .append("text")
  .attr("x", width / 2)
  .attr("y", -10)
  .attr("class", "chart-title");

const tooltip = d3.select("body").append("div").attr("class", "tooltip");

d3.csv(csvPath, (d) => ({
  name: d.name,
  views: +d.views,
  upvotes: +d.upvotes,
  downvotes: +d.downvotes,
  type: d.type,
  staple: d.staple === "Yes",
  ban_ocg: d.ban_ocg,
  image_url_small: d.image_url_small, // Add this line
})).then((data) => {
  allData = data;
  updateChart("upvotes");
});

document
  .getElementById("metric-select")
  .addEventListener("change", function () {
    updateChart(this.value);
  });

function updateChart(metric) {
  const topN = 30;
  const topData = allData.sort((a, b) => b[metric] - a[metric]).slice(0, topN);

  x.domain([0, d3.max(topData, (d) => d[metric])]);
  y.domain(topData.map((d) => d.name));

  const bars = svg.selectAll(".bar").data(topData, (d) => d.name);

  bars.exit().remove();

  bars
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("y", (d) => y(d.name))
    .attr("height", y.bandwidth())
    .attr("x", 0)
    .attr("width", 0)
    .attr("fill", getColor)
    .on("mousemove", (event, d) => {
      const selectedMetric = document.getElementById("metric-select").value;
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px")
        .style("opacity", 1)
        .html(
          `<strong>${d.name}</strong><br>` +
            `${
              selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)
            }: ${d[selectedMetric]}<br>` +
            `Staple: ${d.staple ? "Yes" : "No"}<br>` +
            `Ban Status: ${d.ban_ocg || "None"}<br>` +
            `<img src="${d.image_url_small}" alt="Card image" style="margin-top: 5px; width: 100px; height: auto;">`
        );
    })
    .on("mouseout", () => tooltip.style("opacity", 0))
    .transition()
    .duration(500)
    .attr("width", (d) => x(d[metric]));

  bars
    .transition()
    .duration(500)
    .attr("y", (d) => y(d.name))
    .attr("height", y.bandwidth())
    .attr("x", 0)
    .attr("width", (d) => x(d[metric]))
    .attr("fill", getColor);

  yAxisGroup
    .transition()
    .duration(500)
    .call(
      d3.axisLeft(y).tickFormat((d) => {
        const card = topData.find((c) => c.name === d);
        const prefix = card?.staple ? "⭐ " : "";
        const name = d.length > 30 ? d.slice(0, 30) + "…" : d;
        return prefix + name;
      })
    )
    .selectAll("text")
    .style("fill", (d) => {
      const card = topData.find((c) => c.name === d);
      if (!card) return "white";

      switch (card.ban_ocg) {
        case "Banned":
          return "#ff0000";
        case "Limited":
          return "#ff4d4d";
        case "Semi-Limited":
          return "#ff8080";
      }
    });

  xAxisGroup.transition().duration(500).call(d3.axisBottom(x));
}

function getColor(d) {
  const type = d.type.toLowerCase();
  if (type.includes("monster")) return "#FDE68A"; // 🟨
  if (type.includes("spell")) return "#1D9E74"; // 🟩
  if (type.includes("trap")) return "#BC5A84"; // 🟪
  return "#999"; // fallback
}
