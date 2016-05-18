'use strict';

class InfoComponent extends EventEmitter {
  constructor($infoDiv) {
    super();
    this.infoDiv = $infoDiv.find('#info-content');
    this.info = [];
  }

  showInfo(satnum) {
    let s = this.info.indexOf(satnum);
    if (s === -1)
      this.info.push(satnum);

    this.displayInfo(satnum);
  }

  showLast(satnum) {
    let s = this.info.indexOf(satnum);
    if (s !== -1)
      this.info.splice(s, 1);
    let l = this.info.length;
    if (l !== 0)
      this.displayInfo(this.info[l - 1]);
    else
      this.infoDiv.html('<h3>Satellite info</h3>');
  }

  displayInfo(satnum) {
    let fixProp = (obj, prop, handle) =>
      obj[prop] == null ? (obj[prop] = '-')
                        : (handle == null ? 0 : (obj[prop] = handle(obj[prop])));
    let sat = Satellite.get(satnum);
    let props = ['intl', 'perigee', 'apogee', 'inclination', 'period',
                 'semimajor', 'rcs', 'source', 'site', 'note'];

    let dateProps = ['launch', 'decay'];
    let formatDate = (date) =>
      new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric',
      })

    sat.info().then(info => {
      info.satnum = satnum;
      console.log(info);
      for (let prop of props)
        fixProp(info, prop);
      for (let prop of dateProps)
        fixProp(info, prop, formatDate);
      console.log(info);
      let html = tmpl('sat-info-template');
      this.infoDiv.html($(html(info)));
    });
  }
}
