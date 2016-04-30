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
