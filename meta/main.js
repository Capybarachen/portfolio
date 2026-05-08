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