'use strict';

class InfoComponent extends EventEmitter {
  constructor($infoDiv) {
    super();
    this.infoDiv = $infoDiv;
    this.info = [];
  }

  showInfo(satnum) {
    let s = this.info.indexOf(satnum);
    if (s !== -1)
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
  }

  displayInfo(satnum) {
    fetcher.fetchInfo(satnum).then(info => {
      info.satnum = satnum;
      info.intl = info.intl || '-';
      info.perigee = info.perigee || '-';
      info.apogee = info.apogee || '-';
      info.inclincation = info.inclincation || '-';
      info.period = info.period || '-';
      info.semimajor = info.semimajor || '-';
      info.rcs = info.rcs || '-';
      info.launch = (new Date(info.launch)) || '-';
      info.decay = info.decay || '-';
      info.source = info.source || '-';
      info.site = info.site || '-';
      info.note = info.note || '-';

      let html = tmpl('sat-info-template');
      this.infoDiv.html($(html(info)));
    });
  }
}
