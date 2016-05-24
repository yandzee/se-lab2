'use strict';

//#TODO: manual TLE saving
//#TODO: configuration window

let list = new ListComponent($('#list-component'));
let map  = new MapComponent($('#map-component'));
let info = new InfoComponent($('#info-component'));

list.on('selected', satnum => {
  map.showSatellite(satnum);
  info.showInfo(satnum);
});

list.on('unselected', satnum => {
  map.hideSatellite(satnum);
  info.showLast(satnum);
});

map.on('error', _ => {
  $('#error-modal').modal();
});
