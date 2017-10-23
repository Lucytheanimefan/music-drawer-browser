var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("3dStuff").appendChild(renderer.domElement);
var geometry = new THREE.BoxGeometry(500, 500, 500, 10, 10, 10);
var material = new THREE.MeshBasicMaterial({ color: 0x56a0d3, wireframe: true });
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 950;
var increment = 0.01;

var doRotation = false;

function animate3d() {
    if (!do3d) {
        return;
    }
    var bufferLength = analyser.fftSize;
    var dataArray = new Uint8Array(bufferLength);
    var frequencyArray = new Uint8Array(analyser.frequencyBinCount);

    analyser.getByteTimeDomainData(dataArray);
    cube.material.color.set(genreColor);
    //analyser.getByteFrequencyData(frequencyArray);
    //var maxFreq = Math.max(frequencyArray);
    var rotEnergy = energy; //10*energy;

    for (var i = 0; i < bufferLength; i++) {

        var v = dataArray[i] / 128.0;
        var y = v; // ^ 1.5; //(HEIGHT / ) // * HEIGHT / 2;
        //console.log("rot: " + y);
        cube.scale.x = y; // SCALE
        cube.scale.y = y; // SCALE
        cube.scale.z = y; // SCALE

        // rotate cube
        // cube.rotation.x += y //rotEnergy;
        // cube.rotation.y += y //rotEnergy;
        // cube.rotation.z += y //rotEnergy;
    }


    // // rotate cube
    if (doRotation) {
        cube.rotation.x += rotEnergy;
        cube.rotation.y += rotEnergy;
        cube.rotation.z += rotEnergy;
    }
    // cube.scale.x = rotEnergy; // SCALE
    // cube.scale.y = rotEnergy; // SCALE
    // cube.scale.z = rotEnergy; // SCALE

    //console.log("rotEnergy: " + rotEnergy);

    requestAnimationFrame(animate3d);
    renderer.render(scene, camera);
}