'use strict';

class ListComponent extends EventEmitter {
  constructor($listDiv) {
    super();
    this.elems = [];
    this.selected = [];
    this.table = $listDiv.find('#satellites');
    this.titleFilter = $listDiv.find('#title-filter');
    this.idFilter = $listDiv.find('#id-filter');
    this.titleSort = $listDiv.find('#title-sort');
    this.idSort = $listDiv.find('#id-sort');

    Satellite.load().then(satellites => {
      this._makeTable(satellites);
      this._setTableHandlers();
      this._makeFilters();
    });
  }

  _makeFilters() {
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

  _makeTable(satellites) {
    for (let sat of satellites) {
      let html = tmpl('list-elem-template');
      this.table.append($(html(sat)));
    }
  }

  _setTableHandlers() {
    this.table.delegate('tr', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!e.ctrlKey && !e.altKey)
        return;
      let $tr = $(e.currentTarget);
      $tr.toggleClass('info');
      let satnum = $tr.data('satnum');
      if ($tr.hasClass('info'))
        this._emit('selected', satnum);
      else
        this._emit('unselected', satnum);

      return false;
    });

    let titleSortToggle = 1;
    let idSortToggle = 1;

    this.titleSort.click(e => {
      let elems = this.table.find('tr');
      elems.sort((a, b) => {
        let aVal = $(a).data('title');
        let bVal = $(b).data('title');

        if (aVal > bVal) {
          return -titleSortToggle;
        } else {
          return titleSortToggle;
        }
      });
      titleSortToggle = -titleSortToggle;
      this.titleSort.find('span').toggleClass('glyphicon-triangle-top');
      elems.remove();
      this.table.append(elems);
    });

    this.idSort.click(e => {
      let elems = this.table.find('tr');
      elems.sort((a, b) => {
        let aVal = $(a).data('satnum');
        let bVal = $(b).data('satnum');

        if (aVal > bVal) {
          return -idSortToggle;
        } else {
          return idSortToggle;
        }
      });
      idSortToggle = -idSortToggle;
      this.idSort.find('span').toggleClass('glyphicon-triangle-top');
      elems.remove();
      this.table.append(elems);
    });
  }

  _addSelected(elem) {
    this.addSelected.push(elem);
    this._emit('selected', elem);
  }

  _resetSelected(selectOne) {
    this.selected = [];
    if (selectOne)
      this.selected.push(selectOne);
  }
}
