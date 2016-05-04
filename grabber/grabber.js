'use strict';

const sqlite3 = require('co-sqlite3');

const extractor = require('./extractor');
const infoFetcher = require('./info_fetcher');

const tables = [
  `satellite(
    satnum      integer not null primary key,
    title       text,
    intl        text,
    perigee     real,
    apogee      real,
    inclination real,
    period      real,
    semimajor   real,
    rcs         real,
    launch      integer,
    decay       integer,
    source      text,
    site        text
    note        text
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
      selectLaunch: db.prepare(`select launch from satellite where satnum = ?`),
      updateInfo: db.prepare(`update satellite set intl = ?, perigee = ?, apogee = ?,
                                                   inclination = ?, period = ?, semimajor = ?,
                                                   rcs = ?, launch = ?, decay = ?, source = ?,
                                                   site = ?, note = ?
                              where satnum = ?`),
    };
  }

  *grab(fetcher) {
    console.log(`Fetching from ${fetcher.info}...`);
    let tles = yield* fetcher.fetch();
    console.log(`Fetched ${tles.length} from ${fetcher.info}.`);

    // FIXME: transactions complicate parallelism.
    yield this.db.run('begin');

    for (let tle of tles) {
      try {
        yield* this.processTLE(tle);
      } catch (ex) {
        if (ex instanceof extractor.InvalidTLEError) {
          console.error(`Error while processing TLE from ${fetcher.info}: ${ex.message}`);
          console.error('~'.repeat(50));
          console.error(ex.tle);
          console.error('~'.repeat(50));
        } else
          throw ex;
      }
    }

    yield this.db.run('commit');
  }

  *processTLE(tle) {
    let orbel = extractor.parseTLE(tle);

    yield [
      this.addSatelliteIfNeeded(orbel),
      this.addOrbelement(orbel),
    ];
  }

  *addSatelliteIfNeeded(orbel) {
    let row = yield this.sql.selectLaunch.get(orbel.satnum);

    if (!row)
      yield this.sql.insertSatellite.run(orbel.satnum, orbel.title);

    if (!row || row.launch == null) {
      console.log(`Fetching info for ${orbel.satnum}...`);
      let i = yield* infoFetcher.fetchInfo(orbel.satnum);
      yield this.sql.updateInfo.run(i.intl, i.perigee, i.apogee, i.inclination, i.period,
                                    i.semimajor, i.rcs, i.launch, i.decay, i.source, i.site, i.note,
                                    orbel.satnum);
    }
  }

  *addOrbelement(orbel) {
    let o = orbel;
    yield this.sql.insertOrbelement.run(o.satnum, o.timestamp, o.epochyr, o.epochdays,
                                        o.bstar, o.inclo, o.nodeo, o.ecco, o.argpo, o.mo, o.no);
  }
}

module.exports = Grabber;
