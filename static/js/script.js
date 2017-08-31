var musicPaused = false;
var startTime;
var endTime;
var startPauseTime;
var endPauseTime
var firstTimePlay = true;

function playMusic(filename) {
    var n = filename.lastIndexOf('/');
    var musicfile = filename.substring(n + 1);
    var songDuration = document.getElementById("myAudio").duration; // in seconds
    console.log("Song duration: " + songDuration);

    $.get("/getMusicData", { start: 0, end: Math.floor(songDuration), filename: musicfile }, function(data) {
        console.log("Get music data return: ");
        console.log(data);
    });
    if (firstTimePlay) {
        startTime = new Date().getTime() / 1000; // seconds
        endTime = startTime + songDuration;
        firstTimePlay = false;
    } else {
        endPauseTime = new Date().getTime() / 1000;
        console.log("End pause time: " + endPauseTime);
        endTime = endTime + (endPauseTime - startPauseTime);
        console.log("New end time: " + endTime);
    }

}

function setPause() {
    startPauseTime = new Date().getTime() / 1000; // seconds
    console.log("Start pause time: " + startPauseTime);
    musicPaused = true;
}