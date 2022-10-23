var fallArray = [];
var winterArray = [];
var begin = 'BEGIN:VCALENDAR';
var version = 'VERSION:2.0';
var prodid = 'PRODID:-//James Liang//York Exporter//EN';
var fallStart = "";
var fallEnd = "";
var winterStart = "";
var winterEnd = "";

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
        if (pastedArray[i].includes("Fall")) {
            fallArray.push(pastedArray[i]);
        }
        else if (pastedArray[i].includes("Winter")) {
            winterArray.push(pastedArray[i]);
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
    }
    console.log(fallStart);
    console.log(fallEnd);
    console.log(winterStart);
    console.log(winterEnd);
    createCalendar();
}

function createCalendar() {
    console.log(begin);
    console.log(version);
    console.log(prodid);
    for (var i in fallArray) {
        console.log("BEGIN:VEVENT");
        console.log("DTSTART: " + fallArray[i].substring(fallArray[i].indexOf(":") - 6, fallArray[i].indexOf(":") + 3).trim());
        console.log("DTEND: " + fallArray[i].substring(fallArray[i].indexOf(":") - 6, fallArray[i].indexOf(":") + 3).trim());
        console.log("RRULE:FREQ=WEEKLY;UNTIL=" + ";WKST=SU;BYDAY=" + fallArray[i].substring(fallArray[i].indexOf(":") - 6, fallArray[i].indexOf(":") - 3).trim().substring(0,2));
        console.log("SUMMARY: " + fallArray[i].substring(fallArray[i].indexOf("-") + 2, fallArray[i].indexOf("Cr=")).trim() + " in " + fallArray[i].substring(fallArray[i].lastIndexOf("min") + 3, fallArray[i].length).trim());
        console.log("LOCATION: " + fallArray[i].substring(fallArray[i].lastIndexOf("min") + 3, fallArray[i].length).trim());
        console.log("DESCRIPTION: " + fallArray[i].replace(/\s+/g,' ').trim());
        console.log("END:VEVENT");
    }
    for (var i in winterArray) {
        console.log("BEGIN:VEVENT");
        console.log("DTSTART: " + winterArray[i].substring(winterArray[i].indexOf(":") - 6, winterArray[i].indexOf(":") + 3).trim());
        console.log("DTEND: " + winterArray[i].substring(winterArray[i].indexOf(":") - 6, winterArray[i].indexOf(":") + 3).trim());
        console.log("RRULE:FREQ=WEEKLY;UNTIL=" + ";WKST=SU;BYDAY=" + winterArray[i].substring(winterArray[i].indexOf(":") - 6, winterArray[i].indexOf(":") - 3).trim().substring(0,2));
        console.log("SUMMARY:" + winterArray[i].substring(winterArray[i].indexOf("-") + 2, winterArray[i].indexOf("Cr=")).trim() + " in " + winterArray[i].substring(winterArray[i].lastIndexOf("min") + 3, winterArray[i].length).trim());
        console.log("LOCATION: " + winterArray[i].substring(winterArray[i].lastIndexOf("min") + 3, winterArray[i].length).trim());
        console.log("DESCRIPTION: " + winterArray[i].replace(/\s+/g,' ').trim());
        console.log("END:VEVENT");
    }
}