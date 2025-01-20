const dateObj = new Date();
// Creating Date
const month = (dateObj.getUTCMonth() + 1) < 10 ? String(dateObj.getUTCMonth() + 1).padStart(2, '0') : dateObj.getUTCMonth() + 1 // months from 1-12
const day = dateObj.getUTCDate() < 10 ? String(dateObj.getUTCDate()).padStart(2, '0') : dateObj.getUTCDate()
const year = dateObj.getUTCFullYear();
const currentDate = year + "-" + month + "-" + day;
// Creating Date Time
const currentDateTimeISO = dateObj.toISOString();

module.exports = { currentDate, currentDateTimeISO };