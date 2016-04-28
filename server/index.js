'use strict';

const co = require('co');

const Searcher = require('./searcher');

co(function* () {
  let searcher = new Searcher;
  yield* searcher.connect('sat.db');
  let result = yield* searcher.period(12003);
  console.log(result);
}).catch(ex => console.error(ex.stack));
