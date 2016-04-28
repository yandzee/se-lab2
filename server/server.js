'use strict';

const fs = require('fs');
const path = require('path');
const koa = require('koa');

class Server {
  constructor(searcher) {
    let app = this.app = koa();

    app.context.searcher = searcher;

    app.use(this.logger);
    app.use(this.period);
    app.use(this.revol);
    app.use(this.file);
  }

  listen(port) {
    this.app.listen(port);
  }

  /*
   * Middlewares.
   */

  *logger(next) {
    let start = Date.now();
    yield* next;
    let ms = Date.now() - start;
    console.log('%s %s - %sms', this.method, this.url, ms);
  }

  *period(next) {
    if (this.path !== '/period')
      return yield* next;

    let asNum = str => +(str || NaN);
    let satnum = asNum(this.query.satnum);
    let ts0 = asNum(this.query.ts0);
    let ts1 = asNum(this.query.ts1) || Date.now();

    let allAreSafe = [satnum, ts0, ts1].every(Number.isSafeInteger);
    if (!allAreSafe || satnum < 0) {
      this.status = 422;
      return;
    }

    let result = yield* this.searcher.period(satnum, ts0, ts1);
    console.log(result);

    this.type = 'json';
    this.body = result;
  }

  *revol(next) {
    if (this.path !== '/revol')
      return yield* next;

    let asNum = str => +(str || NaN);
    let satnum = asNum(this.query.satnum);
    let ts = asNum(this.query.ts) || Date.now();
    let nrevs = asNum(this.query.nrevs) || 1;

    let allAreSafe = [satnum, ts, nrevs].every(Number.isSafeInteger);
    if (!allAreSafe || satnum < 0 || nrevs < 1) {
      this.status = 422;
      return;
    }

    let result = yield* this.searcher.revolutions(satnum, ts, nrevs);
    console.log(result);

    this.type = 'json';
    this.body = result;
  }

  *file(next) {
    let rpath = this.path === '/' ? '/index.html' : this.path;
    let fpath = path.resolve(__dirname + '/../client' + rpath);
    try {
      let fstat = yield done => fs.stat(fpath, done);
      if (fstat.isFile()) {
        this.type = path.extname(fpath);
        this.body = fs.createReadStream(fpath);
      }
    } catch (_) {
      return yield* next;
    }
  }
}

module.exports = Server;
