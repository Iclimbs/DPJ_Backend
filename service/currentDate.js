const dateObj = new Date();
// Creating Date
const month =
  dateObj.getUTCMonth() + 1 < 10
    ? String(dateObj.getUTCMonth() + 1).padStart(2, "0")
    : dateObj.getUTCMonth() + 1; // months from 1-12
const day =
  dateObj.getUTCDate() < 10
    ? String(dateObj.getUTCDate()).padStart(2, "0")
    : dateObj.getUTCDate();
const year = dateObj.getUTCFullYear();
const currentDate = year + "-" + month + "-" + day;
// Creating Date Time
const currentDateTimeISO = dateObj.toISOString();

const today = new Date();
const futureDate = new Date(today);
futureDate.setDate(today.getDate() + 30); // Add 30 days

const futureyear = String(futureDate.getFullYear()).slice(2); // Get last two digits of the year
const futuremonth = String(futureDate.getMonth() + 1).padStart(2, "0"); // Months are 0-based
const futureday = String(futureDate.getDate()).padStart(2, "0");

const future = `${futureyear}-${futuremonth}-${futureday}`;
console.log(formattedDate);

console.log("currentDate", currentDate);
console.log("iso ", currentDateTimeISO);

module.exports = { currentDate, currentDateTimeISO };
