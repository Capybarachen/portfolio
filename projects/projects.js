import { fetchJSON, renderProjects } from './global.js';

const projects = await fetchJSON('/portfolio/lib/projects.json');

const latest = projects.slice(0, 3);

const container = document.querySelector('.projects');

if (container) {
  renderProjects(latest, container, 'h2');
}
