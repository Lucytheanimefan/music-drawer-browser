function beginFreqSpectrum() {

    // Future-proofing...
    // var context;
    // if (typeof AudioContext !== "undefined") {
    //     context = new AudioContext();
    // } else if (typeof webkitAudioContext !== "undefined") {
    //     context = new webkitAudioContext();
    // } else {
    //     $(".hideIfNoApi").hide();
    //     $(".showIfNoApi").show();
    //     return;
    // }
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
            window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };

    var frequencyData = new Uint8Array(freqAnalyser.frequencyBinCount);

    // Set up the visualisation elements
    var visualisation = $("#visualisation");
    var barSpacingPercent = 100 / freqAnalyser.frequencyBinCount;
    for (var i = 0; i < freqAnalyser.frequencyBinCount; i++) {
        $("<div/>").css("left", i * barSpacingPercent + "%")
            .appendTo(visualisation);
    }
    var bars = $("#visualisation > div");

    // Get the frequency data and update the visualisation
    function update() {
        requestAnimationFrame(update);

        freqAnalyser.getByteFrequencyData(frequencyData);

        bars.each(function(index, bar) {
            bar.style.height = frequencyData[index] + 'px';
        });
    };

    // Kick it off...
    update();
}


function beginTimeDomain(canvas) {
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
    canvasCtx = canvas.getContext("2d");


    // var visualSetting = visualSelect.value;
    // console.log(visualSetting);

    //if (visualSetting == "sinewave") {
        //analyser.fftSize = 2048;
        var bufferLength = analyser.fftSize;
        //console.log(bufferLength);
        var dataArray = new Uint8Array(bufferLength);

        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        var draw = function() {

            drawVisual = requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = 'rgb(0, 0, 0)';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(265, 265, 265)';

            canvasCtx.beginPath();

            var sliceWidth = WIDTH * 1.0 / bufferLength;
            var x = 0;

            for (var i = 0; i < bufferLength; i++) {

                var v = dataArray[i] / 128.0;
                var y = v * HEIGHT / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        };

        draw();
    //}
}