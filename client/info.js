'use strict';

class InfoComponent extends EventEmitter {
  constructor($infoDiv) {
    super();
    this.infoDiv = $infoDiv;
    this.info = [];
  }

  showInfo(satnum) {
    let s = this.info.indexOf(satnum);
    if (s === -1)
      this.info.push(satnum);

    this.displayInfo(satnum);
  }

  showLast(satnum) {
    console.log('in showLast, satnum = ' + satnum);
    let s = this.info.indexOf(satnum);
    if (s !== -1)
      this.info.splice(s, 1);
    let l = this.info.length;
    if (l !== 0)
      this.displayInfo(this.info[l - 1]);
    else
      this.infoDiv.html('Satellite info');
  }

  displayInfo(satnum) {
    let nullchk = (v, fv) => v == null ? '-' : (fv == null ? v : fv);
    fetcher.fetchInfo(satnum).then(info => {
      info.satnum = satnum;
      info.intl = nullchk(info.intl);
      info.perigee = nullchk(info.perigee);
      info.apogee = nullchk(info.apogee);
      info.inclincation = nullchk(info.inclincation);
      info.period = nullchk(info.period);
      info.semimajor = nullchk(info.semimajor);
      info.rcs = nullchk(info.rcs);
      info.launch = nullchk(info.launch, new Date(info.launch));
      info.decay = nullchk(info.decay, new Date(info.decay));
      info.source = nullchk(info.source);
      info.site = nullchk(info.site);
      info.note = nullchk(info.note);

      let html = tmpl('sat-info-template');
      this.infoDiv.html($(html(info)));
    });
  }
}
