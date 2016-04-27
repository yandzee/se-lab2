'use strict';

const request = require('request-promise');

const baseUrl = 'https://www.celestrak.com/NORAD/elements';
const names = [
  'tle-new',
  'stations',
  'visual',
  '1999-025',
  'iridium-33-debris',
  'cosmos-2251-debris',
  '2012-044',
  'weather',
  'noaa',
  'goes',
  'resource',
  'sarsat',
  'dmc',
  'tdrss',
  'argos',
  'geo',
  'intelsat',
  'gorizont',
  'raduga',
  'molniya',
  'iridium',
  'orbcomm',
  'globalstar',
  'amateur',
  'x-comm',
  'other-comm',
  'gps-ops',
  'glo-ops',
  'galileo',
  'beidou',
  'sbas',
  'nnss',
  'musson',
  'science',
  'geodetic',
  'engineering',
  'education',
  'military',
  'radar',
  'cubesat',
  'other',
];

exports.info = 'celestrak.com';

function *fetchByName(name) {
  let data = yield request(`${baseUrl}/${name}.txt`);

  let tles = [];
  let lines = data.trim().split(/\r\n|\r|\n/);

  for (let i = 0; i < lines.length; i += 3)
    tles.push(lines.slice(i, i + 3).join('\n'));

  return tles;
}

exports.fetch = function* () {
  let tles = yield names.map(fetchByName);
  return [].concat(...tles);
};
