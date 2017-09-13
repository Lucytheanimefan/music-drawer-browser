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

var frequencyData;
var timeDomainData;
var bufferLength;

var colorScheme = [];

function setCanvas() {
    canvas = document.getElementById('musicCanvas');
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    ctx = canvas.getContext('2d');
    canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    generateColors("24B1E0", function(colors) {
        console.log("COLORS: ");
        console.log(colors);
        colorScheme = colors;
    });
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
    analyser.fftSize = 2048;
    audioSrc.connect(ctx.destination);
    // we have to connect the MediaElementSource with the analyser 
    audioSrc.connect(analyser);
    // we could configure the analyser: e.g. analyser.fftSize (for further infos read the spec)
    bufferLength = analyser.frequencyBinCount;
    // frequencyBinCount tells you how many values you'll receive from the analyser
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    timeDomainData = new Uint8Array(analyser.fftSize); // Uint8Array should be the same length as the fftSize 


    // we're ready to receive some data!
    // loop
    function renderFrame() {
        requestAnimationFrame(renderFrame);
        // update data in frequencyData
        if (musicPlaying) {
            analyser.getByteFrequencyData(frequencyData);
            // render frame based on values in frequencyData

            analyser.getByteTimeDomainData(timeDomainData); // fill the Uint8Array with data returned from getByteTimeDomainData()

            beginArt();
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

function beginArt(lines = true) {
    //console.log("Begin art");
    //data = formatData(data);
    //console.log(data);
    // For now let's just do lines
    var color = (Math.random() > 0.5);
    //console.log("Color: " + color)''
    var opacity = Math.random();
    ctx.lineWidth = 0.1;
    var col = Math.round(Math.random() * 255);

    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";



    var pix = 0.3;
    for (var i = 0; i < frequencyData.length; i++) {
        var x = frequencyData[i];
        var y = timeDomainData[i];

        if (lines) {
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        } else {
            ctx.fillRect(x, y, pix, pix);
        }
        //console.log(timeDomainData[i]);
        if (Math.abs(timeDomainData[i] - timeDomainData[i - 30]) > 100) {
            //console.log("Clear!!!!");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var index = Math.round(6 * Math.random());
            if (colorScheme.length > index) {
                ctx.strokeStyle = colorScheme[index]["hex"]["value"];
                ctx.fillStyle = colorScheme[index]["hex"]["value"];
            }
        }
    }
    if (lines) {
        ctx.stroke();
    }

}

function generateColors(seedColor, callback) {
    var url = "http://thecolorapi.com/scheme?hex=" + seedColor + "&format=json&count=6";
    $.get(url, function(data) {
        callback(data["colors"]);
    });
}


/* ---------------- Graphing visual only ---------------------- */
function drawGraph() {
    drawVisual = requestAnimationFrame(drawGraph);

    ctx.fillStyle = 'rgba(200, 200, 200, 1)';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.beginPath();

    var sliceWidth = canvasWidth * 1.0 / bufferLength;
    var x = 0;
    for (var i = 0; i < bufferLength; i++) {

        var v = timeDomainData[i] / 128.0;
        var y = v * canvasHeight / 2;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    drawGraph();
}