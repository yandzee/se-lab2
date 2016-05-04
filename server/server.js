'use strict';

const fs = require('fs');
const path = require('path');
const koa = require('koa');

const { NoSuchSatelliteError } = require('./searcher');

class QueryParamError extends Error {
  constructor() {
    super(`Invalid value of param`);
  }
}

function check(rule) {
  return (str, def) => {
    if (str == null && def != null)
      return def;

    let val = Number(str || NaN);

    if (Number.isSafeInteger(val) && rule(val))
      return val;
    else
      throw new QueryParamError;
  };
}

check.integer = check(_ => true);
check.unsigned = check(v => 0 <= v);
check.positive = check(v => 1 <= v);

class Server {
  constructor(searcher) {
    let app = this.app = koa();

    app.context.searcher = searcher;

    app.use(this.logger);

    app.use(this.checker);
    app.use(this.satellites);
    app.use(this.info);
    app.use(this.period);
    app.use(this.revol);

    app.use(this.file);
  }

  listen(port) {
    this.app.listen(port);
  }

  /*
   * Middlewares.
   * `this` refers to koa context.
   */

  *logger(next) {
    let start = Date.now();
    yield* next;
    let ms = Date.now() - start;
    console.log('%s %s - %sms', this.method, this.url, ms);
  }

  *checker(next) {
    try {
      yield* next;
    } catch (ex) {
      if (ex instanceof QueryParamError || ex instanceof NoSuchSatelliteError) {
        this.status = 422;
        this.message = ex.message;
        return;
      }

      throw ex;
    }
  }

  *satellites(next) {
    if (this.path !== '/satellites')
      return yield* next;

    this.type = 'json';
    this.body = yield* this.searcher.satellites();
  }

  *info(next) {
    if (this.path !== '/info')
      return yield* next;

    let satnum = check.positive(this.query.satnum);
    let info = yield* this.searcher.info(satnum);

    this.type = 'json';
    this.body = info;
  }

  *period(next) {
    if (this.path !== '/period')
      return yield* next;

    let q = this.query;
    let satnum = check.positive(q.satnum);
    let ts0 = check.integer(q.ts0);
    let ts1 = check.integer(q.ts1, Date.now());

    let result = yield* this.searcher.period(satnum, ts0, ts1);

    this.type = 'json';
    this.body = result;
  }

  *revol(next) {
    if (this.path !== '/revol')
      return yield* next;

    let q = this.query;
    let satnum = check.positive(q.satnum);
    let ts = check.integer(q.ts, Date.now());
    let nrevs = check.positive(q.nrevs, 1);

    let result = yield* this.searcher.revolutions(satnum, ts, nrevs);

    this.type = 'json';
    this.body = result;
  }

  *file(next) {
    let rpath = this.path === '/' ? '/index.html' : this.path;
    let fpath = path.resolve(__dirname + '/../client' + rpath);

    //#XXX: workaround until the pull request is accepted.
    if (this.path === '/satellite.min.js')
      fpath = path.resolve(__dirname + '/../node_modules/satellite.js/dist' + this.path);

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
