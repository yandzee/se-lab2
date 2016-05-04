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

let throttle = (f, ms) => {
  let timerId;

  let wrapper = (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => f.apply(this, args), ms);
  };

  return wrapper;
};

function randInt(min, max) {
  return Math.round(min - 0.5 + Math.random() * (max - min + 1));
}

function gLatLngDeg(p) {
  let c = 180 / Math.PI;
  return new google.maps.LatLng(c * p.latitude, c * p.longitude);
}

$.fn.setDate = function (d, onlyBlank) {
  let year;
  let month;
  let date;
  let hours;
  let minutes;
  let seconds;
  let formattedDateTime;

  year = d.getFullYear();
  month = (d.getMonth() + 1).toString().length === 1 ? '0' + (d.getMonth() + 1).toString() : d.getMonth() + 1;
  date = d.getDate().toString().length === 1 ? '0' + (d.getDate()).toString() : d.getDate();
  hours = d.getHours().toString().length === 1 ? '0' + d.getHours().toString() : d.getHours();
  minutes = d.getMinutes().toString().length === 1 ? '0' + d.getMinutes().toString() : d.getMinutes();
  seconds = d.getSeconds().toString().length === 1 ? '0' + d.getSeconds().toString() : d.getSeconds();

  formattedDateTime = year + '-' + month + '-' + date + 'T' + hours + ':' + minutes + ':' + seconds;

  if (onlyBlank === true && $(this).val()) {
    return this;
  }
  $(this).val(formattedDateTime);  
  return this;
}
