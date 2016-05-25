'use strict';

const co = require('co');

const Grabber = require('./grabber');
const fetchers = require('./fetchers');

co(function* () {
  let grabber = new Grabber;

  //#TODO: parameterize path to the database.
  yield* grabber.connect('sat.db');
  yield fetchers.map(f => grabber.grab(f));
}).catch(ex => console.error(ex.stack));
