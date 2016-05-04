'use strict';

const request = require('request-promise');

const baseUrl = 'http://www.n2yo.com/satellite/?s=';

function parse(html) {
  let start = html.indexOf('<div id="satinfo">');
  let end = html.indexOf('</div>', start);

  let lines = html.slice(start, end).split('<br/>');
  let raw = Object.create(null);

  for (let line of lines) {
    line = line.replace(/<.+?>/g, '').trim();
    let pair = line.split(': ');
    raw[pair[0].toLowerCase()] = pair[1];
  }

  // Strange but relatively reliable way to determine the missing satellite.
  if ('norad id:' in raw)
    return {};

  return raw;
}

function unify(raw) {
  let info = Object.create(null);

  function _(n, r, c) {
    if (typeof r === 'function') {
      c = r;
      r = n;
    } else
      r = r || n;

    if (r in raw) {
      let val = c ? c(raw[r]) : raw[r];
      if (val)
        info[n] = val;
    }
  }

  _('intl', 'int\'l code');
  _('perigee', parseFloat);
  _('apogee', parseFloat);
  _('inclination', parseFloat);
  _('period', parseFloat);
  _('semimajor', 'semi major axis', parseFloat);
  _('rcs', parseFloat);
  _('launch', 'launch date', v => Date.parse(`${v} GMT`));
  _('decay', 'decay date', v => Date.parse(`${v} GMT`));
  _('source');
  _('site', 'launch site');
  _('note');

  return info;
}

function *fetchInfo(satnum) {
  let data = yield request(`${baseUrl}${satnum}`);
  let raw = parse(data);
  let info = unify(raw);

  return info;
}

exports.fetchInfo = fetchInfo;
