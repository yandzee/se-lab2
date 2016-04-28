'use strict';

class Fetcher {
  fetchSatellites() {
    return new Promise((resolve, reject) => {
      resolve([
        { title: 'shit1', satnum: 1 },
        { title: 'shit2', satnum: 2 },
        { title: 'shit3', satnum: 3 },
      ]);
    });
  }
}
