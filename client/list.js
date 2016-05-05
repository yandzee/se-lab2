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
    let $trs = this.table.find('tr');
    let $titles = $trs.find('td:nth(0)');
    let $ids = $trs.find('td:nth(1)');

    let filterHandler = ($searchSet, preHandle) => {

      let handler = e => {
        $trs.removeClass('hide');
        let input = e.target.value;
        input = preHandle(input);
        
        let re = new RegExp(input, 'i');

        $searchSet.filter((_, elem) => !re.test($(elem).text()))
                  .closest('tr')
                  .addClass('hide');
      };

      return throttle(handler, 300);
    };

    $tFilter.keyup(filterHandler($titles, input => {
      input = input.split('').map(c => escapeRegExp(c)).join('.*');
      input = '.*' + input + '.*';
      return input;
    }));

    $idFilter.keyup(filterHandler($ids, input => '.*' + input + '.*'));
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
