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
            console.log(i);
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
        fileOutput = fileOutput + "\n" + ("BEGIN:VEVENT");
        fileOutput = fileOutput + "\n" + ("DTSTART:" + beginTime);
        fileOutput = fileOutput + "\n" + ("DTEND: " + endTime);
        fileOutput = fileOutput + "\n" + ("RRULE:FREQ=WEEKLY;UNTIL=" + findRuleEnd(endTime, seasonArray[i]) + ";WKST=SU;BYDAY=" + seasonArray[i].substring(seasonArray[i].indexOf(":") - 6, seasonArray[i].indexOf(":") - 3).trim().substring(0,2));
        fileOutput = fileOutput + "\n" + ("SUMMARY:" + seasonArray[i].substring(seasonArray[i].indexOf("-") + 2, seasonArray[i].indexOf("Cr=")).trim() + " in " + seasonArray[i].substring(seasonArray[i].lastIndexOf("min") + 3, seasonArray[i].length).trim());
        fileOutput = fileOutput + "\n" + ("LOCATION: " + seasonArray[i].substring(seasonArray[i].lastIndexOf("min") + 3, seasonArray[i].length).trim());
        fileOutput = fileOutput + "\n" + ("DESCRIPTION: " + seasonArray[i].replace(/\s+/g,' ').trim());
        fileOutput = fileOutput + "\n" + ("END:VEVENT");
    }  
    console.log(fileOutput);
}

function findBeginTime(weekday) {
    if (weekday.includes("Fall") && !weekday.includes("Winter")) {
        var currentYear = academicYear.substring(0,4);
        var currentDay = fallStart.substring(fallStart.length - 2, fallStart.length).trim();
        while (currentDay.length < 2) {
            currentDay = "0" + currentDay;
        }
        var currentTime = /[1-2]?\d:[0-5]\d/.exec(weekday).toString();
        currentTime = currentTime.replace(/:/g,'');
        while (currentTime.length < 4) {
            currentTime = "0" + currentTime;
        }
        var beginTime = currentYear + "09" + currentDay + "T" + currentTime + "00";
    }
    else if (weekday.includes("Winter") && !weekday.includes("Fall")) {
        var currentYear = academicYear.substring(5,9);
        var currentDay = winterStart.substring(winterStart.length - 2, winterStart.length).trim();
        while (currentDay.length < 2) {
            currentDay = "0" + currentDay;
        }
        var currentTime = /[1-2]?\d:[0-5]\d/.exec(weekday).toString();
        currentTime = currentTime.replace(/:/g,'');
        while (currentTime.length < 4) {
            currentTime = "0" + currentTime;
        }
        var beginTime = currentYear + "01" + currentDay + "T" + currentTime + "00";
    }
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
    return originalStartTime.substring(0, originalStartTime.lastIndexOf("T") + 1) + endTime.toString();
}

function findRuleEnd(endTime, weekday) {
    if (weekday.includes("Fall") && !weekday.includes("Winter")) {
        var currentYear = academicYear.substring(0,4);
        var currentDay = fallEnd.substring(fallStart.length - 2, fallEnd.length).trim();
        while (currentDay.length < 2) {
            currentDay = "0" + currentDay;
        }
        var currentTime = endTime.substring(endTime.lastIndexOf("T") + 1, endTime.length);
        var ruleEnd = currentYear + "12" + currentDay + "T" + currentTime;
    }
    else if (weekday.includes("Winter") || (weekday.includes("Fall") && weekday.includes["Winter"])) {
        var currentYear = academicYear.substring(5,9);
        var currentDay = winterEnd.substring(winterEnd.length - 2, winterEnd.length).trim();
        while (currentDay.length < 2) {
            currentDay = "0" + currentDay;
        }
        var currentTime = endTime.substring(endTime.lastIndexOf("T") + 1, endTime.length);
        var ruleEnd = currentYear + "04" + currentDay + "T" + currentTime;
    }
    return ruleEnd;
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }