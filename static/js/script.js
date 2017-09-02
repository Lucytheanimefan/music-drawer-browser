var musicPaused = false;
var startTime;
var endTime;
var startPauseTime;
var endPauseTime
var firstTimePlay = true;

// an array of amplitudes
var musicData;
var minDataPoint;
var maxDataPoint;

var canvas = document.getElementById('musicCanvas');
//canvas.width = $(document).width();
//canvas.height = $(document).height();
var ctx = canvas.getContext('2d');

function playMusic(filename) {
    var n = filename.lastIndexOf('/');
    var musicfile = filename.substring(n + 1);
    var songDuration = document.getElementById("myAudio").duration; // in seconds
    console.log("Song duration: " + songDuration);

    $.get("/getMusicData", { start: -100, end: null, filename: musicfile }, function(data) {
        console.log("Get music data return: ");
        console.log(data);
        musicData = data;
        minDataPoint = Math.min.apply(null, data);
        maxDataPoint = Math.max.apply(null, data);
        console.log("minDataPoint: " + minDataPoint + ", maxDataPoint: " + maxDataPoint);
        beginArt();
    });
    if (firstTimePlay) 
    {
        startTime = new Date().getTime() / 1000; // seconds
        endTime = startTime + songDuration;
        firstTimePlay = false;
    } 
    else 
    {
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

function scaleBetween(unscaledNum, minAllowed, maxAllowed, min, max) {
    return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
}

function notZero(num)
{
    return num!=0;
}

function formatData(data = musicData) {
    // First filter
    data = data.filter(notZero);
    return data.map(function(x, index) {
        // Scale number to range
        scaled_x = scaleBetween(x, 0, $("#musicCanvas").height(), minDataPoint, maxDataPoint);
        scaled_index = scaleBetween(index, 0, $("#musicCanvas").width(), 0, musicData.length);
        return [scaled_index, scaled_x]
    });
}

function beginArt(data = musicData)
{
    console.log("Begin art");
    data = formatData(data);
    console.log("Scaled data:");
    console.log(data);
    // For now let's just do lines
    animateLines('musicArt', ctx, data, width = 0.1, color = "white", opacity = 1, i = 0, function(){
        console.log("Done animating at " + new Date().getTime() / 1000);
    });
}