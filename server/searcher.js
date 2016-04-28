'use strict';

const sqlite3 = require('co-sqlite3');

class Searcher {
  *connect(dbname) {
    let db = this.db = yield sqlite3(dbname);

    this.sql = yield {
      selectRecent: db.prepare(`select max(timestamp), * from orbelement where satnum = ?`),
      selectClosest: db.prepare(`
              select max(timestamp), * from orbelement where satnum = ?1 and timestamp <= ?2
        union select min(timestamp), * from orbelement where satnum = ?1 and timestamp >= ?2`),
      selectBetween: db.prepare(`select * from orbelement
                                 where satnum = ? and timestamp between ? and ?`),
    };
  }

  *closest(satnum, timestamp) {
    if (timestamp == null) {
      let result = yield this.sql.selectRecent.get(satnum);
      if (!result.satnum)
        throw new Error('No such satellite');

      return result;
    }

    let candidates = yield this.sql.selectClosest.all(satnum, timestamp);

    if (candidates.length < 2)
      throw new Error('No such satellite');

    if (!candidates[0].satnum || !candidates[1].satnum)
      return candidates[0].satnum ? candidates[0] : candidates[1];

    let c0dts = Math.abs(timestamp - candidates[0].timestamp);
    let c1dts = Math.abs(timestamp - candidates[1].timestamp);

    return c0dts < c1dts ? candidates[0] : candidates[1];
  }

  *period(satnum, timestamp0, timestamp1) {
    let ends = yield [
      this.closest(satnum, timestamp0),
      this.closest(satnum, timestamp1),
    ];

    return yield this.sql.selectBetween.all(satnum, ends[0].timestamp, ends[1].timestamp);
  }

  *revolutions(satnum, timestamp, nrevs) {
    nrevs = nrevs || 1;

    let no = (yield* this.closest(satnum, timestamp)).no;

    // Stationary orbit.
    if (Math.round(no * 100) === 0)
      return [];

    let revTime = 24 * 60 * 60 * 1000 * nrevs / no;
    let window = revTime / 1.99;

    return yield* this.period(satnum, timestamp - window, timestamp + window);
  }
}

module.exports = Searcher;
