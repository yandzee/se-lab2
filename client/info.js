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
    let sat = Satellite.get(satnum);
    sat.info().then(info => {
      // return sat.azimuth().then(az => {
      //   Object.assign(info, az);
      // });
      return info;
    }).then(info => {
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

      if (info.startAz == null ||
          info.startUTC == null ||
          info.startAzCompass == null)
        info.startAz = null;
      else {
        info.startAz = getLocalDate(info.startUTC) + ' ' + getLocalTime(info.startUTC);
        info.startAz += '<br>' + startAz + '&deg; ' + info.startAzCompass;
      }

      if (info.endAz == null ||
          info.endUTC == null ||
          info.endAzCompass == null)
        info.endAz = null;
      else {
        info.endAz = getLocalDate(info.endUTC) + ' ' + getLocalTime(info.endUTC);
        info.endAz += '<br>' + endAz + '&deg; ' + info.endAzCompass;
      }

      let html = tmpl('sat-info-template');
      this.infoDiv.html($(html(info)));
    });
  }
}
