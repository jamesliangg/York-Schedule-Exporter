var fallArray = [];
var winterArray = [];
var fullYearArray = [];
var begin = 'BEGIN:VCALENDAR';
var version = 'VERSION:2.0';
var prodid = 'PRODID:-//James Liang//York Exporter//EN';
var ending = 'END:VCALENDAR';
var fallStart = "";
var fallEnd = "";
var winterStart = "";
var winterEnd = "";
var academicYear = "";
var fileOutput = "";

function mainFunction() {
    fetch_demo();
    textToArray();
}

function textToArray() {
    var pastedText = document.getElementById("input").value;
    console.log(pastedText);
    var pastedArray = pastedText.split("\n");
    pastedArray = pastedArray.filter((a) => a);
    for (var i in pastedArray) {
        if (!pastedArray[i].includes("Fall") && !pastedArray[i].includes("Winter") && pastedArray[i].includes(":")) {
            pastedArray[i] = pastedArray[i - 1].substring(0, pastedArray[i - 1].indexOf("Cr=") + 9) + " " + pastedArray[i];
        }
    }
    for (var i in pastedArray) {
        if (pastedArray[i].includes("Fall") && !pastedArray[i].includes("Winter")) {
            fallArray.push(pastedArray[i]);
        }
        else if (pastedArray[i].includes("Winter") && !pastedArray[i].includes("Fall")) {
            winterArray.push(pastedArray[i]);
        }
        else if (pastedArray[i].includes("Winter") && pastedArray[i].includes("Fall")) {
            fullYearArray.push(pastedArray[i]);
        }
    }
}

// https://www.scrapingbee.com/blog/web-scraping-javascript/
async function fetch_demo()
{
	const resp = await fetch('https://registrar.yorku.ca/enrol/dates/2022-2023/fall-winter');
	var htmlOut = (await resp.text());
    classesStart(htmlOut);
}

function classesStart(resp) {
    var htmlArray = resp.split("\n");
    for (var i in htmlArray) {
        if (htmlArray[i].includes("Classes start") && htmlArray[i].includes("style")) {
            i++;
            fallStart = htmlArray[i].substring(htmlArray[i].lastIndexOf("\">") + 2, htmlArray[i].lastIndexOf("\/") - 1).trim();
            i = i + 2;
            winterStart = htmlArray[i].substring(htmlArray[i].lastIndexOf("\">") + 2, htmlArray[i].lastIndexOf("\/") - 1).trim();
        }
        else if (htmlArray[i].includes("Fall classes end") && htmlArray[i].includes("style")) {
            i++;
            fallEnd = htmlArray[i].substring(htmlArray[i].lastIndexOf("\">") + 2, htmlArray[i].lastIndexOf("\/") - 1).trim();
        }
        else if (htmlArray[i].includes("Winter classes end") && htmlArray[i].includes("style")) {
            i++;
            i = i + 2;
            winterEnd = htmlArray[i].substring(htmlArray[i].lastIndexOf("\">") + 2, htmlArray[i].lastIndexOf("\/") - 1).trim();
        }
        if (htmlArray[i].includes("Undergraduate Fall/Winter")) {
            academicYear = htmlArray[i].substring(htmlArray[i].indexOf("Winter") + 6, htmlArray[i].indexOf("Important") - 1).trim();
        }
    }
    console.log(fallStart);
    console.log(fallEnd);
    console.log(winterStart);
    console.log(winterEnd);
    createCalendar();
}

function createCalendar() {
    fileOutput = begin;
    fileOutput = fileOutput + "\n" + version;
    fileOutput = fileOutput + "\n" + prodid;
    courseEvent(fallArray);
    courseEvent(winterArray);
    fileOutput = fileOutput + "\n" + ending;
    download("scheudle.ics", fileOutput);
}

function courseEvent(seasonArray) {
    for (var i in seasonArray) {
        var beginTime = findBeginTime(seasonArray[i]);
        var endTime = yorkDuration(seasonArray[i].substring(seasonArray[i].indexOf("min") - 4, seasonArray[i].indexOf("min") - 1).trim(), beginTime);
        var weekday = seasonArray[i].substring(seasonArray[i].indexOf(":") - 6, seasonArray[i].indexOf(":") - 3).trim().substring(0,2);
        fileOutput = fileOutput + "\n" + ("BEGIN:VEVENT");
        fileOutput = fileOutput + "\n" + ("DTSTART:" + firstWeekday(beginTime, weekday));
        fileOutput = fileOutput + "\n" + ("DTEND: " + firstWeekday(endTime, weekday));
        fileOutput = fileOutput + "\n" + ("RRULE:FREQ=WEEKLY;UNTIL=" + findRuleEnd(endTime, seasonArray[i]) + ";WKST=SU;BYDAY=" + weekday);
        fileOutput = fileOutput + "\n" + ("SUMMARY:" + seasonArray[i].substring(seasonArray[i].indexOf("-") + 2, seasonArray[i].indexOf("Cr=")).trim() + " in " + seasonArray[i].substring(seasonArray[i].lastIndexOf("min") + 3, seasonArray[i].length).trim());
        fileOutput = fileOutput + "\n" + ("LOCATION: " + seasonArray[i].substring(seasonArray[i].lastIndexOf("min") + 3, seasonArray[i].length).trim());
        fileOutput = fileOutput + "\n" + ("DESCRIPTION: " + seasonArray[i].replace(/\s+/g,' ').trim());
        fileOutput = fileOutput + "\n" + ("END:VEVENT");
    }  
}

// https://www.w3schools.com/jsref/jsref_obj_regexp.asp
function findBeginTime(weekday) {
    if (weekday.includes("Fall") && !weekday.includes("Winter")) { 
        var currentYear = academicYear.substring(0,4);
        var seasonStart = fallStart;
        var startMonth = "09";
    }
    else if (weekday.includes("Winter") && !weekday.includes("Fall")) { 
        var currentYear = academicYear.substring(5,9);
        var seasonStart = winterStart;
        var startMonth = "01";
    }
    var currentDay = seasonStart.substring(seasonStart.length - 2, seasonStart.length).trim();
    while (currentDay.length < 2) {
        currentDay = "0" + currentDay;
    }
    var currentTime = /[1-2]?\d:[0-5]\d/.exec(weekday).toString();
    currentTime = currentTime.replace(/:/g,'');
    while (currentTime.length < 4) {
        currentTime = "0" + currentTime;
    }
    var beginTime = currentYear + startMonth + currentDay + "T" + currentTime + "00";
    return beginTime;
}

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

function findRuleEnd(endTime, weekday) {
    if (weekday.includes("Fall") && !weekday.includes("Winter")) { 
        var currentYear = academicYear.substring(0,4);
        var seasonEnd = fallEnd;
        var endMonth = "12";
    }
    else if (weekday.includes("Winter") || (weekday.includes("Fall") && weekday.includes["Winter"])) { 
        var currentYear = academicYear.substring(5,9);
        var seasonEnd = winterEnd;
        var endMonth = "04";
    }
    var currentDay = /[1-2]?\d/.exec(seasonEnd).toString();
    while (currentDay.length < 2) {
        currentDay = "0" + currentDay;
    }
    var currentTime = /[0-2]?\d\d\d[0][0]/.exec(endTime).toString();
    while (currentTime.length < 6) {
        currentTime = "0" + currentTime;
    }
    var ruleEnd = currentYear + endMonth + currentDay + "T" + currentTime;
    return ruleEnd;
}

// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function firstWeekday(currentDate, weekday) {
    dayIndex = 0;
    var currentTime = /[0-2]?\d\d\d[0][0]/.exec(currentDate).toString();
    console.log(currentTime);
    var currentDate = /[1-2]?\d\d\d\d\d\d\d/.exec(currentDate).toString();
    var year = currentDate.substring(0,4);
    var month = currentDate.substring(4,6);
    var day = currentDate.substring(6,8);
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
    var modifiedDate = new Date(year, month - 1, day);
    console.log(modifiedDate);
    modifiedDate.setDate(modifiedDate.getDate() + ((dayIndex + 7 - modifiedDate.getDay()) % 7));
    day = modifiedDate.getDate().toString();
    while (day.length < 2) {
        day = "0" + day;
    }
    modifiedDate = year + "" + month + "" + day + "T" + currentTime;
    console.log(modifiedDate);
    return modifiedDate;
}