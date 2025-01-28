// Getting Current Date
const dateObj = new Date();
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
// Current Date In String
const currentDateTimeISO = dateObj.toISOString();

// Getting 30 days After Current Date
const today = new Date();
const futureDate = new Date(today);
futureDate.setDate(today.getDate() + 30); // Add 30 days

const futureyear = String(futureDate.getFullYear()).slice(2); // Get last two digits of the year
const futuremonth = String(futureDate.getMonth() + 1).padStart(2, "0"); // Months are 0-based
const futureday = String(futureDate.getDate()).padStart(2, "0");

const futuredate = `${futureyear}-${futuremonth}-${futureday}`;

function getDateAfter30Days(inputDate) {
  // Parse the input date
  const date = new Date(inputDate);

  // Add 30 days to the date
  date.setDate(date.getDate() + 30);

  // Format the resulting date as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

module.exports = {
  futuredate,
  currentDate,
  currentDateTimeISO,
  getDateAfter30Days,
};
