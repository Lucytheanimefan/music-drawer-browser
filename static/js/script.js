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

var musicPlaying = false;

function triggerMusic() {
    musicPlaying = true;
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
            console.log(frequencyData);
        }
    }
    //audio.play();
    renderFrame();
}

// function playMusic(filename) {
//     var n = filename.lastIndexOf('/');
//     var musicfile = filename.substring(n + 1);
//     var songDuration = document.getElementById("myAudio").duration; // in seconds
//     console.log("Song duration: " + songDuration);

//     $.get("/getMusicData", { start: -100, end: null, filename: musicfile }, function(data) {
//         console.log("Get music data return: ");
//         console.log(data);
//         musicData = data['amplitude'];
//         minDataPoint = Math.min.apply(null, data);
//         maxDataPoint = Math.max.apply(null, data);
//         console.log("minDataPoint: " + minDataPoint + ", maxDataPoint: " + maxDataPoint);
//         beginArt();
//     });
//     if (firstTimePlay) {
//         startTime = new Date().getTime() / 1000; // seconds
//         endTime = startTime + songDuration;
//         firstTimePlay = false;
//     } else {
//         endPauseTime = new Date().getTime() / 1000;
//         console.log("End pause time: " + endPauseTime);
//         endTime = endTime + (endPauseTime - startPauseTime);
//         console.log("New end time: " + endTime);
//     }
// }



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
    data = data.filter(notZero);
    return data.map(function(x, index) {
        // Scale number to range
        scaled_x = scaleBetween(x, 0, $("#musicCanvas").height(), minDataPoint, maxDataPoint);
        scaled_index = scaleBetween(index, 0, $("#musicCanvas").width(), 0, musicData.length);
        return [scaled_index, scaled_x]
    });
}

function beginArt(data = musicData) {
    console.log("Begin art");
    data = formatData(data);
    console.log("Scaled data:");
    console.log(data);
    // For now let's just do lines
    animateLines('musicArt', ctx, data, width = 0.1, color = "white", opacity = 1, i = 0, function() {
        console.log("Done animating at " + new Date().getTime() / 1000);
    });
}

/* ---------------- Graphing visual only ---------------------- */
function RefreshImage() {
    document.pic0.src = "/tmp/pyaudioImage.png?a=" + String(Math.random() * 99999999);
    setTimeout('RefreshImage()', 50);
}