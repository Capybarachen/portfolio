console.log("IT'S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

document.querySelector("nav")?.remove();
document.querySelector(".color-scheme")?.remove();

let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "cv.html", title: "CV" },
  { url: "https://github.com/Capybarachen", title: "GitHub" }
];

const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/";

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;

  if (!url.startsWith("http")) {
    url = BASE_PATH + url;
  }

  let a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add("current");
  }

  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}

document.body.insertAdjacentHTML(
  "afterbegin",
  `
<label class="color-scheme">
  Theme:
  <select>
    <option value="light dark">Auto</option>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
</label>
`
);

let select = document.querySelector(".color-scheme select");


if ("colorScheme" in localStorage) {
  document.documentElement.style.setProperty(
    "color-scheme",
    localStorage.colorScheme
  );
  select.value = localStorage.colorScheme;
}

select.addEventListener("input", function (event) {
  let value = event.target.value;

  document.documentElement.style.setProperty("color-scheme", value);

  localStorage.colorScheme = value;
});

console.log("Navbar + Theme switch ready");


let form = document.querySelector("form");

if (form) {
  form.addEventListener("submit", function (event) {
    let email = form.email.value;
    let subject = form.subject.value;
    let body = form.body.value;

    let url = `mailto:test123@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    form.action = url;
  });
}

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch JSON");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}

export function renderProjects(projects, container, headingLevel = "h2") {
  container.innerHTML = "";

  for (let p of projects) {
    const article = document.createElement("article");

    article.innerHTML = `
      <${headingLevel}>${p.title}</${headingLevel}>
      <img src="${p.image}" alt="${p.title}">
      <p>${p.description}</p>
    `;

    container.appendChild(article);
  }
}

export async function fetchGithubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
