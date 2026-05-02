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

const arcGenerator = d3.arc()
  .innerRadius(0)
  .outerRadius(50);

const colorScale = d3.scaleOrdinal(d3.schemeTableau10);


// ===== SEARCH FILTER =====
function getSearchFilteredProjects() {
  return projects.filter((project) => {
    let values = Object.values(project).join(' ').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}


// ===== FINAL (SEARCH + YEAR) =====
function getFinalProjects() {
  let filtered = getSearchFilteredProjects();

  if (selectedYear !== null) {
    filtered = filtered.filter(p => p.year === selectedYear);
  }

  return filtered;
}


// ===== PROJECT LIST =====
function renderProjectList(projectsGiven) {
  renderProjects(projectsGiven, projectsContainer, 'h2');

  projectCount.textContent = projectsGiven.length;
}


// ===== PIE CHART =====
function renderPieChart(projectsGiven) {

  const allYears = [...new Set(projects.map(p => p.year))];

  let data = allYears.map(year => ({
    label: year,
    value: projectsGiven.filter(p => p.year === year).length
  }));

  colorScale.domain(allYears);

  let pie = d3.pie().value(d => d.value);
  let arcData = pie(data);

  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  // ===== slices =====
  arcData.forEach((d) => {
    let year = d.data.label;

    if (d.data.value === 0) return;

    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colorScale(year))
      .attr('class', selectedYear === year ? 'selected' : '')
      .on('click', () => {
        selectedYear = selectedYear === year ? null : year;
        updatePage();
      });
  });

  // ===== legend =====
  data.forEach((d) => {
    let year = d.label;

    if (d.value === 0) return;

    legend.append('li')
      .attr('style', `--color:${colorScale(year)}`)
      .attr('class', selectedYear === year ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedYear = selectedYear === year ? null : year;
        updatePage();
      });
  });
}


// ===== UPDATE =====
function updatePage() {

  const finalProjects = getFinalProjects();

  renderPieChart(finalProjects);
  renderProjectList(finalProjects);
}


// ===== SEARCH =====
searchInput.addEventListener('input', (e) => {
  query = e.target.value;
  selectedYear = null;
  updatePage();
});


// ===== INIT =====
updatePage();
