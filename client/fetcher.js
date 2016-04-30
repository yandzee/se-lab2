'use strict';

class Fetcher {
  fetchSatellites() {
    return new Promise((resolve, reject) => {
      $.get(window.location.origin + '/satellites', (data) => {
        resolve(data);
      });
    });
  }

  fetchRevolutions(satnum) {
    return new Promise((resolve, reject) => {
      $.get(window.location.origin + '/revol', { satnum }, (data) => {
        resolve(data);
      });
    });
  }
}
