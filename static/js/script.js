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

var canvas;
var canvasWidth;
var canvasHeight;
var ctx;
var canvasData;

var musicPlaying = false;

function setCanvas() {
    canvas = document.getElementById('musicCanvas');
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    ctx = canvas.getContext('2d');
    canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
}

function triggerMusic() {
    musicPlaying = true;
    playMusic();
}

// Let's try to do this in javascript instead of python
function playMusic() {
    var ctx = new AudioContext();
    //$("#myAudio").attr("src", filename);
    var audio = document.getElementById('myAudio');
    var audioSrc = ctx.createMediaElementSource(audio);
    var analyser = ctx.createAnalyser();
    audioSrc.connect(ctx.destination);
    // we have to connect the MediaElementSource with the analyser 
    audioSrc.connect(analyser);
    // we could configure the analyser: e.g. analyser.fftSize (for further infos read the spec)

    // frequencyBinCount tells you how many values you'll receive from the analyser
    var frequencyData = new Uint8Array(analyser.frequencyBinCount);

    // we're ready to receive some data!
    // loop
    function renderFrame() {
        requestAnimationFrame(renderFrame);
        // update data in frequencyData
        if (musicPlaying) {
            analyser.getByteFrequencyData(frequencyData);
            // render frame based on values in frequencyData
            //console.log(frequencyData);
            beginArt(frequencyData);
        }
    }
    //audio.play();
    renderFrame();
}



function setPause() {
    musicPlaying = false;
    startPauseTime = new Date().getTime() / 1000; // seconds
    console.log("Start pause time: " + startPauseTime);
    musicPaused = true;
}

function scaleBetween(unscaledNum, minAllowed, maxAllowed, min, max) {
    return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
}

function notZero(num) {
    return num != 0;
}

function formatData(data = musicData) {
    // First filter
    //data = data.filter(notZero);
    return data.map(function(x, index) {
        // Scale number to range
        scaled_x = scaleBetween(x, 0, $("#musicCanvas").height(), minDataPoint, maxDataPoint);
        scaled_index = scaleBetween(index, 0, $("#musicCanvas").width(), 0, musicData.length);
        return [scaled_index, scaled_x]
    });
}

function beginArt(data = musicData) {
    console.log("Begin art");
    //data = formatData(data);
    //console.log(data);
    // For now let's just do lines
    //var color = (Math.random() > 0.5);
    var opacity = Math.random()
    ctx.fillStyle = "rgba(255, 255, 255, " + opacity + ")";

    for (var i = 0; i < data.length; i++) {
        //console.log(data[i]);
        ctx.fillRect(data[i] + 50, Math.random() * canvasHeight,1,1);
        //var update = (i%3 == 0) || (i == data.length - 1);
        //drawPixel(ctx, canvasData, canvasWidth, data[i] * 5, Math.random() * 50, 255, 255, 255, 1, update);
    }
    // animateLines('musicArt', ctx, data, width = 0.1, color = "white", opacity = 1, i = 0, function() {
    //     console.log("Done animating at " + new Date().getTime() / 1000);
    // });
}

/* ---------------- Graphing visual only ---------------------- */
function RefreshImage() {
    document.pic0.src = "/tmp/pyaudioImage.png?a=" + String(Math.random() * 99999999);
    setTimeout('RefreshImage()', 50);
}