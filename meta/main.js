import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let selectedCommits = [];
let xScale;
let yScale;
let commits;
let commitProgress = 100;
let commitMaxTime;
let timeScale;
let filteredCommits;

let colors =
  d3.scaleOrdinal(d3.schemeTableau10);

async function loadData() {

  const data = await d3.csv('loc.csv', (row) => ({
    ...row,

    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),

    date: new Date(row.date),

    datetime: new Date(
        row.date + 'T' + row.time
    ),
  }));

  return data;
}

function processCommits(data) {

  return d3
    .groups(data, d => d.commit)
    .map(([commit, lines]) => {

      let first = lines[0];

      let {
        author,
        date,
        time,
        timezone,
        datetime
      } = first;

      let ret = {

        id: commit,

        url:
          'https://github.com/Capybarachen/portfolio/commit/' +
          commit,

        author,
        date,
        time,
        timezone,
        datetime,

        hourFrac:
          datetime.getHours() +
          datetime.getMinutes() / 60,

        totalLines: lines.length,
      };
              Object.defineProperty(ret, 'lines', {
            value: lines,
            writable: true,
            configurable: true,
            enumerable: false,
        });

        return ret;
    });
}

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

  dl.append('dt')
    .text('Longest line');

  dl.append('dd')
    .text(
      d3.max(data, d => d.length)
    );

  dl.append('dt')
    .text('Maximum depth');

  dl.append('dd')
    .text(
      d3.max(data, d => d.depth)
    );
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

function renderScatterPlot(commitData) {

  const width = 825;
  const height = 400;

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

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
    ])
    .nice();

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

  // ===== gridlines =====

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

  // ===== axes =====

  const xAxis = d3
    .axisBottom(xScale)
    .tickFormat(
        d3.timeFormat('%b %d')
    );

  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat(
      d =>
        String(d % 24).padStart(2, '0') +
        ':00'
    );

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

  // ===== dots =====

  const dots = svg
    .append('g')
    .attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(
        d3.sort(
            commitData,
            d => -d.totalLines
        ),
        d => d.id
    )
    .join('circle')
    .attr('class', 'commit')

    .attr(
      'cx',
      d => xScale(d.datetime)
    )

    .attr(
      'cy',
      d => yScale(d.hourFrac)
    )

    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'cyan')
    .attr('fill-opacity', 0.71)
    

    .on('mouseenter', (event, commit) => {

        renderTooltipContent(commit);

        updateTooltipVisibility(true);

        updateTooltipPosition(event);
    })

    .on('mouseleave', () => {

        updateTooltipVisibility(false);
    });

    const brush = d3.brush()

        .extent([
            [usableArea.left, usableArea.top],
            [usableArea.right, usableArea.bottom]
    ]);

    svg.append('g')
        .call(brush);
    brush.on('start brush end', brushed);
    svg.selectAll('.dots, .overlay ~ *').raise();
}

function onTimeSliderChange() {

  const progress = +event.target.value;

  commitMaxTime = timeScale.invert(progress);

  filteredCommits = commits.filter(
    d => d.datetime <= commitMaxTime
  );

  d3.select('#commit-time-label')
    .text(commitMaxTime.toLocaleString());


  updateScatterPlot(filteredCommits);

  updateFileDisplay(filteredCommits);
}

function onStepEnter(response) {

  commitMaxTime =
    response.element.__data__.datetime;

  filteredCommits = commits.filter(
    d => d.datetime <= commitMaxTime
  );

  updateScatterPlot(filteredCommits);

  updateFileDisplay(filteredCommits);

}

function setupScrollytelling() {

  // ===== FIRST SCROLLY =====

  const scroller1 = scrollama();

  scroller1

    .setup({

      container: '#scrolly-1',

      step: '#scatter-story .step',

      offset: 0.5,

    })

    .onStepEnter(onStepEnter);

  // ===== SECOND SCROLLY =====

  const scroller2 = scrollama();

  scroller2

    .setup({

      container: '#scrolly-2',

      step: '#files-story .step',

      offset: 0.5,

    })

    .onStepEnter(response => {

      const commit =
        response.element.__data__;

      const filtered = commits.filter(
        d => d.datetime <= commit.datetime
      );

      updateFileDisplay(filtered);
    });
}

function updateScatterPlot(commitData) {

  const svg =
    d3.select('#chart').select('svg');

  xScale.domain(
    d3.extent(commitData, d => d.datetime)
  );

  const xAxis = d3
    .axisBottom(xScale)
    .tickFormat(
      d3.timeFormat('%b %d')
    );

  svg.select('.x-axis')
    .call(xAxis);

  const rScale = d3.scaleSqrt()
    .domain(
      d3.extent(commitData, d => d.totalLines)
    )
    .range([6, 28]);

  svg.select('.dots')
    .selectAll('circle')

    .data(
      d3.sort(
        commitData,
        d => -d.totalLines
      ),
      d => d.id
    )

    .join('circle')

    .attr('class', 'commit')

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
    .attr('fill-opacity', 0.7)

    .on('mouseenter', (event, commit) => {

      renderTooltipContent(commit);

      updateTooltipVisibility(true);

      updateTooltipPosition(event);
    })

    .on('mouseleave', () => {

      updateTooltipVisibility(false);
    });
}


function updateFileDisplay(commitData) {

  let lines =
    commitData.flatMap(d => d.lines);

  let files = d3.groups(
    lines,
    d => d.file
  )

  .map(([name, lines]) => ({
    name,
    lines,
  }))

  .sort(
    (a, b) =>
      b.lines.length - a.lines.length
  );

  const filesContainer = d3
    .select('#files')

    .selectAll('.file')

    .data(files, d => d.name)

    .join(
      enter => {

        const div = enter
          .append('div')
          .attr('class', 'file');

        div.append('dt');
        div.append('dd');

        return div;
      },

      update => update,

      exit => exit.remove()
    );

  filesContainer
    .transition()
    .duration(750)

    .style(
    'transform',
      (_, i) => `translateY(${i * 10}px)`
    );

  filesContainer
    .sort(
      (a, b) =>
        b.lines.length - a.lines.length
    )

    .order();

  filesContainer
    .select('dt')

    .html(d => `
      <code>${d.name}</code>
      <small>${d.lines.length} lines</small>
    `);

  filesContainer
    .select('dd')

    .selectAll('.loc')

    .data(d => d.lines)

    .join('div')

    .attr('class', 'loc')

    .style(
      '--color',
      d => {

        const extension =
          d.file.substring(
            d.file.lastIndexOf('.') + 1
          );

        return colors(extension);
      }
    );
}
function renderCommitStory() {

  d3.select('#scatter-story')

    .selectAll('.step')

    .data(commits)

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

        I edited ${d.totalLines} lines across

        ${d3.rollups(
          d.lines,
          D => D.length,
          d => d.file
        ).length}

        files.

        Then I looked over all I had made,
        and I saw that it was very good.

      </p>
    `);
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

function renderFilesStory(commitData) {

  d3.select('#files-story')

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

        I edited ${d.totalLines} lines across

        ${d3.rollups(
          d.lines,
          D => D.length,
          d => d.file
        ).length}

        files.

        Then I looked over all I had made,
        and I saw that it was very good.

      </p>
    `);
}

let data = await loadData();

commits = processCommits(data)
  .sort((a, b) => a.datetime - b.datetime);
timeScale = d3.scaleTime()
  .domain(
    d3.extent(commits, d => d.datetime)
  )
  .range([0, 100]);

commitMaxTime = timeScale.invert(commitProgress);

d3.select('#commit-time-label')
  .text(commitMaxTime.toLocaleString());

console.log(data);

console.log(commits);

filteredCommits = commits;

renderCommitInfo(data, commits);

renderScatterPlot(commits);

updateFileDisplay(filteredCommits);

renderCommitStory();

renderFilesStory(filteredCommits);

setupScrollytelling();

d3.select('#commit-progress')
  .on('input', onTimeSliderChange);
