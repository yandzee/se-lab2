'use strict';

let list = new ListComponent($('#list-component'));
let map  = new MapComponent($('#map-component'));

list.on('selected', satnum => {
  map.showSatellite(satnum);
});

list.on('unselected', satnum => {
  map.hideSatellite(satnum);
});

$('#config-btn').click(e => {

});

$('#config-save-btn').click(e => {
  console.log('Saving...');
  $('#config-modal').modal('hide');
});
