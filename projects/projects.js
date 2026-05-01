import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('/portfolio/lib/projects.json');

projects.sort((a, b) => Number(b.year) - Number(a.year));

const container = document.querySelector('.projects');

if (container && projects) {
  renderProjects(projects, container, 'h2');
}

// red plot test

const svg = d3.select('#projects-pie-plot');

let arcGenerator = d3.arc()
  .innerRadius(0)
  .outerRadius(50);

let arc = arcGenerator({
  startAngle: 0,
  endAngle: 2 * Math.PI
});

svg.append('path')
  .attr('d', arc)
  .attr('fill', 'red');

// STEP 3
let rolledData = d3.rollups(
  projects,
  (v) => v.length,
  (d) => d.year
);

let data = rolledData.map(([year, count]) => {
  return { value: count, label: year };
});

let sliceGenerator = d3.pie()
  .value(d => d.value);

let arcData = sliceGenerator(data);

let arcs = arcData.map(d => arcGenerator(d));

let colors = d3.scaleOrdinal(d3.schemeTableau10);

svg.selectAll('path').remove();
arcs.forEach((arc, i) => {
  svg.append('path')
    .attr('d', arc)
    .attr('fill', colors(i));
});


let legend = d3.select('.legend');

legend.selectAll('li').remove();

data.forEach((d, i) => {
  legend.append('li')
    .attr('style', `--color:${colors(i)}`)
    .html(`<span class="swatch"></span> ${d.label} (${d.value})`);
});
