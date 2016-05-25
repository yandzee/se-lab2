'use strict';

const co = require('co');

const { Searcher } = require('./searcher');
const Server = require('./server');

co(function* () {
  let searcher = new Searcher;

  //#TODO: parameterize path to the database.
  yield* searcher.connect('sat.db');

  let server = new Server(searcher);
  server.listen(3000);
}).catch(ex => console.error(ex.stack));
