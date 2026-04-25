import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('/portfolio/lib/projects.json');

projects.sort((a, b) => Number(b.year) - Number(a.year));

const container = document.querySelector('.projects');

if (container && projects) {
  renderProjects(projects, container, 'h2');
}
