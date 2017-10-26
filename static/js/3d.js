var scene;
var camera;
var light;
var renderer;
var geometry;
var material;
var cube;
var controls;

var container;

// Settings
var doScale = true;
var doRotation = true;
var doMovement = false; //true;
var doExplosion = false;
var doVertexUpdate = false; //true;

var timeDomain = true;
var freqDomain = false;

// Init settings
var useControls = true;
var moveCamera = false; //true;

// features
var singleMusicFeatures;
var overallMusicFeatDict;
var musicFeatures;
var zcr = 0;
var energy = 0;
var entropy = 0; // measure of abrupt changes
var centroid = 0;
var spread = 0;
var spectralEntropy = 0;
var rollOff = 0;
var mfcc = [];

var threeDAnimateID;

var magnitudeFactor = 1.2;

var expandFreqOrbit = false;

console.disableYellowBox = true;

function init3d() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);

    if (useControls) {
        controls = new THREE.OrbitControls(camera);
        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
    }

    container = document.getElementById("3dStuff");
    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    light = new THREE.HemisphereLight(0xffbf67, 0x15c6ff); //new THREE.PointLight(0xffffff, 1, 100);

    scene.add(light);

    initParticles();


    geometry = new THREE.BoxGeometry(200, 200, 200, 10, 10, 10);

    if (doExplosion) {
        prepareExplosion();
    }

    material = new THREE.MeshBasicMaterial({ color: 0x56a0d3, wireframe: true });
    cube = new THREE.Mesh(geometry, material);
    cube.receiveShadow = true;
    cube.castShadow = true;
    setUpParametersFromFeatures();
    scene.add(cube);
    camera.position.z = 950;


}

function setUpParametersFromFeatures() {
    var zcr = overallMusicFeatDict["ZCR"];
    if (zcr < 0.5) {
        // Probably soft instrumental
    } else {

    }
    var diff = zcr * 1000;
    updateVertices(diff, diff);

    var pos = Math.round(overallMusicFeatDict["spectralRolloff"] * 5000);
    animateCamera(pos, pos, pos);
}

function animateCamera(posX = 1, posY = 1, posZ = 1) {

    var from = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
    };

    var to = {
        x: posX,
        y: posY,
        z: posZ
    };
    var tween = new TWEEN.Tween(from)
        .to(to, 600)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(function() {
            camera.position.set(this.x, this.y, this.z);
            camera.lookAt(new THREE.Vector3(0, 0, 0));
        })
        .onComplete(function() {
            camera.lookAt(new THREE.Vector3(0, 0, 0));
        })
        .start();
}


function prepareExplosion() {
    var explodeModifier = new THREE.ExplodeModifier();
    explodeModifier.modify(geometry);
    geometry.verticesNeedUpdate = true;
}

function updateVertices(xChange, yChange) {
    if (!doVertexUpdate) {
        return;
    }
    cube.geometry.verticesNeedUpdate = true;
    // update cube vertices
    for (var i = 0; i < geometry.vertices.length; i += 5) {
        //console.log("Update vertex: " + i);
        cube.geometry.vertices[i].y += yChange; //-10 + Math.random() * 20 //xChange;
        cube.geometry.vertices[i].x += xChange; //-10 + Math.random() * 20 //yChange;
    }
}

function explode(explodeScale) {
    for (var i = 0; i < geometry.vertices.length - 3; i += 2) {
        //var rand = energy * (Math.random() > 0.5 ? 1 : -1);
        //var rand = 1;

        geometry.vertices[i].x += explodeScale * 0.005;
        geometry.vertices[i].y += explodeScale * 0.0005;
        geometry.vertices[i].z += explodeScale * 0.00005;
        geometry.verticesNeedUpdate = true;
        var A = geometry.vertices[i + 0]
        var B = geometry.vertices[i + 1]
        var C = geometry.vertices[i + 2]

        var scale = 1 + Math.random() * 0.05;
        A.multiplyScalar(scale);
        B.multiplyScalar(scale);
        C.multiplyScalar(scale);
    }
}



function animate3d() {
    //console.log("ANIMATE 3D");
    var docHeight = $(document).height();
    var docWidth = $(document).width();

    if (do3d && musicPlaying) {
        if (moveCamera) {
            TWEEN.update();
        }


        var bufferLength = analyser.fftSize;
        var timeDomainArray = new Uint8Array(bufferLength);

        analyser.getByteTimeDomainData(timeDomainArray);
        cube.material.color.set(genreColor);

        // Frequency
        // var freqBufferLength = analyser.frequencyBinCount;
        // var frequencyArray = new Uint8Array(freqBufferLength);
        // analyser.getByteFrequencyData(frequencyArray);
        //var maxFreq = Math.max(frequencyArray);

        // var dataArray;
        // if (timeDomain) {
        dataArray = timeDomainArray;
        // } else {
        //     dataArray = frequencyArray;
        // }

        //console.log(frequencyArray);

        var prevNum = 0;
        var amplitudeCumulativeAverage = 0;
        //var freqCumulativeAverage = 0;

        var prevRotateCount = 50;
        var prevRotateRate = 0;

        //var j = 0;


        // Time domain
        for (var i = 0; i < bufferLength; i++) {
            // var freq = frequencyArray[i];
            // var f;

            var v = dataArray[i] / 128.0;

            //Magnify the effect
            var rounded = 1.1 * Math.round(v);
            amplitudeCumulativeAverage = ((amplitudeCumulativeAverage * i) + v) / (i + 1);

            // if (!isNaN(freq) && freq != 0) {
            //     freqCumulativeAverage = ((freqCumulativeAverage * i) + freq) / (i + 1);
            //     f = (frequencyArray[i] / 100000) ^ 2;
            //     j+=1;
            // }

            //console.log("v: " + v + ", CumAvg: " + amplitudeCumulativeAverage);
            if (doScale) {
                if (v > amplitudeCumulativeAverage || rounded != 1 || (prevNum != 1)) {
                    //console.log("Update scale");

                    var y = rounded * v;
                    // NEED this 1.3 to determine larger magnitude changes!
                    if (v > magnitudeFactor * amplitudeCumulativeAverage) {
                        y = rounded ^ rounded * v;
                        if (v > 2 * amplitudeCumulativeAverage) {
                            expandFreqOrbit = true;
                        }
                    } else {
                        expandFreqOrbit = false;
                    }
                    cube.scale.x = y; // SCALE
                    cube.scale.y = y; // SCALE
                    cube.scale.z = y; // SCALE
                    prevNum = rounded;

                } else {
                    expandFreqOrbit = false;
                }
            }

            // Explode modifier
            if (doExplosion) {
                if (v > (4 * amplitudeCumulativeAverage)) {
                    var rand = energy * (Math.random() > 0.5 ? 1 : -1);
                    explode(rand);
                }
            }

            if (doRotation) {
                //console.log(f);
                // if (f != undefined && !isNaN(f)) {
                //     if (2*freq > freqCumulativeAverage) {
                //         cube.rotateX(f);
                //     } else if (freq > freqCumulativeAverage){
                //         cube.rotateY(f);
                //     } else {
                //         cube.rotateZ(f);
                //     }
                // }
                if (v >= magnitudeFactor * amplitudeCumulativeAverage) {

                    prevRotateRate = v // / 50;
                    cube.rotateX(prevRotateRate);

                    // Reset the rotate count
                    prevRotateCount = 0;
                } else if (prevRotateCount < 50) {
                    // If we were previously rotating, rotate on for a bit more just so we can see it
                    cube.rotateX(prevRotateRate - 0.01);
                    prevRotateCount += 1;
                }
            }
        }

        //console.log("Freq cumulative average: " + freqCumulativeAverage + ", j: " + j);

        // rotate cube


        if (moveCamera && rollOff != undefined && rollOff != 0) {
            console.log("RollOff: " + rollOff);
            //let pos = Math.round(rollOff * 5000) ^ 3;
            let roundedRollOff = 1
            let overallRollOff = overallMusicFeatDict["spectralRolloff"];
            if (rollOff > overallRollOff) {
                console.log("Greater");

                var rollOffm = rollOff - overallRollOff;
                var pos = Math.round(rollOffm * 5000) ^ 3;
                if (3 * rollOffm < overallRollOff) {
                    animateCamera(0, pos, pos);
                } else if (2 * rollOffm < overallRollOff) {
                    animateCamera(pos, 0, pos);
                } else {
                    animateCamera(pos, pos, 0);
                }
            } else if (rollOff < overallRollOff) {
                console.log("Smaller");
                var rollOffm = overallRollOff + rollOff;
                var pos = Math.round(rollOffm * 5000) ^ 3;
                if (3 * rollOffm > overallRollOff) {
                    animateCamera(0, pos, pos);
                } else if (2 * rollOffm > overallRollOff) {
                    animateCamera(pos, 0, pos);
                } else {
                    animateCamera(pos, pos, 0);
                }
            }

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
            //  && (Math.abs(cube.position.y) >= docHeight / 2)) {
            //     console.log("Move in other y direction: cube y: " + cube.position.y);
            //     cube.translateY(-1 * y);
            // } else {
            //     cube.translateY(y);
            // }
            cube.translateY(factor * y);

            cube.translateZ(z);
        }

    }
    controls.update();
    threeDAnimateID = requestAnimationFrame(animate3d);
    renderer.render(scene, camera);
}




/* ---------------- Particles - Not being used right now --------------- */
var particleCount;
var pointMaterial;
var particles, uniforms;
var stats;
//var pMaterial;
//var particleSystem;
var raycaster, intersects;
var mouse, INTERSECTED;
var PARTICLE_SIZE = 20;

var sphereParent, spheres;
var particleLength = 32; // 64 fft size
var orbitRadius = originalOrbitRadius = 270;

function initParticles() {
    sphereParent = new THREE.Object3D();
    var coords = generateCircleCoordinates(32, orbitRadius, 0, 0);

    for (var i = 0; i < particleLength; i++) {
        let coord = coords[i];
        var radius = 17 //1 + i;
        var sphereGeometry = new THREE.DodecahedronGeometry(radius); //THREE.BoxGeometry(20, 20, 20, 10, 10, 10);//new THREE.SphereGeometry(radius, 16, 8);
        var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff, wireframe: true });
        var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.x = coord[0];
        sphere.position.y = coord[1];
        sphereParent.add(sphere);
    }
    sphereParent.position.set(0, 0, 200);
    console.log(sphereParent);
    scene.add(sphereParent);



    //--------------

}

var prevFreqArray = new Array(particleLength).fill(0);
var sphereColor = new THREE.Color("rgb(255,255,255)");
var radExpand = 50;
var radDecrease = 5;
function particleRender() {
    //onsole.log(freqAnalyser);
    // Frequency
    var freqBufferLength = freqAnalyser.frequencyBinCount;
    var frequencyArray = new Uint8Array(freqBufferLength);
    freqAnalyser.getByteFrequencyData(frequencyArray);


    spheres = sphereParent.children;
    //console.log(frequencyArray[0]);
    for (var i = 0; i < freqBufferLength; i++) {
        var f = (frequencyArray[i] / (frequencyArray[0] / 3)); // * 2;


        //console.log(f);
        var sphere = spheres[i];

        sphere.scale.x = f;
        sphere.scale.y = f;
        sphere.scale.z = f;

        // Change color for signficant changes
        var color = new THREE.Color(genreColor);
        if (1.1 * prevFreqArray[i] <= frequencyArray[i]) {

            sphere.material.color = color;
        } else {
            sphere.material.color = sphereColor;
        }



    }

    // Move everything apart
    if (expandFreqOrbit) {
        orbitRadius += radExpand;
        setSpherePosition();
        // var coords = generateCircleCoordinates(32, orbitRadius, 0, 0);
        // for (var i = 0; i < coords.length; i++) {
        //     let coord = coords[i];
        //     let sphere = spheres[i];
        //     if (sphere != undefined) {
        //         sphere.position.x = coord[0];
        //         sphere.position.y = coord[1];
        //     }
        // }
    } else if (originalOrbitRadius < orbitRadius) {
        orbitRadius += -1*radDecrease;
        setSpherePosition();
    }

    //sphereParent.rotateY(energy);
    //sphereParent.rotateZ(energy);
    prevFreqArray = frequencyArray;
    renderer.render(scene, camera);
}

function setSpherePosition() {
    var coords = generateCircleCoordinates(32, orbitRadius, 0, 0);
    for (var i = 0; i < coords.length; i++) {
        let coord = coords[i];
        let sphere = spheres[i];
        if (sphere != undefined) {
            sphere.position.x = coord[0];
            sphere.position.y = coord[1];
        }
    }
}

// animation loop
function particleUpdate() {
    requestAnimationFrame(particleUpdate);
    particleRender();
    //stats.update();
}