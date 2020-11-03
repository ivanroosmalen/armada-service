const moment = require('moment-timezone');

function _switchZone(m, zone) {
  let arr = [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second()];
  if(zone) {
    return moment.tz(arr, zone);
  }
  return moment(arr);
}

function safeAddDays(m, days) {
   let oldZone = m.tz();
   let utc = _switchZone(m, 'UTC');
   utc.add(days, 'days');
   return _switchZone(utc, oldZone);
}

module.exports = {
  safeAddDays
}
