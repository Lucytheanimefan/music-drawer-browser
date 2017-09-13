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

var analyser;
var frequencyData;
var timeDomainData;
var bufferLength;

var colorScheme = [];

var cursorX;
var cursorY;

var animationID;

var red = "#ff0000";

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
    //trackMouseMovement();
    playMusic();
}

// Let's try to do this in javascript instead of python
function playMusic() {
    var ctx = new AudioContext();
    //$("#myAudio").attr("src", filename);
    var audio = document.getElementById('myAudio');
    var audioSrc = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    audioSrc.connect(ctx.destination);
    // we have to connect the MediaElementSource with the analyser 
    audioSrc.connect(analyser);
    // we could configure the analyser: e.g. analyser.fftSize (for further infos read the spec)
    bufferLength = analyser.frequencyBinCount;
    // frequencyBinCount tells you how many values you'll receive from the analyser
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    timeDomainData = new Uint8Array(analyser.fftSize); // Uint8Array should be the same length as the fftSize 

    visualize();

    // drawGraph();
    // we're ready to receive some data!
    // loop
    function renderFrame() {
        // if (animationID && Math.random() < 0.3) {
        //     cancelAnimationFrame(animationID);
        // }
        animationID = requestAnimationFrame(renderFrame);
        // update data in frequencyData
        if (musicPlaying) {
            analyser.getByteFrequencyData(frequencyData);
            // render frame based on values in frequencyData

            analyser.getByteTimeDomainData(timeDomainData); // fill the Uint8Array with data returned from getByteTimeDomainData()

            beginArt();
        }
    }
    //audio.play();
    //renderFrame();
}

function trackMouseMovement() {
    $(document).mousemove(function(event) {
        cursorX = event.pageX;
        cursorY = event.pageY;
        console.log(cursorX + "," + cursorY);
    });
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

// function formatData(data = musicData) {
//     return data.map(function(x, index) {
//         // Scale number to range
//         scaled_x = scaleBetween(x, 0, $("#musicCanvas").height(), minDataPoint, maxDataPoint);
//         scaled_index = scaleBetween(index, 0, $("#musicCanvas").width(), 0, musicData.length);
//         return [scaled_index, scaled_x]
//     });
// }

function beginArt(lines = true) {
    // For now let's just do lines
    var color = (Math.random() > 0.5);
    var opacity = Math.random();
    ctx.lineWidth = 0.1;
    var col = Math.round(Math.random() * 255);

    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";

    // pixel size for dots only
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

        // TODO: react to big jumps in amplitude - find better way to do this
        if (Math.abs(timeDomainData[i] - timeDomainData[i - 30]) > 50) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var index = Math.round(6 * Math.random());
            if (colorScheme.length > index) {
                ctx.strokeStyle = colorScheme[index]["hex"]["value"];
                ctx.fillStyle = colorScheme[index]["hex"]["value"];
            }
        }

        if (cursorX && cursorY) {
            console.log("Cursor stuff!");
            var coords = generateCircleCoordinates(100, 50, cursorX, cursorY);
            ctx.fillStyle = red; // Just so we can see it
            for (var i = 0; i < coords.length; i++) {
                var coordSet = coords[i];
                ctx.fillRect(coordSet[0], coordSet[1], 2 * pix, 2 * pix);
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

function visualize() {
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

    var bufferLength = analyser.fftSize;
    var dataArray = new Uint8Array(bufferLength);

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    var draw = function() {

        drawVisual = requestAnimationFrame(draw);

        // Looks like this is still necessary even though called before
        analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(255, 255, 255)';

        ctx.beginPath();

        var sliceWidth = WIDTH * 1.0 / bufferLength;
        var x = 0;

        for (var i = 0; i < bufferLength; i++) {

            var v = dataArray[i] / 128.0;
            var y = v * HEIGHT / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
    };

    draw();


}