import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

let data = [];
let commits = [];
let filteredCommits = [];

async function loadData() {

  data = await d3.csv('loc.csv', row => ({

    ...row,

    line: +row.line,
    depth: +row.depth,
    length: +row.length,

    datetime: new Date(row.datetime),
  }));

  processCommits();
}

function processCommits() {

  commits = d3.groups(data, d => d.commit)

    .map(([commit, lines]) => {

      let first = lines[0];

      let ret = {

        id: commit,

        url:
          'https://github.com/Capybarachen/portfolio/commit/' + commit,

        author: first.author,

        date: first.date,

        time: first.time,

        datetime: first.datetime,

        hourFrac:
          first.datetime.getHours() +
          first.datetime.getMinutes() / 60,

        totalLines: lines.length,

        lines,
      };

      Object.defineProperty(ret, 'hour', {

        get() {
          return this.datetime.getHours();
        },
      });

      return ret;
    });

  console.log(data);

  console.log(commits);
}

loadData();

function renderCommitInfo(data, commits) {

  const dl = d3
    .select('#stats')
    .append('dl')
    .attr('class', 'stats');

  dl.append('dt')
    .html('Total <abbr title="Lines of code">LOC</abbr>');

  dl.append('dd')
    .text(data.length);

  dl.append('dt')
    .text('Total commits');

  dl.append('dd')
    .text(commits.length);

  dl.append('dt')
    .text('Number of files');

  dl.append('dd')
    .text(
      d3.group(data, d => d.file).size
    );
}

function renderScatterPlot(commitData) {

  const width = 825;
  const height = 400;

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`);

  const margin = {
    top: 10,
    right: 10,
    bottom: 30,
    left: 40,
  };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  xScale = d3
    .scaleTime()
    .domain(
      d3.extent(commitData, d => d.datetime)
    )
    .range([
      usableArea.left,
      usableArea.right
    ]);

  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([
      usableArea.bottom,
      usableArea.top
    ]);

  const rScale = d3
    .scaleSqrt()
    .domain(
      d3.extent(commitData, d => d.totalLines)
    )
    .range([6, 28]);

  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr(
      'transform',
      `translate(${usableArea.left},0)`
    );

  gridlines.call(
    d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usableArea.width)
  );

  const xAxis = d3
    .axisBottom(xScale);

  const yAxis = d3
    .axisLeft(yScale);

  svg.append('g')
    .attr('class', 'x-axis')
    .attr(
      'transform',
      `translate(0,${usableArea.bottom})`
    )
    .call(xAxis);

  svg.append('g')
    .attr(
      'transform',
      `translate(${usableArea.left},0)`
    )
    .call(yAxis);

  const dots = svg
    .append('g')
    .attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(commitData)
    .join('circle')

    .attr(
      'cx',
      d => xScale(d.datetime)
    )

    .attr(
      'cy',
      d => yScale(d.hourFrac)
    )

    .attr(
      'r',
      d => rScale(d.totalLines)
    )

    .attr('fill', 'cyan')

    .attr('fill-opacity', 0.7);

  const brush = d3.brush()

    .extent([
      [usableArea.left, usableArea.top],
      [usableArea.right, usableArea.bottom]
    ]);

  svg.append('g')
    .call(brush);

  brush.on('start brush end', brushed);
  dots
    .selectAll('circle')

    .on('mouseenter', (event, commit) => {

      renderTooltipContent(commit);

      updateTooltipVisibility(true);

      updateTooltipPosition(event);
    })

    .on('mouseleave', () => {

      updateTooltipVisibility(false);
    });
}

function brushed(event) {

  const selection = event.selection;

  if (!selection) {

    selectedCommits = [];

  } else {

    const [[x0, y0], [x1, y1]] = selection;

    selectedCommits = commits.filter(commit => {

      const x = xScale(commit.datetime);

      const y = yScale(commit.hourFrac);

      return (
        x >= x0 &&
        x <= x1 &&
        y >= y0 &&
        y <= y1
      );
    });
  }

  updateSelection();
}

function updateSelection() {

  d3.selectAll('circle')
    .classed('selected', d =>
      selectedCommits.includes(d)
    );

  document.getElementById(
    'selection-count'
  ).textContent =

    selectedCommits.length === 0
      ? 'No commits selected'
      : `${selectedCommits.length} commits selected`;

  renderLanguageBreakdown();
}

function updateSelection() {

  d3.selectAll('circle')
    .classed('selected', d =>
      selectedCommits.includes(d)
    );

  document.getElementById(
    'selection-count'
  ).textContent =

    selectedCommits.length === 0
      ? 'No commits selected'
      : `${selectedCommits.length} commits selected`;
}

function updateTooltipVisibility(isVisible) {

  const tooltip =
    document.getElementById('commit-tooltip');

  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {

  const tooltip =
    document.getElementById('commit-tooltip');

  tooltip.style.left =
    `${event.clientX + 10}px`;

  tooltip.style.top =
    `${event.clientY + 10}px`;
}

function renderTooltipContent(commit) {

  document.getElementById('commit-link').href =
    commit.url;

  document.getElementById('commit-link').textContent =
    commit.id;

  document.getElementById('commit-date').textContent =
    commit.datetime.toLocaleDateString();

  document.getElementById('commit-time').textContent =
    commit.datetime.toLocaleTimeString();

  document.getElementById('commit-author').textContent =
    commit.author;

  document.getElementById('commit-lines').textContent =
    commit.totalLines;
}
function renderLanguageBreakdown() {

  const container =
    document.getElementById(
      'language-breakdown'
    );

  container.innerHTML = '';

  if (selectedCommits.length === 0) {
    return;
  }

  const lines = selectedCommits.flatMap(
    d => d.lines
  );

  const breakdown = d3.rollup(

    lines,

    v => v.length,

    d => d.type
  );

  for (const [language, count] of breakdown) {

    const proportion =
      count / lines.length;

    const dt =
      document.createElement('dt');

    dt.textContent = language;

    const dd =
      document.createElement('dd');

    dd.textContent =
      `${count} lines (${d3.format('.1~%')(proportion)})`;

    container.appendChild(dt);

    container.appendChild(dd);
  }
}

let commitProgress = 100;
let commitMaxTime;
let timeScale;

function onTimeSliderChange() {

  const progress = +event.target.value;

  commitMaxTime = timeScale.invert(progress);

  filteredCommits = commits.filter(
    d => d.datetime <= commitMaxTime
  );

  d3.select('#commit-time-label')
    .text(commitMaxTime.toLocaleString());

  updateScatterPlot(filteredCommits);
}

function updateScatterPlot(commitData) {

  const svg =
    d3.select('#chart').select('svg');

  xScale.domain(
    d3.extent(commitData, d => d.datetime)
  );

  const xAxis = d3
    .axisBottom(xScale);

  svg.select('.x-axis')
    .call(xAxis);

  const rScale = d3
    .scaleSqrt()

    .domain(
      d3.extent(commitData, d => d.totalLines)
    )

    .range([6, 28]);

  svg.select('.dots')

    .selectAll('circle')

    .data(commitData)

    .join('circle')

    .attr(
      'cx',
      d => xScale(d.datetime)
    )

    .attr(
      'cy',
      d => yScale(d.hourFrac)
    )

    .attr(
      'r',
      d => rScale(d.totalLines)
    )

    .attr('fill', 'cyan')

    .attr('fill-opacity', 0.7);
}
renderCommitInfo(data, commits);

renderScatterPlot(commits);

timeScale = d3.scaleTime()

  .domain(
    d3.extent(commits, d => d.datetime)
  )

  .range([0, 100]);

commitMaxTime =
  timeScale.invert(commitProgress);

d3.select('#commit-time-label')
  .text(commitMaxTime.toLocaleString());

d3.select('#commit-progress')
  .on('input', onTimeSliderChange);
filteredCommits = commits;

renderCommitStory(filteredCommits);

setupScrollytelling();

  function renderCommitStory(commitData) {

  d3.select('#scatter-story')

    .selectAll('.step')

    .data(commitData)

    .join('div')

    .attr('class', 'step')

    .html((d, i) => `

      <p>

        On ${d.datetime.toLocaleString('en', {

          dateStyle: 'full',

          timeStyle: 'short',

        })},

        I made

        <a href="${d.url}" target="_blank">

          ${
            i > 0
              ? 'another glorious commit'
              : 'my first commit, and it was glorious'
          }

        </a>.

        I edited ${d.totalLines} lines.

      </p>
    `);
}

function onStepEnter(response) {

  commitMaxTime =
    response.element.__data__.datetime;

  filteredCommits = commits.filter(
    d => d.datetime <= commitMaxTime
  );

  updateScatterPlot(filteredCommits);
}

function setupScrollytelling() {

  const scroller = scrollama();

  scroller

    .setup({

      container: '#scrolly-1',

      step: '#scatter-story .step',

      offset: 0.5,

    })

    .onStepEnter(onStepEnter);
}