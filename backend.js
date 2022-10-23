var fallArray = [];
var begin = 'BEGIN:VCALENDAR';
var version = 'VERSION:2.0';
var prodid = 'PRODID:-//James Liang//York Exporter//EN';

function textToArray() {
    var pastedText = document.getElementById("input").value;
    console.log(pastedText);
    var pastedArray = pastedText.split("\n");
    pastedArray = pastedArray.filter((a) => a);
    for (var i in pastedArray) {
        if (!pastedArray[i].includes("Fall") && !pastedArray[i].includes("Winter")) {
            console.log(i);
            pastedArray[i] = pastedArray[i - 1].substring(0, pastedArray[i - 1].indexOf("Cr=") + 9) + " " + pastedArray[i];
        }
    }
    for (var i in pastedArray) {
        console.log(pastedArray[i]);
    }
}