'use strict';

class ListComponent extends EventEmitter {
  constructor($listDiv) {
    super();
    this.elems = [];
    this.selected = [];
    this.trs = $listDiv.find('#satellites');
    this.fetchData();
  }

  makeTable(satellites) {
    for (let sat of satellites) {
      let html = tmpl('list-elem-template');
      this.trs.append($(html(sat)));
    }

    this.setTableHandlers();
  }

  fetchData() {
    let f = new Fetcher();
    f.fetchSatellites().then(satellites => {
      this.makeTable(satellites);
    });
  }

  setTableHandlers() {
    this.trs.delegate('tr', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      let $tr = $(e.currentTarget);
      if (e.ctrlKey || e.altKey)
        $tr.toggleClass('active');
      let satnum = $tr.data('satnum');
      if ($tr.hasClass('active'))
        this.emit('selected', satnum);
      else
        this.emit('unselected', satnum);

      return false;
    });
  }

  addElem(elem) {
    this.elems.push(elem);
  }

  addSelected(elem) {
    this.addSelected.push(elem);
    this.emit('selected', elem);
  }

  resetSelected(selectOne) {
    this.selected = [];
    if (selectOne)
      this.selected.push(selectOne);
  }
}
