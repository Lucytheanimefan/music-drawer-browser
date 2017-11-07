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
var WIDTH;
var HEIGHT;
var ctx;
var canvasData;

var musicPlaying = false;
var duration; // in seconds
var chunkIntervalSeconds;

var audio;
var audioCtx;
var analyser;
var freqAnalyser;
var frequencyData;
var timeDomainData;
var bufferLength;

var timeDomainfftSize = 2048 //128;

var colorScheme = [];

var cursorX;
var cursorY;

var animationID;

// Genres
var genres;
var useChunkedGenres = false; //true;
var genreColors;
var genreColor = "#ffffff";
var genreColorArr;

var red = "#ff0000";


// Speakers/"Instruments"
var instruments;

//var roseCoordinates = [];

// 3d stuff
var scene;
var camera;
var renderer;
var cube;

console.disableYellowBox = true;

var AudioContext = window.AudioContext // Default
    ||
    window.webkitAudioContext // Safari and old versions of Chrome
    ||
    false;

function generalSetup() {
    if (useChunkedGenres) {
        genres = $("#musicCanvas").data("genre");
    } else {
        genres = $("#musicCanvas").data("singlegenre");
    }
    genreColors = generateColorBasedOnGenre(genres);
    genreColor = genreColors[0];
    musicFeatures = $("#musicCanvas").data("features");
    singleMusicFeatures = $("#musicCanvas").data("singlefeatures");
    overallMusicFeatDict = { "ZCR": singleMusicFeatures[0], "energy": singleMusicFeatures[1], "entropyOfEnergy": singleMusicFeatures[2], "spectralCentroid": singleMusicFeatures[3], "spectralSpread": singleMusicFeatures[4], "spectralEntropy": singleMusicFeatures[5], "spectralFlux": singleMusicFeatures[6], "spectralRolloff": singleMusicFeatures[7], "mfcc": singleMusicFeatures.slice(8, 20) };
    instruments = $("#musicCanvas").data("speakers");


    console.log(instruments);
    //console.log(musicFeatures);
    console.log(overallMusicFeatDict);

    // Set the first color so it's not white
    genreColor = genreColors[0];

    audioCtx = new AudioContext();
    audio = document.getElementById('myAudio');
    duration = audio.duration;
    chunkIntervalSeconds = $("#musicCanvas").data("chunkseconds");
    var audioSrc = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = timeDomainfftSize; //2048;
    audioSrc.connect(audioCtx.destination);
    // we have to connect the MediaElementSource with the analyser 
    audioSrc.connect(analyser);
    // we could configure the analyser: e.g. analyser.fftSize (for further infos read the spec)
    bufferLength = analyser.frequencyBinCount;


    freqAnalyser = audioCtx.createAnalyser();
    freqAnalyser.fftSize = 64;
    audioSrc.connect(freqAnalyser);
    // frequencyBinCount tells you how many values you'll receive from the analyser
    frequencyData = new Uint8Array(freqAnalyser.frequencyBinCount); // Not being used
    timeDomainData = new Uint8Array(analyser.fftSize); // Uint8Array should be the same length as the fftSize 

}

function setCanvas() {

    canvas = document.getElementById('musicCanvas');
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
    ctx = canvas.getContext('2d');
    canvasData = ctx.getImageData(0, 0, WIDTH, HEIGHT);


}

var firstTime = true;

function triggerMusic() {
    musicPlaying = true;
    //trackMouseMovement();

    playMusic();

}

// Let's try to do this in javascript instead of python
function playMusic() {
    if (firstTime) {


        var oldTime = 0;
        var i = 0;
        var instrUpdateCount = 0;
        audio.ontimeupdate = function() {
            var currentTime = audio.currentTime;
            // Every chunk_seconds, update the color
            if (Math.abs(oldTime - currentTime) >= chunkIntervalSeconds) {

                // Set the color
                if (useChunkedGenres) {
                    genreColor = genreColors[i];
                    genreColorArr = genres[i][1];
                }

                i += 1;
                oldTime = audio.currentTime;

                // Process features
                processFeature(i);
            }
            // Update other visual stuff - change in instruments

            if (instrUpdateCount < instruments.length) {
                var instrumentTime = instruments[instrUpdateCount][0];
                //console.log(Math.round(currentTime) + "vs" + instrumentTime);
                if (Math.round(currentTime) >= instrumentTime) {
                    console.log(Math.round(currentTime) + "vs" + instrumentTime);
                    console.log("Update num instruments!");
                    // TODO: trigger new visual from 3d.js
                    // 
                    if (instrUpdateCount > 0) {
                        createNew3DInstrument(instruments[instrUpdateCount][1], i);
                    }

                    instrUpdateCount += 1;
                }
            }

        };


        audio.onended = function() {
            cancelAnimationFrame(threeDAnimateID);
            cancelAnimationFrame(particleAnimateID);
        }


        firstTime = false;
    }
    if (do3d) {
        animate3d();
        particleUpdate();
    }
    //visualize();

    // we're ready to receive some dat;a!
    // loop
    function renderFrame() {

        animationID = requestAnimationFrame(renderFrame);
        // update data in frequencyData
        if (musicPlaying) {
            analyser.getByteFrequencyData(frequencyData);
            // render frame based on values in frequencyData

            //The byte values do range between 0-255, and yes, that maps to -1 to +1, so 128 is zero. (It's not volts, but full-range unitless values.)
            analyser.getByteTimeDomainData(timeDomainData); // fill the Uint8Array with data returned from getByteTimeDomainData()

            beginArt();
        }
    }

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


function beginArt(lines = true) {
    // For now let's just do lines
    var color = (Math.random() > 0.5);
    var opacity = Math.random();
    ctx.lineWidth = 0.1;
    var col = Math.round(Math.random() * 255);

    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = genreColor;
    ctx.fillStyle = genreColor;

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

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}


function generateColorBasedOnGenre(genres) {
    //console.log(genres);
    var colors = [];

    // For multiple colors
    if (useChunkedGenres) {
        for (var i = 0; i < genres.length; i++) {
            var genre = genres[i];
            var probs = genre[1];
            var classifiers = genre[2];

            if (probs.length == 3) {
                var genreString = rgbToString(probs);
                colors.push(genreString);
            }
        }
    } else {
        colors = ["rgb(" + convertGenreProbToRGB(genres["Classical"]) + "," +
            convertGenreProbToRGB(genres["Electronic"]) + "," +
            convertGenreProbToRGB(genres["Jazz"]) + ", 1)"
        ];
        console.log(colors);
    }

    return colors;
}

function generateColors(seedColor, callback) {
    var url = "http://thecolorapi.com/scheme?hex=" + seedColor + "&format=json&count=6";
    $.get(url, function(data) {
        callback(data["colors"]);
    });
}

/* ---------------- Features ------------------- */
function processFeature(index = 0) {
    if (musicFeatures == null) {
        return;
    }

    var featureVector = musicFeatures[index];
    window.zcr = featureVector[0]; // number of times signal crosses the axis
    window.energy = featureVector[1];
    window.entropy = featureVector[2]; // measure of abrupt changes
    window.centroid = featureVector[3];
    window.spread = featureVector[4];
    window.spectralEntropy = featureVector[5];
    window.rollOff = featureVector[7];
    //console.log("processFeature rollOff: " + rollOff);
    mfcc = featureVector.slice(8, 20); // from 9 to 21
    //     console.log(
    //     "ZCR: " + zcr +
    //         ", Energy: " + energy +
    //         ", Entropy of energy: " + entropy +
    //         ", Spectral centroid: " + centroid +
    //         ", Spectral spread: " + spread +
    //         ", Spectral entropy: " + spectralEntropy
    // );

}


/* ---------------- Graphing visual only ---------------------- */
doCircles = false;
experimental = false;
rose = false;
doOld = true;
var roseCount = 0;

function visualize() {

    var bufferLength = analyser.fftSize;
    var dataArray = new Uint8Array(bufferLength);

    console.log("Clear rect: ");
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    var draw = function() {

        drawVisual = requestAnimationFrame(draw);

        // Looks like this is still necessary even though called before
        // That array is at the current sampleRate exposed on the AudioContext, so if it's the default 2048 fftSize, frequencyBinCount will be 1024, and if your device is running at 44.1kHz, that will equate to around 23ms of data
        analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.lineWidth = 1; //entropy;
        //ctx.strokeStyle = genreColor;

        ctx.beginPath();

        var sliceWidth = WIDTH * 1.0 / bufferLength;
        var x = 0;

        //var numLines = zcr * 50;

        //ctx.moveTo(WIDTH/2, HEIGHT/2);
        // Rose
        if (rose) {
            var entropyDecimal = (entropy - Math.floor(entropy));
            var v = dataArray[0] / 128.0;
            var a = v * HEIGHT / 2;
            //v + (HEIGHT / 2)
            var b = entropyDecimal * 10;
            //console.log(a + ", " + b);
            updateRoseGraphCoordinates(a, a, true);
            // var coords = roseCoordinates[roseCount];
            // var x = coords[0];
            // var y = coords[1];
            // var nextCoords = roseCoordinates[0];
            // var nextX = nextCoords[0];
            // var nextY = nextCoords[1];
            //ctx.beginPath();
            // ctx.moveTo(x,y);
            // ctx.lineTo(nextX, nextY);

            // ctx.stroke();
            console.log("length: " + roseCoordinates.length);
            if (roseCount > roseCoordinates.length) {
                roseCount = 0;
            }
            //if (roseCount <= roseCoordinates.length) {
            for (var i = 0; i < roseCount; i++) {
                console.log("draw");
                var coords = roseCoordinates[i];
                var x = coords[0];
                var y = coords[1];
                if (i == 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            roseCount += 1;

        }

        // Circles
        if (doCircles) {
            for (var i = 0; i < numLines; i++) {
                ctx.beginPath();
                var r = energy * 100;


                var v = dataArray[i] / 128.0;
                var y = v * (HEIGHT / 3) // * HEIGHT / 2;
                var entropyDecimal = (entropy - Math.floor(entropy));
                var x = v * HEIGHT * (entropyDecimal ^ 1.5);
                //context.arc(x,y,r,sAngle,eAngle,counterclockwise);
                ctx.arc(x, y, r, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }

        // Experimental
        if (experimental) {
            for (var j = 0; j < bufferLength; j++) {

                var v = dataArray[j] / 128.0;
                var y = v * (HEIGHT / 3) // * HEIGHT / 2;
                //var x = energy * 100;
                //context.arc(x,y,r,sAngle,eAngle,counterclockwise);
                // ctx.arc(x, y, r, 0, 2 * Math.PI);
                // ctx.stroke();

                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }
        }

        // Old graphing visual

        if (doOld) {
            for (var i = 0; i < bufferLength; i++) {
                ctx.strokeStyle = genreColor;

                var v = dataArray[i] / 128.0;
                var y = v * (HEIGHT / 2) // * HEIGHT / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        }
    };

    draw();
}

function updateRoseGraphCoordinates(a, b, clearOriginal = false) {
    if (clearOriginal) {
        roseCoordinates = [];
    }

    for (var i = 0; i < (2 * Math.PI); i += 0.1) {
        //console.log(Math.cos(i))
        var y = (a * Math.cos(b * i)) * Math.cos(i) + HEIGHT / 2;
        var x = (a * Math.cos(b * i)) * Math.sin(i) + WIDTH / 2;
        //console.log(x + ", " + y);
        roseCoordinates.push([x, y]);
    }
}