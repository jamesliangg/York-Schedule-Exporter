var fallArray = [];
var winterArray = [];
var summerArray = []; // New array for summer courses
var fullYearArray = [];
var beginningFormat = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//James Liang//York Exporter//EN`;
var ending = 'END:VCALENDAR';
var fallStart = "";
var fallEnd = "";
var winterStart = "";
var winterEnd = "";
var summerStart = ""; // New variable for summer start
var summerEnd = ""; // New variable for summer end
var fileOutput = "";
var academicYear = 2024;

function mainFunction() {
    textToArray();
    semesterDates();
}

/**
 * Takes pasted text and splits it into different arrays.
 */
function textToArray() {
    var pastedText = document.getElementById("input").value;
    console.log(pastedText);
    // split classes into array
    var pastedArray = pastedText.split("\n");
    // remove blank lines
    pastedArray = pastedArray.filter((a) => a);
    // add Term and Course Name to classes that are missing
    for (var i in pastedArray) {
        if (!pastedArray[i].includes("Fall") && !pastedArray[i].includes("Winter") && !pastedArray[i].includes("Summer") && pastedArray[i].includes(":")) {
            pastedArray[i] = pastedArray[i - 1].substring(0, pastedArray[i - 1].indexOf("Cr=") + 9) + " " + pastedArray[i];
        }
    }
    // add courses to array based on term
    for (var i in pastedArray) {
        if (pastedArray[i].includes("Fall")) {
            if (pastedArray[i].includes("Winter")) {
                fallArray.push(pastedArray[i].replace("/Winter", ""));
            } else {
                fallArray.push(pastedArray[i]);
            }
        }
        if (pastedArray[i].includes("Winter")) {
            if (pastedArray[i].includes("Fall")) {
                winterArray.push(pastedArray[i].replace("Fall/", ""));
            } else {
                winterArray.push(pastedArray[i]);
            }
        }
        if (pastedArray[i].includes("Summer")) { // Handle summer courses
            summerArray.push(pastedArray[i]);
        }
    }
}

/**
 * Finds start and end dates for Fall, Winter, and Summer. Days added based on uoftAcademicYear.xlsx located in repository.
 */
function semesterDates() {
    // Labour Day
    var labourDay = new Date(academicYear, 8, 1);
    labourDay.setDate(labourDay.getDate() + (((1 + 7 - labourDay.getDay()) % 7) || 7));
    console.log(labourDay);
    // first Wednesday after Labour Day
    fallStart = String(labourDay.getDate() + 2);
    console.log(fallStart);
    // 90 days after first day
    fallEnd = String(addDays(labourDay, 93).getDate());
    console.log(fallEnd);
    // 33 days after fall end
    winterStart = String(addDays(labourDay, 126).getDate());
    console.log(winterStart);
    // 88 days after first day
    winterEnd = String(addDays(labourDay, 214).getDate());
    console.log(winterEnd);
    // Summer term dates
    var summerStartDate = new Date(academicYear + 1, 4, 1); // May 1st
    summerStart = String(summerStartDate.getDate());
    summerEnd = String(addDays(summerStartDate, 99).getDate()); // 99 days for summer term
    console.log(summerStart, summerEnd);
    createCalendar();
}

/**
 * Calls functions to create and download calendar.
 */
function createCalendar() {
    // iCalendar formatting
    fileOutput = beginningFormat;
    // adds Fall, Winter, and Summer courses
    courseEvent(fallArray);
    courseEvent(winterArray);
    courseEvent(summerArray);
    // iCalendar formatting
    fileOutput = fileOutput + "\n" + ending;
    // download file
    download("york_schedule.ics", fileOutput);
}

/**
 * Formats each course for iCalendar and adds it to the output String.
 * 
 * @param {Array} seasonArray term array to go through
 */
function courseEvent(seasonArray) {
    for (var i in seasonArray) {
        // find beginning time of course Format: YYYYMMDDTHHMMSS
        var beginTime = findBeginTime(seasonArray[i]);
        // find ending time of course Format: YYYYMMDDTHHMMSS
        var endTime = yorkDuration(seasonArray[i].substring(seasonArray[i].indexOf("min") - 4, seasonArray[i].indexOf("min") - 1).trim(), beginTime);
        // find weekday Format: MO, TU, WE, TH, FR
        var weekday = seasonArray[i].substring(seasonArray[i].indexOf(":") - 6, seasonArray[i].indexOf(":") - 3).trim().substring(0, 2);
        // iCalendar formatting for events
        fileOutput = fileOutput + "\n" + ("BEGIN:VEVENT");
        fileOutput = fileOutput + "\n" + ("DTSTART:" + firstWeekday(beginTime, weekday));
        fileOutput = fileOutput + "\n" + ("DTEND:" + firstWeekday(endTime, weekday));
        fileOutput = fileOutput + "\n" + ("RRULE:FREQ=WEEKLY;UNTIL=" + findRuleEnd(endTime, seasonArray[i]) + ";WKST=SU;BYDAY=" + weekday);
        fileOutput = fileOutput + "\n" + ("SUMMARY:" + seasonArray[i].substring(seasonArray[i].indexOf("-") + 2, seasonArray[i].indexOf("Cr=")).trim() + " in " + seasonArray[i].substring(seasonArray[i].lastIndexOf("min") + 3, seasonArray[i].length).trim());
        fileOutput = fileOutput + "\n" + ("LOCATION:" + seasonArray[i].substring(seasonArray[i].lastIndexOf("min") + 3, seasonArray[i].length).trim());
        fileOutput = fileOutput + "\n" + ("DESCRIPTION:" + seasonArray[i].replace(/\s+/g, ' ').trim());
        fileOutput = fileOutput + "\n" + ("END:VEVENT");
    }
}

/**
 * Finds the beginning time of course
 * https://www.w3schools.com/jsref/jsref_obj_regexp.asp
 * 
 * @param {String} weekday course information Format: Term - Course Name	Format	Day/Time	Duration	Room
 * @returns beginning time Format: YYYYMMDDTHHMMSS
 */
function findBeginTime(weekday) {
    // setting Fall parameters
    if (weekday.includes("Fall") && !weekday.includes("Winter")) { 
        var currentYear = academicYear;
        var seasonStart = fallStart;
        var startMonth = "09";
    }
    // setting Winter parameters
    else if (weekday.includes("Winter") && !weekday.includes("Fall")) { 
        var currentYear = academicYear + 1;
        var seasonStart = winterStart;
        var startMonth = "01";
    }
    // setting Summer parameters
    else if (weekday.includes("Summer")) {
        var currentYear = academicYear + 1;
        var seasonStart = summerStart;
        var startMonth = "05";
    }
    // finds day and ensures is two digits Format: DD
    while (seasonStart.length < 2) {
        seasonStart = "0" + seasonStart;
    }
    // finds current time and removes :, also ensures is four digits Format: HHMM
    var currentTime = /[1-2]?\d:[0-5]\d/.exec(weekday).toString();
    currentTime = currentTime.replace(/:/g, '');
    while (currentTime.length < 4) {
        currentTime = "0" + currentTime;
    }
    // resulting begin time Format: YYYYMMDDTHHMMSS
    var beginTime = currentYear + startMonth + seasonStart + "T" + currentTime + "00";
    return beginTime;
}

/**
 * Finds end time based on start time and duration.
 * 
 * @param {String} duration duration of class Format: MMM
 * @param {String} startTime start time Format: YYYYMMDDTHHMMSS
 * @returns end time Format: YYYYMMDDTHHMMSS
 */
function yorkDuration(duration, startTime) {
    var originalStartTime = startTime;
    // isolates just number part of String
    startTime = startTime.substring(startTime.lastIndexOf("T") + 1, startTime.length);
    // calculates hours and minutes within that duration
    var yorkHours = Math.floor(parseInt(duration) / 60);
    var yorkMinutes = parseInt(duration) - yorkHours * 60;
    // adds end hour to current start time
    var endHour = (Math.floor(parseInt(startTime) / 10000) + yorkHours) * 100;
    // converts any additional minutes to hour
    var minutesToHour = (Math.floor(parseInt(startTime.slice(2)) / 100));
    // if minutes are or above 60, go to next hour and convert to format
    if ((minutesToHour + yorkMinutes) >= 60) {
      endHour = endHour / 100 + 1;
      var endTime = endHour * 10000 + (minutesToHour + yorkMinutes - 60) * 100;
    }
    // if minutes are fine, convert back to format
    else {
      var endTime = endHour * 100 + (minutesToHour + yorkMinutes) * 100;
    }
    var endTime = endTime.toString();
    // add zeros in front to correct time format
    while (endTime.length < 6) {
        endTime = "0" + endTime;
    }
    return originalStartTime.substring(0, originalStartTime.lastIndexOf("T") + 1) + endTime;
}

/**
 * Finds when to stop weekly classes
 * 
 * @param {String} endTime end time Format: YYYYMMDDTHHMMSS
 * @param {String} weekday course information Format: Term - Course Name	Format	Day/Time	Duration	Room
 * @returns 
 */
function findRuleEnd(endTime, weekday) {
    // setting Fall parameters
    if (weekday.includes("Fall") && !weekday.includes("Winter")) { 
        var currentYear = academicYear;
        var seasonEnd = fallEnd;
        var endMonth = "12";
    }
    // setting Winter parameters
    else if (weekday.includes("Winter") || (weekday.includes("Fall") && weekday.includes["Winter"])) { 
        var currentYear = academicYear + 1;
        var seasonEnd = winterEnd;
        var endMonth = "04";
    }
    // setting Summer parameters
    else if (weekday.includes("Summer")) {
        var currentYear = academicYear + 1;
        var seasonEnd = summerEnd;
        var endMonth = "08";
    }
    // find current day and ensure is two digits Format: DD
    var currentDay = /[1-2]?\d/.exec(seasonEnd).toString();
    while (currentDay.length < 2) {
        currentDay = "0" + currentDay;
    }
    // find current time and ensure is six digits Format: HHMMSS
    var currentTime = /[0-2]?\d\d\d[0][0]/.exec(endTime).toString();
    while (currentTime.length < 6) {
        currentTime = "0" + currentTime;
    }
    // resulting rule Format: YYYYMMDDTHHMMSS
    var ruleEnd = currentYear + endMonth + currentDay + "T" + currentTime;
    return ruleEnd;
}

/**
 * Creates and downloads file
 * https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
 * 
 * @param {String} filename name of downloaded file
 * @param {String} text file contents
 */
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/**
 * Finds the first weekday after the term start for class
 * https://stackoverflow.com/questions/33078406/getting-the-date-of-next-monday
 * 
 * @param {String} currentDate current start time Format: YYYYMMDDTHHMMSS
 * @param {String} weekday course weekday Format: MO, TU, WE, TH, FR
 * @returns 
 */
function firstWeekday(currentDate, weekday) {
    // default to Sunday
    dayIndex = 0;
    // find time, month, day, and year
    // Format: HHMMSS
    var currentTime = /[0-2]?\d\d\d[0][0]/.exec(currentDate).toString();
    // Format: YYYYMMDD
    var currentDate = /[1-2]?\d\d\d\d\d\d\d/.exec(currentDate).toString();
    var year = currentDate.substring(0,4);
    var month = currentDate.substring(4,6);
    var day = currentDate.substring(6,8);
    // set index based on weekday
    if (weekday.includes("MO")){
        dayIndex = 1;
    }
    else if (weekday.includes("TU")){
        dayIndex = 2;
    }
    else if (weekday.includes("WE")){
        dayIndex = 3;
    }
    else if (weekday.includes("TH")){
        dayIndex = 4;
    }
    else if (weekday.includes("FR")){
        dayIndex = 5;
    }
    else if (weekday.includes("SA")){
        dayIndex = 6;
    }
    else if (weekday.includes("SU")){
        dayIndex = 7;
    }
    // finds first weekday after term start, including start date
    var modifiedDate = new Date(year, month - 1, day);
    modifiedDate.setDate(modifiedDate.getDate() + ((dayIndex + 7 - modifiedDate.getDay()) % 7));
    // formatting date, ensuring is two digits Format: DD
    day = modifiedDate.getDate().toString();
    while (day.length < 2) {
        day = "0" + day;
    }
    // formatting date Format: YYYYMMDDTHHMMSS
    modifiedDate = year + "" + month + "" + day + "T" + currentTime;
    return modifiedDate;
}

/**
 * Adds days to date
 * https://stackoverflow.com/questions/563406/how-to-add-days-to-date
 */
function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
