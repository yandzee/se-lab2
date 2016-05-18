'use strict';

class ListComponent extends EventEmitter {
  constructor($listDiv) {
    super();
    this.elems = [];
    this.selected = [];
    this.table = $listDiv.find('#satellites');
    this.titleFilter = $listDiv.find('#title-filter');
    this.idFilter = $listDiv.find('#id-filter');

    Satellite.load().then(satellites => {
      this.makeTable(satellites);
      this.setTableHandlers();
      this.makeFilters();
    });
  }

  makeFilters() {
    let $tFilter = this.titleFilter;
    let $idFilter = this.idFilter;
    let $tbody = $('#satellites');
    let $prev = $(null);

    let handler = throttle(_ => {
      if ($prev) $prev.removeClass('selected');
      let title = $tFilter.val().trim().toLowerCase();
      let id = $idFilter.val().trim();

      $tbody.toggleClass('search', !!(title || id));
      let titleSearch = title ? `[data-title*="${title}"]` : '';
      let idSearch = id ? `[data-satnum*="${id}"]` : '';
      $prev = $tbody.find(`tr` + titleSearch + idSearch)
                    .addClass('selected');
    }, 150);

    $tFilter.on('input', handler);
    $idFilter.on('input', handler);
  }

  makeTable(satellites) {
    for (let sat of satellites) {
      let html = tmpl('list-elem-template');
      this.table.append($(html(sat)));
    }
  }

  setTableHandlers() {
    this.table.delegate('tr', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!e.ctrlKey && !e.altKey)
        return;
      let $tr = $(e.currentTarget);
      $tr.toggleClass('info');
      let satnum = $tr.data('satnum');
      if ($tr.hasClass('info'))
        this.emit('selected', satnum);
      else
        this.emit('unselected', satnum);

      return false;
    });
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
