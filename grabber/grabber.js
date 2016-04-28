'use strict';

const sqlite3 = require('co-sqlite3');

const extractor = require('./extractor');

const tables = [
  `satellite(
    satnum integer not null primary key,
    title  text
  ) without rowid`,

  `orbelement(
    satnum    integer not null,
    timestamp integer not null,

    epochyr   integer not null,
    epochdays real    not null,
    bstar     real    not null,
    inclo     real    not null,
    nodeo     real    not null,
    ecco      real    not null,
    argpo     real    not null,
    mo        real    not null,
    no        real    not null,

    primary key(satnum, timestamp)
  ) without rowid`,
];

class Grabber {
  *connect(dbname) {
    let db = this.db = yield sqlite3(dbname);

    yield tables.map(tbl => db.run(`create table if not exists ${tbl}`));

    this.sql = yield {
      insertSatellite: db.prepare('insert or ignore into satellite(satnum, title) values (?, ?)'),
      insertOrbelement: db.prepare(`insert or ignore into
                                    orbelement(satnum, timestamp, epochyr, epochdays,
                                               bstar, inclo, nodeo, ecco, argpo, mo, no)
                                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    };
  }

  *grab(fetcher) {
    let tles = yield* fetcher.fetch();

    console.log(`Fetched ${tles.length} from ${fetcher.info}.`);

    // FIXME: transactions complicate parallelism.
    yield this.db.run('begin');

    for (let tle of tles)
      yield* this.processTLE(tle);

    yield this.db.run('commit');
  }

  *processTLE(tle) {
    let satellite = extractor.parse(tle);
    let st = satellite.stats;

    yield [
      this.sql.insertSatellite.run(st.satnum, satellite.title),
      this.sql.insertOrbelement.run(st.satnum, satellite.timestamp, st.epochyr, st.epochdays,
                                    st.bstar, st.inclo, st.nodeo, st.ecco, st.argpo, st.mo, st.no),
    ];
  }
}

module.exports = Grabber;
