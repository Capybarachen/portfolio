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
