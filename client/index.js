'use strict';

jQuery.cachedScript = function (url, options) {
  options = $.extend(options || {}, {
    dataType: 'script',
    cache: true,
    url: url,
  });

  return jQuery.ajax(options);
};

$('#navigation a').click(e => {
  e.preventDefault();
  let $a = $(e.target);
  let container = $a.attr('href');
  let page = $a.attr('data-tab-file');
  $(container).load(page);
  $(this).tab('show');
});
