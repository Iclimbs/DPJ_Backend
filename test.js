

const currentDate = new Date();
const dateObj = new Date(currentDate.setDate(currentDate.getDate() + 30));
// Creating Date
const month = (dateObj.getUTCMonth() + 1) < 10 ? String(dateObj.getUTCMonth() + 1).padStart(2, '0') : dateObj.getUTCMonth() + 1 // months from 1-12
const day = dateObj.getUTCDate() < 10 ? String(dateObj.getUTCDate()).padStart(2, '0') : dateObj.getUTCDate()
const year = dateObj.getUTCFullYear();
const endDate = year + "-" + month + "-" + day;
