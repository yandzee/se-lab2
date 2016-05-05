$.fn.setDate = function (d, onlyBlank) {
  let year;
  let month;
  let date;
  let hours;
  let minutes;
  let seconds;
  let formattedDateTime;

  year = d.getFullYear();
  month = (d.getMonth() + 1).toString().length === 1 ? '0' + (d.getMonth() + 1).toString() : d.getMonth() + 1;
  date = d.getDate().toString().length === 1 ? '0' + (d.getDate()).toString() : d.getDate();
  hours = d.getHours().toString().length === 1 ? '0' + d.getHours().toString() : d.getHours();
  minutes = d.getMinutes().toString().length === 1 ? '0' + d.getMinutes().toString() : d.getMinutes();
  seconds = d.getSeconds().toString().length === 1 ? '0' + d.getSeconds().toString() : d.getSeconds();

  formattedDateTime = year + '-' + month + '-' + date + 'T' + hours + ':' + minutes + ':' + seconds;

  if (onlyBlank === true && $(this).val()) {
    return this;
  }
  $(this).val(formattedDateTime);  
  return this;
}