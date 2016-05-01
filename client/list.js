'use strict';

class ListComponent extends EventEmitter {
  constructor($listDiv) {
    super();
    this.elems = [];
    this.selected = [];
    this.table = $listDiv.find('#satellites');
    this.titleFilter = $listDiv.find('#title-filter');
    this.idFilter = $listDiv.find('#id-filter');

    this.fetchData().then(() => {
      this.makeFilters();
    });
  }

  makeFilters() {
    let $tFilter = this.titleFilter;
    let $idFilter = this.idFilter;
    let $trs = this.table.find('tr');
    let $titles = $trs.find('td:nth(0)');
    let $ids = $trs.find('td:nth(1)');

    let filterHandler = $searchSet => {

      let handler = e => {
        $trs.removeClass('hide');
        let re = new RegExp(e.target.value, 'i');

        $searchSet.filter((_, elem) => !re.test($(elem).text()))
                  .closest('tr')
                  .addClass('hide');
      };

      return throttle(handler, 400);
    };

    $tFilter.keyup(filterHandler($titles));
    $idFilter.keyup(filterHandler($ids));
  }

  makeTable(satellites) {
    for (let sat of satellites) {
      let html = tmpl('list-elem-template');
      this.table.append($(html(sat)));
    }

    this.setTableHandlers();
  }

  fetchData() {
    let f = new Fetcher();
    return f.fetchSatellites().then(satellites => {
      this.makeTable(satellites);
    });
  }

  setTableHandlers() {
    this.table.delegate('tr', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      let $tr = $(e.currentTarget);
      if (e.ctrlKey || e.altKey)
        $tr.toggleClass('info');
      let satnum = $tr.data('satnum');
      if ($tr.hasClass('info'))
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
