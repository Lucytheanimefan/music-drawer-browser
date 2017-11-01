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
var particleAnimateID;

var magnitudeFactor = 1.2;

var expandFreqOrbit = false;

var centerShapeRadius;

// Particles
// 
// 
var timeDomainParent, mfccSpheres;
var sphereParent, spheres;
var particleLength = 32; // 64 fft size
var orbitRadius = originalOrbitRadius = 540;

// Frequencies
var prevFreqArray = new Array(particleLength).fill(0);
var sphereColor = new THREE.Color("rgb(255,255,255)");
var radExpand = 50;
var radDecrease = 5;

//

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

    orbitRadius = originalOrbitRadius = overallMusicFeatDict["spectralSpread"] * 2500;
    console.log("orbitRadius: " + orbitRadius);


    let segments = overallMusicFeatDict["spectralEntropy"] * 50;
    centerShapeRadius = overallMusicFeatDict["ZCR"] * 1000;
    geometry = new THREE.SphereGeometry(centerShapeRadius, segments, segments); //.BoxGeometry(200, 200, 200, 10, 10, 10);

    if (doExplosion) {
        prepareExplosion();
    }

    initParticles();

    material = new THREE.MeshBasicMaterial({ color: 0x56a0d3, wireframe: true });
    cube = new THREE.Mesh(geometry, material);
    cube.receiveShadow = true;
    cube.castShadow = true;
    scene.add(cube);
    camera.position.z = 950;
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

        dataArray = timeDomainArray;


        var prevNum = 0;
        var amplitudeCumulativeAverage = 0;

        var prevRotateCount = 50;
        var prevRotateRate = 0;

        // Time domain
        for (var i = 0; i < bufferLength; i++) {

            var v = dataArray[i] / 128.0;

            //Magnify the effect
            var rounded = 1.1 * Math.round(v);
            amplitudeCumulativeAverage = ((amplitudeCumulativeAverage * i) + v) / (i + 1);

            // Alright I want an orbit for this too.
            var sphere = timeDomainParent.children[i];

            //console.log("v: " + v + ", CumAvg: " + amplitudeCumulativeAverage);
            if (doScale) {
                if (v > amplitudeCumulativeAverage || rounded != 1 || (prevNum != 1)) {
                    //console.log("Update scale");

                    var y = rounded * v;
                    let val = v; //y * 2;
                    // NEED this 1.3 to determine larger magnitude changes!
                    if (v > magnitudeFactor * amplitudeCumulativeAverage) {
                        y = Math.pow(rounded, rounded * v);
                        if (v > 2 * amplitudeCumulativeAverage) {
                            expandFreqOrbit = true;
                        }
                    } else {
                        expandFreqOrbit = false;
                    }
                    cube.scale.x = y; // SCALE
                    cube.scale.y = y; // SCALE
                    cube.scale.z = y; // SCALE

                    
                    sphere.scale.x = val;
                    sphere.scale.y = val;
                    sphere.scale.z = val;
                    if (genreColorArr != undefined) {
                        //console.log(genreColorArr);
                        let factor = i / bufferLength;
                        let newCol = rgbToString([genreColorArr[0] * factor, genreColorArr[1] * factor, genreColorArr[2] * factor]);
                        //console.log(newCol);
                        var color = new THREE.Color(newCol);
                        //console.log(color);
                        sphere.material.color = color;
                    }
                    prevNum = rounded;

                } else {
                    expandFreqOrbit = false;
                }

                var rotSpeed = Math.pow(energy,2);
                if (v > 0.8 * amplitudeCumulativeAverage) {
                    timeDomainParent.rotateX(rotSpeed);
                } else if (v > 0.4 * amplitudeCumulativeAverage) {
                    timeDomainParent.rotateY(rotSpeed);
                } else {
                    timeDomainParent.rotateZ(rotSpeed);
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
            var factor = (Math.random() < 0.5) ? -1 : 1;
            cube.translateX(factor * x);

            cube.translateY(factor * y);

            cube.translateZ(z);
        }

    }
    controls.update();
    threeDAnimateID = requestAnimationFrame(animate3d);
    renderer.render(scene, camera);
}




/* ---------------- Particles --------------- */

function initParticles() {
    // Frequency orbit
    var coords = generateCircleCoordinates(32, orbitRadius, 0, 0);
    let seg = 100 * overallMusicFeatDict["energy"];
    sphereParent = generateParticles(coords, 17, seg, seg);
    sphereParent.position.set(0, 0, 0);
    console.log(sphereParent);
    scene.add(sphereParent);

    // Time domain orbit
    //--------------
    
    let rad = Math.pow(centerShapeRadius, 0.75);
    let orbitRad = Math.pow(overallMusicFeatDict["ZCR"] * 100, 2.5) + 2*centerShapeRadius;
    //originalOrbitRadius = orbitRadius;
    console.log("Time domain rad: " + rad);
    console.log("Time domain orbit radius: " + orbitRadius);
    var timeDomainCoords = generateCircleCoordinates(timeDomainfftSize, orbitRad, 0, 0);
    timeDomainParent = generateParticles(timeDomainCoords, rad, seg, seg);
    timeDomainParent.rotateX(Math.PI / 2);
    scene.add(timeDomainParent);
}

function generateParticles(coords, radius, wSegments = 8, hSegments = 6, color = sphereColor) {
    var parent = new THREE.Object3D();
    for (var i = 0; i < coords.length; i++) {
        let coord = coords[i];
        var sphereGeometry = new THREE.SphereGeometry(radius, wSegments, hSegments); //new THREE.DodecahedronGeometry(radius); //THREE.BoxGeometry(20, 20, 20, 10, 10, 10);//
        var sphereMaterial = new THREE.MeshLambertMaterial({ color: color, wireframe: true });

        var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.x = coord[0];
        sphere.position.y = coord[1];
        parent.add(sphere);
    }
    return parent;
}

function particleRender() {
    // ----------- Frequency
    // 
    var freqBufferLength = freqAnalyser.frequencyBinCount;
    var frequencyArray = new Uint8Array(freqBufferLength);
    freqAnalyser.getByteFrequencyData(frequencyArray);

    spheres = sphereParent.children;
    mfccSpheres = timeDomainParent.children;

    var rotSpeed = energy / 2;

    for (var i = 0; i < freqBufferLength; i++) {
        var f = (frequencyArray[i] / (frequencyArray[0] / 3)); // * 2;
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

        // Start rotation in z direction
        //timeDomainParent.rotateZ(rotSpeed);

        setSpherePosition();
    } else if (originalOrbitRadius < orbitRadius) {
        orbitRadius += -1 * radDecrease;
        setSpherePosition();
        //timeDomainParent.rotateX(rotSpeed);
    } else {

        // Rotate!
        //sphereParent.rotateX(rotSpeed); // Don't rotate the freq domain, it's already too hard to see

    }

    prevFreqArray = frequencyArray;


    // ----------- MFCC
    // 
    // var singleMFCCFeature = overallMusicFeatDict["mfcc"];
    // for (var j = 0; j< mfcc.length; j++){
    //     let mfccOrig = Math.abs(singleMFCCFeature[j]);
    //     let sphere = mfccSpheres[j];
    //     // Get % diff
    //     let val = Math.abs(mfcc[j])/mfccOrig;
    //     sphere.scale.x = val;
    //     sphere.scale.y = val;
    //     sphere.scale.z = val;

    // }
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
    particleAnimateID = requestAnimationFrame(particleUpdate);
    particleRender();
    //stats.update();
}