'use strict';

class ListComponent extends EventEmitter {
  constructor($listDiv) {
    super();
    this.selected = 0;
    this.table = $listDiv.find('#satellites');
    this.titleFilter = $listDiv.find('#title-filter');
    this.idFilter = $listDiv.find('#id-filter');
    this.titleSort = $listDiv.find('#title-sort');
    this.idSort = $listDiv.find('#id-sort');
    this.nextSelected = $listDiv.find('#next-selected');

    Satellite.load().then(satellites => {
      this._makeTable(satellites);
      this._setTableHandlers();
      this._makeFilters();
    });
  }

  _makeFilters() {
    let $tFilter = this.titleFilter;
    let $idFilter = this.idFilter;
    let $tbody = this.table;
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
      if ($tr.hasClass('info')) {
        this._emit('selected', satnum);
        this.selected += 1;
      } else {
        this._emit('unselected', satnum);
        this.selected -= 1;
      }

      if (this.selected)
        this.nextSelected.removeClass('disabled');
      else
        this.nextSelected.addClass('disabled');

      return false;
    });

    this.nextSelected.click(e => {
      let $tbody = this.table;
      let $div = $tbody.closest('div');
      let $selected = $tbody.find('tr.info');
      if ($selected.length === 0)
        return;

      let tbOffset = $tbody.position().top;
      let divScroll = $div.position().top - tbOffset;
      let height = $div.height();

      let visible = e => {
        let offset = e.position().top - tbOffset;
        return offset >= divScroll && offset - divScroll <= height;
      };

      let next = e => e.position().top - tbOffset - divScroll >= height;

      let $invisible = $selected.filter((_, e) => !visible($(e)));
      let $next = $invisible.filter((_, e) => next($(e)));
      if ($next.length === 0)
        $next = $selected.first();
      $div.scrollTop($next.first().position().top - tbOffset);
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
