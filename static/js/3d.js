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


function animate3d() {
	if (!do3d){
		return;
	}
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