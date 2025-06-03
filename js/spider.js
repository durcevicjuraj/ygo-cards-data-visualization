const CARD_PAGE_SIZE = 50;
const metrics = ["level", "def", "atk"];
let cards = [],
  filtered = [],
  currentPage = 0,
  selected = [];

d3.csv("../data/cards_cleaned.csv", (d) => ({
  id: d.id,
  name: d.name,
  image: d.image_url,
  type: d.type,
  race: d.race,
  attribute: d.attribute,
  archetype: d.archetype,
  desc: d.desc,
  atk: +d.atk,
  def: +d.def,
  level: +d.level,
  linkval: +d.linkval,
  linkmarkers: d.linkmarkers,
  staple: d.staple === "Yes" ? 1 : 0,
  views: +d.views,
  upvotes: +d.upvotes,
  downvotes: +d.downvotes,
  ban_ocg: d.ban_ocg,
  ocg_date: d.ocg_date,
  has_effect: d.has_effect === "True" || d.has_effect === "1" ? 1 : 0,
})).then((data) => {
  cards = data.filter(
    (c) => c.type && c.type.toLowerCase().includes("monster")
  );
  filtered = cards;
  initFilters();
  renderGallery();
  updatePagination();
  drawRadar();
});

function initFilters() {
  const mk = (sel, arr) =>
    Array.from(new Set(arr.filter((v) => v)))
      .sort()
      .forEach((v) => d3.select(sel).append("option").attr("value", v).text(v));
  mk(
    "#filter-type",
    cards.map((c) => c.type)
  );
  mk(
    "#filter-race",
    cards.map((c) => c.race)
  );
  mk(
    "#filter-attribute",
    cards.map((c) => c.attribute)
  );
  mk(
    "#filter-archetype",
    cards.map((c) => c.archetype)
  );
  d3.selectAll(
    "#filter-name,#filter-atk-min,#filter-atk-max," +
      "#filter-def-min,#filter-def-max,#filter-type,#filter-race," +
      "#filter-attribute,#filter-archetype,#filter-has-effect,#filter-staple," +
      "#filter-level-min,#filter-level-max"
  ).on("input change", () => {
    applyFilters();
    currentPage = 0;
    renderGallery();
    updatePagination();
  });
  ["#slot1", "#slot2"].forEach((sel, i) =>
    d3.select(sel).on("click", () => {
      if (selected[i]) {
        selected.splice(i, 1);
        updateSelectionUI();
        drawRadar();
      }
    })
  );
}

d3.select("#reset-filters").on("click", () => {
  // Reset input fields
  [
    "#filter-name",
    "#filter-atk-min",
    "#filter-atk-max",
    "#filter-def-min",
    "#filter-def-max",
    "#filter-level-min",
    "#filter-level-max",
  ].forEach((id) => d3.select(id).property("value", ""));

  // Reset checkboxes
  ["#filter-has-effect", "#filter-staple"].forEach((id) =>
    d3.select(id).property("checked", false)
  );

  // Reset selects
  [
    "#filter-type",
    "#filter-race",
    "#filter-attribute",
    "#filter-archetype",
  ].forEach((id) => d3.select(id).property("value", ""));

  // Reapply filters and re-render
  applyFilters();
  currentPage = 0;
  renderGallery();
  updatePagination();
});

function applyFilters() {
  const nameQ = d3.select("#filter-name").property("value").toLowerCase(),
    atkMin = +d3.select("#filter-atk-min").property("value") || -Infinity,
    atkMax = +d3.select("#filter-atk-max").property("value") || Infinity,
    defMin = +d3.select("#filter-def-min").property("value") || -Infinity,
    defMax = +d3.select("#filter-def-max").property("value") || Infinity,
    typeSel = d3.select("#filter-type").property("value"),
    raceSel = d3.select("#filter-race").property("value"),
    attrSel = d3.select("#filter-attribute").property("value"),
    archSel = d3.select("#filter-archetype").property("value"),
    he = d3.select("#filter-has-effect").property("checked"),
    st = d3.select("#filter-staple").property("checked"),
    lvlMin = +d3.select("#filter-level-min").property("value") || -Infinity,
    lvlMax = +d3.select("#filter-level-max").property("value") || Infinity;
  filtered = cards.filter((c) => {
    if (nameQ && !c.name.toLowerCase().includes(nameQ)) return false;
    if (c.atk < atkMin || c.atk > atkMax) return false;
    if (c.def < defMin || c.def > defMax) return false;
    if (c.level < lvlMin || c.level > lvlMax) return false;
    if (typeSel && c.type !== typeSel) return false;
    if (raceSel && c.race !== raceSel) return false;
    if (attrSel && c.attribute !== attrSel) return false;
    if (archSel && c.archetype !== archSel) return false;
    if (he && c.has_effect !== 1) return false;
    if (st && c.staple !== 1) return false;
    return true;
  });
}

function renderGallery() {
  const start = currentPage * CARD_PAGE_SIZE,
    page = filtered.slice(start, start + CARD_PAGE_SIZE);
  const gal = d3
    .select("#gallery")
    .selectAll("img")
    .data(page, (d) => d.id);
  gal.exit().remove();
  gal
    .enter()
    .append("img")
    .attr("class", "thumbnail")
    .attr("src", (d) => d.image)
    .attr("title", (d) => d.name)
    .on("click", (_, d) => {
      onCardClick(d);
      drawRadar();
    })
    .merge(gal);
  updateSelectionUI();
}

function updatePagination() {
  const total = Math.ceil(filtered.length / CARD_PAGE_SIZE);
  d3.select("#page-info").text(`Page ${currentPage + 1} of ${total}`);
  // buttons remain enabled
}
d3.select("#prev-page").on("click", () => {
  currentPage = Math.max(0, currentPage - 1);
  renderGallery();
  updatePagination();
});
d3.select("#next-page").on("click", () => {
  const total = Math.ceil(filtered.length / CARD_PAGE_SIZE);
  currentPage = Math.min(total - 1, currentPage + 1);
  renderGallery();
  updatePagination();
});

function onCardClick(card) {
  const idx = selected.findIndex((c) => c.id === card.id);
  if (idx > -1) selected.splice(idx, 1);
  else if (selected.length < 2) selected.push(card);
  updateSelectionUI();
}

function updateSelectionUI() {
  d3.selectAll(".thumbnail")
    .classed("selected1", (d) => selected[0]?.id === d.id)
    .classed("selected2", (d) => selected[1]?.id === d.id);
  ["1", "2"].forEach((i) => {
    const c = selected[i - 1],
      slot = d3.select("#slot" + i),
      nm = d3.select("#name" + i);
    slot.html("");
    nm.text("");
    if (c) {
      const tooltipLines = [
        `${c.name}`,
        `Type: ${c.type}`,
        `Attack: ${isNaN(c.atk) ? "?" : c.atk}`,
        `Defense: ${isNaN(c.def) ? "?" : c.def}`,
        ...(c.level ? [`Level/Rank: ${c.level}`] : []),
        `Race: ${c.race || "None"}`,
        `Attribute: ${c.attribute || "None"}`,
        `Effect: ${c.has_effect === 1 ? "Yes" : "No"}`,
        ...(c.scale ? [`Scale: ${c.scale}`] : []),
        ...(c.linkval ? [`Link: ${c.linkval}`] : []),
        ...(c.linkmarkers ? [`Link markers: ${c.linkmarkers}`] : []),
        `Ban Status: ${c.ban_ocg || "None"}`,
        `Staple: ${c.staple === 1 ? "Yes" : "No"}`,
        `Release Date: ${c.ocg_date || "Unknown"}`,
        `Views: ${c.views}`,
        `Upvotes: ${c.upvotes}`,
        `Downvotes: ${c.downvotes}`,
        "",
        `${c.desc || ""}`,
      ];

      const tooltipText = tooltipLines.join("\n");

      slot.append("div").attr("class", "tooltip-container").html(`
    <img src="${c.image}" height="330" />
    <div class="tooltip">${tooltipText}</div>
  `);

      slot
        .append("button")
        .attr("class", "deselect")
        .text("×")
        .on("click", (e) => {
          e.stopPropagation();
          selected.splice(i - 1, 1);
          updateSelectionUI();
          drawRadar();
        });
      nm.text(c.name);
    } else {
      slot.text(`Slot ${i}`);
    }
  });
}

function drawRadar() {
  const axisMax = metrics.map((m) => d3.max(cards, (c) => c[m])),
    dataSets = selected.map((c) =>
      metrics.map((m, i) => ({ axis: m, value: c[m] / axisMax[i] }))
    ),
    zeroData = metrics.map(() => ({ axis: "", value: 0 })),
    radarLine = d3
      .lineRadial()
      .radius((d) => d.value * 135)
      .angle((d, i) => (i * 2 * Math.PI) / metrics.length)
      .curve(d3.curveLinearClosed),
    color = d3.scaleOrdinal().range(["#1fb438", "#ff160e"]);

  let svg = d3.select("#radar-chart svg"),
    g;
  if (svg.empty()) {
    svg = d3
      .select("#radar-chart")
      .append("svg")
      .attr("width", 350)
      .attr("height", 350);
    g = svg.append("g").attr("transform", "translate(175,175)");
    const radius = 135,
      angleSlice = (2 * Math.PI) / metrics.length;
    for (let lvl = 1; lvl <= 4; lvl++) {
      g.append("circle")
        .attr("r", radius * (lvl / 4))
        .attr("fill", "none")
        .attr("stroke", "#CDCDCD")
        .attr("stroke-dasharray", "2,2");
    }
    const labelMap = {
      atk: "Attack",
      def: "Defense",
      has_effect: "Effect",
      level: "Level/Rank",
    };

    metrics.forEach((m, i) => {
      const a = angleSlice * i - Math.PI / 2;
      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", radius * Math.cos(a))
        .attr("y2", radius * Math.sin(a))
        .attr("stroke", "#CDCDCD");
      g.append("text")
        .attr("x", (radius + 23) * Math.cos(a))
        .attr("y", (radius + 20) * Math.sin(a))
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#fff")
        .text(labelMap[m]);
    });
  } else {
    g = svg.select("g");
  }

  const areas = g.selectAll(".radar-area").data(dataSets);

  // animate exit: collapse back to center then remove
  areas
    .exit()
    .transition()
    .duration(500)
    .attrTween("d", function () {
      const prev = d3.select(this).attr("d");
      const interp = d3.interpolate(prev, radarLine(zeroData));
      return (t) => interp(t);
    })
    .remove();

  // enter + update
  const enterSel = areas
    .enter()
    .append("path")
    .attr("class", "radar-area")
    .attr("fill-opacity", 0.3)
    .attr("stroke-width", 2);

  enterSel
    .merge(areas)
    .attr("fill", (d, i) => color(i))
    .attr("stroke", (d, i) => color(i))
    .transition()
    .duration(500)
    .attrTween("d", function (d) {
      const prev = this.getAttribute("d") || radarLine(zeroData);
      const interp = d3.interpolate(prev, radarLine(d));
      return (t) => interp(t);
    });
}
