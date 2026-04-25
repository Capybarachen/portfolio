import { fetchJSON, renderProjects } from '../global.js';

projects.sort((a, b) => Number(b.year) - Number(a.year));

const container = document.querySelector('.projects');

renderProjects(projects, container, 'h2');
