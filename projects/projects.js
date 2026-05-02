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
let selectedYear = null;

let arcGenerator = d3.arc()
  .innerRadius(0)
  .outerRadius(50);

let colors = d3.scaleOrdinal(d3.schemeTableau10);

// ===== Filter =====
function getFilteredProjects() {
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join(' ').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  if (selectedYear !== null) {
    filteredProjects = filteredProjects.filter(
      (project) => project.year === selectedYear
    );
  }

  return filteredProjects;
}

// ===== Main Render =====
function renderPage(projectsGiven) {
  renderProjects(projectsGiven, projectsContainer, 'h2');
  projectCount.textContent = projectsGiven.length;
  renderPieChart(projectsGiven);
}

// ===== Pie Chart =====
function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let pie = d3.pie().value(d => d.value);
  let arcData = pie(data);

  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  arcData.forEach((d, i) => {
    let year = d.data.label;

    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i))
      .on('click', () => {
        selectedYear = selectedYear === year ? null : year;
        renderPage(getFilteredProjects());
      });
  });

  data.forEach((d, i) => {
    let year = d.label;

    legend.append('li')
      .attr('style', `--color:${colors(i)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedYear = selectedYear === year ? null : year;
        renderPage(getFilteredProjects());
      });
  });
}
// ===== Search =====
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  selectedYear = null;
  renderPage(getFilteredProjects());
});

// ===== Init =====
renderPage(projects);
