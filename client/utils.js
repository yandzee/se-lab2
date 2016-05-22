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

function hsv2Rgb(h, s, v) {
  let hi = (h * 6) | 0;
  let f = h * 6 - hi;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  let r;
  let g;
  let b;
  if (hi === 0)
    [r, g, b] = [v, t, p];
  if (hi === 1)
    [r, g, b] = [q, v, p];
  if (hi === 2)
    [r, g, b] = [p, v, t];
  if (hi === 3)
    [r, g, b] = [p, q, v];
  if (hi === 4)
    [r, g, b] = [t, p, v];
  if (hi === 5)
    [r, g, b] = [v, p, q];
  return { r: (r * 256) | 0, g: (g * 256) | 0, b: (b * 256) | 0 };
}

function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function randomColor() {
  let goldenRatio = 0.61803398875;
  let hue = Math.random() + goldenRatio;
  hue -= hue | 0;
  let { r, g, b } = hsv2Rgb(hue, 0.99, 0.99);
  let hex = rgbToHex(r, g, b);
  return hex;
}

function serialize(obj) {
  return Object.keys(obj).map(key =>
    encodeURIComponent(key) + '=' + encodeURIComponent(obj[key])
  ).join('&');
}
