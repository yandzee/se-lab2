'use strict';

const satellite = require('satellite.js').satellite;

function checkStats(stats) {
  for (let stat in stats)
    if (Number.isNaN(stats[stat]))
      return false;

  return true;
}

function calcTimestamp(eyear, edays) {
  let year = eyear < 57 ? 2000 + eyear : 1900 + eyear;
  return Date.UTC(year, 0, 1) + 1440 * (edays - 1) * 60 * 1000;
}

exports.parse = function (tle) {
  let lines = tle.split('\n');

  let title = '';
  let stats;

  if (lines.length === 3) {
    title = lines[0].slice(0, 24).trim();
    stats = satellite.parseTwoline(lines[1], lines[2]);
  } else if (lines.length === 2)
    stats = satellite.parseTwoline(lines[0], lines[1]);
  else
    throw new Error('Invalid number of lines');

  if (!checkStats(stats))
    throw new Error('Bad values');

  let timestamp = calcTimestamp(stats.epochyr, stats.epochdays);

  return { title, timestamp, stats };
};
