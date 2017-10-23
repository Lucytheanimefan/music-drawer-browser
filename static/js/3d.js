var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("3dStuff").appendChild(renderer.domElement);
var geometry = new THREE.BoxGeometry(200, 200, 200, 10, 10, 10);
var material = new THREE.MeshBasicMaterial({ color: 0x56a0d3, wireframe: true });
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 950;
var increment = 0.01;

var doRotation = false;

var doMovement = false; //true;

var threeDAnimateID;


function animate3d() {
    var docHeight = $(document).height();
    var docWidth = $(document).width();

    if (do3d && musicPlaying) {

        var bufferLength = analyser.fftSize;
        var dataArray = new Uint8Array(bufferLength);
        var frequencyArray = new Uint8Array(analyser.frequencyBinCount);

        analyser.getByteTimeDomainData(dataArray);
        cube.material.color.set(genreColor);
        analyser.getByteFrequencyData(frequencyArray);
        //var maxFreq = Math.max(frequencyArray);
        var rotEnergy = energy; //10*energy;

        var prevNum = 0;
        var amplitudeCumulativeAverage = 0;

        var prevRotateCount = 50;
        var prevRotateRate = 0;

        for (var i = 0; i < bufferLength; i++) {

            var v = dataArray[i] / 128.0;
            //var y;
            // 
            //Magnify the effect
            var rounded = 1.1*Math.round(v);
            amplitudeCumulativeAverage = ((amplitudeCumulativeAverage * i) + v) / (i + 1);

            if (v > amplitudeCumulativeAverage || rounded != 1 || (prevNum != 1)) {
                var y = rounded * v;
                cube.scale.x = y; // SCALE
                cube.scale.y = y; // SCALE
                cube.scale.z = y; // SCALE
                prevNum = rounded;

            }

            if (v > 1.5 * amplitudeCumulativeAverage) {
                prevRotateRate = v / 50
                cube.rotateX(prevRotateRate);

                // Reset the rotate count
                prevRotateCount = 0;


            } else if (prevRotateCount < 50) {
                // If we were previously rotating, rotate on for a bit more just so we can see it
                cube.rotateX(prevRotateRate - 0.01);
                prevRotateCount += 1;
            }
            

        }
        console.log("Cumulative average: " + amplitudeCumulativeAverage);

        // // rotate cube
        if (doRotation) {
            //console.log("rotEnergy: " + rotEnergy);
            cube.rotation.x += rotEnergy;
            //cube.rotation.y += spectralEntropy;
            //cube.rotation.z += rotEnergy;
        }

        if (doMovement && mfcc.length > 0) {
            //var vector = cube.geometry.boundingSphere.center;
            //console.log(vector);
            var x = mfcc[0];
            var y = mfcc[1];
            var z = mfcc[2];
            // Of the screen in the x direction
            // if (((x > 0 && cube.position.x > 0) || (x < 0 && cube.position.x < 0))
            //  && (Math.abs(cube.position.x) >= docWidth / 2)) {
            //     console.log("Move in other x direction: cube x:" + cube.position.x + ", x: " + x);
            //     // Move to the left
            //     cube.translateX(-1 * x);
            // } else {
            //     cube.translateX(x);
            // }

            var factor = (Math.random() < 0.5) ? -1 : 1;
            cube.translateX(factor * x);

            // Off screen in the y direction
            // if (((y > 0 && cube.position.y > 0) || (y < 0 && cube.position.y < 0)) 
            // 	&& (Math.abs(cube.position.y) >= docHeight / 2)) {
            //     console.log("Move in other y direction: cube y: " + cube.position.y);
            //     cube.translateY(-1 * y);
            // } else {
            //     cube.translateY(y);
            // }
            cube.translateY(factor * y);

            cube.translateZ(z);
        }

    }
    threeDAnimateID = requestAnimationFrame(animate3d);
    renderer.render(scene, camera);
}