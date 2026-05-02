import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

let selectedCommits = [];
let xScale;
let yScale;
let commits;

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

  const width = 1000;
  const height = 650;

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

    .range([4, 30]);

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
        )
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
    .attr('fill', 'hotpink')
    

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

    `${selectedCommits.length} commits selected`;
}

let data = await loadData();

commits = processCommits(data);

console.log(data);

console.log(commits);

renderCommitInfo(data, commits);
renderScatterPlot(commits);
