'use strict';

const fs = require('fs');
const path = require('path');
const koa = require('koa');

class Server {
  constructor(searcher) {
    let app = this.app = koa();

    app.context.searcher = searcher;

    app.use(this.logger);
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
