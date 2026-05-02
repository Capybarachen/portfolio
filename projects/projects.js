import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('/portfolio/lib/projects.json');

// 排序（新→舊）
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

// 固定色盤（穩定顏色對應）
const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

// ===== 搜尋過濾（不含年份）=====
function getSearchFilteredProjects() {
  return projects.filter((project) => {
    let values = Object.values(project).join(' ').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

// ===== 最終清單（含年份）=====
function getFinalProjects() {
  let filtered = getSearchFilteredProjects();

  if (selectedYear !== null) {
    filtered = filtered.filter(p => p.year === selectedYear);
  }

  return filtered;
}

// ===== 渲染卡片 + 數量 =====
function renderProjectList(projectsGiven) {
  renderProjects(projectsGiven, projectsContainer, 'h2');
  projectCount.textContent = projectsGiven.length;
}

// ===== Pie Chart（❗永遠用 searchFilteredProjects）=====
function renderPieChart(projectsGiven) {

  let rolledData = d3.rollups(
    projectsGiven,
    v => v.length,
    d => d.year
  );

  let data = rolledData.map(([year, count]) => ({
    label: year,
    value: count
  }));

  // ⭐ 確保顏色固定（不會因為 filter 改順序）
  colorScale.domain(data.map(d => d.label));

  let pie = d3.pie().value(d => d.value);
  let arcData = pie(data);

  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  // ===== slices =====
  arcData.forEach((d) => {
    let year = d.data.label;

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

// ===== 主更新流程 =====
function updatePage() {
  const searchFiltered = getSearchFilteredProjects();
  const finalProjects = getFinalProjects();

  renderProjectList(finalProjects);

  // ⭐ 關鍵：pie 不用 finalProjects
  renderPieChart(searchFiltered);
}

// ===== search =====
searchInput.addEventListener('input', (e) => {
  query = e.target.value;
  selectedYear = null;
  updatePage();
});

// ===== init =====
updatePage();
