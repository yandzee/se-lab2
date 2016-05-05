'use strict';

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

$('#config-btn').click(e => {

});

$('#config-save-btn').click(e => {
  $('#config-modal').modal('hide');
});
