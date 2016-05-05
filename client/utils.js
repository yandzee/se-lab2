'use strict';

class EventEmitter {
  constructor() {
    this.events = Object.create(null);
  }

  on(event, handler) {
    if (!this.events[event])
      this.events[event] = [handler];
    else
      this.events[event].push(handler);
  }

  emit(event, ...data) {
    if (!(event in this.events))
      return;

    for (let handler of this.events[event])
      handler(...data);
  }
}

function tmpl(id) {
  let html = document.getElementById(id).innerHTML;
  let re = /<%(.+?)%>/g;
  let reExp = /(^( )?(var|if|for|else|switch|case|break|{|}|;))(.*)?/g;
  let code = 'with(__obj) { var r=[];\n';
  let cursor = 0;
  let match;
  let result;

  function add(line, js) {
    js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n')
       : (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
    return add;
  }

  while (match = re.exec(html)) {
    add(html.slice(cursor, match.index))(match[1], true);
    cursor = match.index + match[0].length;
  }

  add(html.substr(cursor, html.length - cursor));

  code = (code + 'return r.join(""); }').replace(/[\r\t\n]/g, ' ');
  return new Function('__obj', code);
}

function throttle(f, ms) {
  let timerId;
  let _this = this;

  let wrapper = (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => f.apply(_this, args), ms);
  };

  return wrapper;
}

function randInt(min, max) {
  return Math.round(min - 0.5 + Math.random() * (max - min + 1));
}

function gLatLngDeg(p) {
  let c = 180 / Math.PI;
  return new google.maps.LatLng(c * p.latitude, c * p.longitude);
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

function azCompass(deg) {
  if (deg == null) return null;
  let a = 0;
  if ((deg >= a) && (deg < a + 15))
    return 'N';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'NNE';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'NE';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'NE';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'ENE';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'E';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'E';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'ESE';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'SE';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'SE';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'SSE';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'S';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'S';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'SSW';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'SW';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'SW';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'WSW';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'W';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'W';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'WNW';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'NW';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'NW';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'NNW';
  a = a + 15;
  if ((deg >= a) && (deg < a + 15))
    return 'N';
  a = a + 15;
}

function getLocalTime(t) {
  if (t == null) return null;
  let dtmp = new Date();
  let tz = 60 * 1000 * dtmp.getTimezoneOffset();
  let d = new Date(t * 1000 - tz);
  let h = d.getUTCHours();
  let m = d.getUTCMinutes();
  let d = d.getUTCDate();
  if (h < 10) h = '0' + h;
  if (m < 10) m = '0' + m;
  let hm = h + ':' + m;
  return hm;
}

function getLocalDate(t) {
  if (t == null) return null;
  let dtmp = new Date();
  let tz = 60 * 1000 * dtmp.getTimezoneOffset();
  let d = new Date(t * 1000 - tz);
  let dt = d.getUTCDate();
  let m = d.getUTCMonth();
  let mo = months[m];
  let md = mo + ' ' + dt;
  return md;
}
