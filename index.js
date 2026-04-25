import { fetchJSON, renderProjects, fetchGithubData } from './global.js';

const projects = await fetchJSON('./lib/projects.json');

const latest = projects.slice(0, 3);

const container = document.querySelector('.projects');

if (container) {
  renderProjects(latest, container, 'h2');
}


const githubData = await fetchGithubData('Capybarachen');

const statsContainer = document.querySelector('#profile-stats');

if (statsContainer) {
  statsContainer.innerHTML = `
    <p>Repos: ${githubData.public_repos}</p>
    <p>Followers: ${githubData.followers}</p>
    <p>Following: ${githubData.following}</p>
  `;
}
