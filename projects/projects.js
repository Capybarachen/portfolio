import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('/portfolio/lib/projects.json');

projects.sort((a, b) => Number(b.year) - Number(a.year));

const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');
const projectCount = document.querySelector('.project-count');
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');

let query = '';
let selectedIndex = -1;

let arcGenerator = d3.arc()
  .innerRadius(0)
  .outerRadius(50);

let colors = d3.scaleOrdinal(d3.schemeTableau10);

function getFilteredProjects() {
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  if (selectedIndex !== -1) {
    let rolledData = d3.rollups(
      filteredProjects,
      (v) => v.length,
      (d) => d.year
    );

    let data = rolledData.map(([year, count]) => {
      return { value: count, label: year };
    });

    let selectedYear = data[selectedIndex]?.label;

    if (selectedYear) {
      filteredProjects = filteredProjects.filter((project) => project.year === selectedYear);
    }
  }

  return filteredProjects;
}

function renderPage(projectsGiven) {
  renderProjects(projectsGiven, projectsContainer, 'h2');
  projectCount.textContent = projectsGiven.length;
  renderPieChart(projectsGiven);
}

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  arcs.forEach((arc, i) => {
    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', selectedIndex === i ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        renderPage(getFilteredProjects());
      });
  });

  data.forEach((d, i) => {
    legend.append('li')
      .attr('style', `--color:${colors(i)}`)
      .attr('class', selectedIndex === i ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        renderPage(getFilteredProjects());
      });
  });
}

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  selectedIndex = -1;
  renderPage(getFilteredProjects());
});

renderPage(projects);
