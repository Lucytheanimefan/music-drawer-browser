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

var analyser;
var frequencyData;
var timeDomainData;
var bufferLength;

var colorScheme = [];

var cursorX;
var cursorY;

var animationID;

var genreColors;
var genreColor = "#ffffff";

var red = "#ff0000";

// features
var singleMusicFeatures;
var musicFeatures;
var zcr = 0;
var energy = 0;
var entropy = 0; // measure of abrupt changes
var centroid = 0;
var spread = 0;

var roseCoordinates = [];

// 3d stuff
var scene;
var camera;
var renderer;
var cube;

function setCanvas() {
    genreColors = generateColorBasedOnGenre();
    musicFeatures = $("#musicCanvas").data("features");
    singleMusicFeatures = $("#musicCanvas").data("singlefeatures");
    //console.log(genreColors);
    //console.log(singleMusicFeatures);
    // Set the first color so it's not white
    genreColor = genreColors.shift();
    canvas = document.getElementById('musicCanvas');
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
    ctx = canvas.getContext('2d');
    canvasData = ctx.getImageData(0, 0, WIDTH, HEIGHT);


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
    duration = audio.duration;
    chunkIntervalSeconds = $("#musicCanvas").data("chunkseconds");

    var oldTime = 0;
    var i = 0;
    audio.ontimeupdate = function() {
        // Every chunk_seconds, update the color
        if (Math.abs(oldTime - audio.currentTime) >= chunkIntervalSeconds) {

            // Set the color
            genreColor = genreColors.shift(); //[i];
            console.log("Update color to " + genreColor);
            i += 1;
            oldTime = audio.currentTime;

            // Process features
            processFeature(i);
        }

        // Update other visual stuff

    };
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

    if (do3d) {
        animate3d();
    }
    //visualize();

    // we're ready to receive some data!
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

function convertGenreProbToRGB(genreProb) {
    return Math.round(genreProb * 265);
}

function generateColorBasedOnGenre() {
    var genres = $("#musicCanvas").data("genre");
    console.log(genres);
    var colors = [];
    for (var i = 0; i < genres.length; i++) {
        var genre = genres[i];
        var probs = genre[1];
        var classifiers = genre[2];

        if (probs.length == 3) {
            var genreString = "rgba(" +
                convertGenreProbToRGB(probs[0]) + "," +
                convertGenreProbToRGB(probs[1]) + "," +
                convertGenreProbToRGB(probs[2]) + ", 1)";
            colors.push(genreString);
        }
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
    zcr = featureVector[0]; // number of times signal crosses the axis
    energy = featureVector[1];
    entropy = featureVector[2]; // measure of abrupt changes
    centroid = featureVector[3];
    spread = featureVector[4];
    //console.log(zcr + "," + energy + "," + entropy + "," + centroid + "," + spread);

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

/* ------------------- 3d visual effects -------------------------- */
var scene;
var camera;
var renderer;
var cube;

function init3d() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("3dStuff").appendChild(renderer.domElement);


    // setup the shape
    var geometry = new THREE.BoxGeometry(500, 500, 500);
    var material = new THREE.MeshBasicMaterial({ color: 0x56a0d3 });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    console.log("Added cube to scene");
    console.log(scene);

}


function animate3d() {
    var bufferLength = analyser.fftSize;
    var dataArray = new Uint8Array(bufferLength);

    analyser.getByteTimeDomainData(dataArray);
    cube.material.color.set(genreColor);

    for (var i = 0; i < bufferLength; i++) {

        var v = dataArray[i] / 128.0;
        var y = v * (HEIGHT / 2) // * HEIGHT / 2;
        //console.log("Size: " + v);
        cube.scale.x = v; // SCALE
        cube.scale.y = v; // SCALE
        cube.scale.z = v; // SCALE
    }

    requestAnimationFrame(animate3d);
    renderer.render(scene, camera);
}
//animate();