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
var orbitRadius = originalOrbitRadius = timeDomainOrbitRad = 540;

// Frequencies
var prevFreqArray = new Array(particleLength).fill(0);
var sphereColor = new THREE.Color("rgb(255,255,255)");
var radExpand = 50;
var radDecrease = 5;

//instrumentsDict - Array of new instruments
//Keys: "sphere" - three.js object
// "speakerIndex" - speaker/instrument index
// "firstTime" - first time getting expanded out, maybe not necessary anymore
var instrumentsDict = [];
var instrumentToObjectDict = {};
var ongoingInstrument = null;

console.disableYellowBox = true;

function init3d() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    // camera.position.set(0, .8, 1.5);
    // camera.up = new THREE.Vector3(1, 1, 1);
    // camera.lookAt(new THREE.Vector3(0, 0, 0));

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
    window.cube = createCenterSphere(centerShapeRadius, segments);
    scene.add(cube);


    // if (doExplosion) {
    //     prepareExplosion();
    // }

    initParticles();

    camera.position.z = 950;
}

function createCenterSphere(radius, segments, color = 0x56a0d3) {
    geometry = new THREE.SphereGeometry(radius, segments, segments); //.BoxGeometry(200, 200, 200, 10, 10, 10);


    material = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
    let geom = new THREE.Mesh(geometry, material);
    geom.receiveShadow = true;
    geom.castShadow = true;

    return geom;
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
        // if (moveCamera) {
        //     TWEEN.update();
        // }


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

            // Scaling for amplitude
            if (doScale) {
                if (v > amplitudeCumulativeAverage || rounded != 1 || (prevNum != 1)) {
                    //console.log("Update scale");

                    var scaleVal = rounded * v;
                    //let val = v; //y * 2;
                    // NEED this 1.3 to determine larger magnitude changes!
                    if (v > magnitudeFactor * amplitudeCumulativeAverage) {
                        scaleVal = scaleVal * rounded;
                        if (v > 2 * amplitudeCumulativeAverage) {
                            expandFreqOrbit = true;
                        }
                    } else {
                        expandFreqOrbit = false;
                    }
                    cube.scale.x = scaleVal; // SCALE
                    cube.scale.y = scaleVal; // SCALE
                    cube.scale.z = scaleVal; // SCALE

                    if (ongoingInstrument != null) {
                        ongoingInstrument.scale.x = scaleVal;
                        ongoingInstrument.scale.y = scaleVal;
                        ongoingInstrument.scale.z = scaleVal;
                    }

                    if (i % centerShapeRadius == 0) {
                        var sphere = timeDomainParent.children[i];
                        sphere.scale.x = v;
                        sphere.scale.y = v;
                        sphere.scale.z = v;
                        if (genreColorArr != undefined) {
                            //console.log(genreColorArr);
                            let factor = i / bufferLength;
                            let newCol = rgbToString([genreColorArr[0] * factor, genreColorArr[1] * factor, genreColorArr[2] * factor]);
                            //console.log(newCol);
                            var color = new THREE.Color(newCol);
                            //console.log(color);
                            sphere.material.color = color;
                        }
                    }
                    prevNum = rounded;

                } else {
                    expandFreqOrbit = false;
                }

                var rotSpeed = Math.pow(energy, 3);
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
    TWEEN.update();
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
    timeDomainOrbitRad = Math.pow(overallMusicFeatDict["ZCR"] * 100, 2.5) + 2 * centerShapeRadius;
    //originalOrbitRadius = orbitRadius;
    console.log("Time domain rad: " + rad);
    console.log("Time domain orbit radius: " + orbitRadius);
    var timeDomainCoords = generateCircleCoordinates(Math.round(timeDomainfftSize / centerShapeRadius), timeDomainOrbitRad, 0, 0); // TODO: don't use timeDomainfftSize
    timeDomainParent = generateParticles(timeDomainCoords, rad, seg, seg);
    timeDomainParent.rotateX(Math.PI / 2);
    scene.add(timeDomainParent);

    console.log("Time domain parent: ");
    console.log(timeDomainParent);
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

    // Instruments

    var instrumentExpansionFactor = 1.5;
    if (instrumentsDict.length > 0) {

        // The latest instrument
        var j = instrumentsDict.length - 1
        var instrument = instrumentsDict[j];
        var instrSphere = instrument["sphere"]; // sphere
        var speakerIndex = instrument["speakerIndex"] + 1; // speakerIndex
        var f = speakerIndex * (speakerIndex % 2 == 0 ? -1 : 1);
        var dist = f * overallMusicFeatDict["spectralCentroid"] * 10;
        var firstTime = instrument["firstTime"];

        if (Math.abs(instrSphere.position.x) < 0.5 * originalOrbitRadius) {
            instrSphere.position.x += dist; // SCALE
        }

        if (Math.abs(instrSphere.position.y) < 0.5 * originalOrbitRadius) {
            instrSphere.position.y += dist; // SCALE
        }

        if (firstTime) {
            var speed = overallMusicFeatDict["energy"] * 100; //energy * 50; //speakerIndex + 1;
            var tilt = Math.PI / 2; //0;//Math.pow(speakerIndex, 1 / 2);
            //var distance = orbitRadius + 20 * j;

            var orbitContainer = new THREE.Object3D();
            orbitContainer.rotation.z = tilt;

            var orbit = new THREE.Object3D();

            orbit.add(instrSphere);

            var tween = new TWEEN.Tween(orbit.rotation).to({ z: '+' + (Math.PI * 2) }, 10000 / speed);
            tween.onComplete(function() {
                orbit.rotation.y = 0;
                tween.start();
            });
            tween.start();

            orbitContainer.add(orbit);
            scene.add(orbitContainer);

            instrumentsDict[j]["firstTime"] = false;
            instrumentsDict[j]["tween"] = tween;
            console.log("Started tween");
        }

        // Ongoing instrument gets to go outside the frequency spectrum radius
        // if (ongoingInstrument) {
        //     if (Math.abs(ongoingInstrument.position.x) < (instrumentExpansionFactor * originalOrbitRadius)) {
        //         ongoingInstrument.position.x += 1; // SCALE
        //     }

        //     if (Math.abs(ongoingInstrument.position.y) < (instrumentExpansionFactor * originalOrbitRadius)) {
        //         ongoingInstrument.position.y += 1; // SCALE
        //     }
        // }



        for (var j in instrumentsDict) {
            //console.log(j);
            var instrument = instrumentsDict[j];
            var instrSphere = instrument["sphere"]; // sphere
            var speakerIndex = instrument["speakerIndex"] // + 1; // speakerIndex
            var firstTime = instrument["firstTime"];

            // Previously created instruments that are now playing
            var ongoing = instrumentToObjectDict[speakerIndex]["ongoing"];
            if (ongoing) {
                // Terminate
                for (var i in instrumentsDict) {
                    var instr = instrumentsDict[i];
                    var tween = instr["tween"];
                    //console.log(tween);
                    if (instr["speakerIndex"] == speakerIndex) {
                        ongoingInstrument = instrSphere;
                        ongoingInstrument.material.color = sphereColor;
                        //break;


                    } else {

                        instrSphere.material.color = new THREE.Color(genreColor);

                        // Shrink orbit radii of the non ongoing instruments

                        // If it was outside the frequency radius, move it back inside the radius
                        // if (Math.abs(instrSphere.position.x) >= 0.5 * originalOrbitRadius) {
                        //     instrSphere.position.x -= dist; // SCALE
                        // }

                        // if (Math.abs(instrSphere.position.y) >= 0.5 * originalOrbitRadius) {
                        //     instrSphere.position.y -= dist; // SCALE
                        // }
                    }
                }

            }
        }
    }

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

function createNew3DInstrument(speakerIndex = 0, color) {
    let segments = spectralEntropy * 50;
    let rad = zcr * 900;
    var sphere = createCenterSphere(rad, segments, new THREE.Color(color));
    instrumentsDict.push({ "speakerIndex": speakerIndex, "sphere": sphere, "firstTime": true });
    instrumentToObjectDict[speakerIndex] = { "sphere": sphere, "ongoing": true };
    scene.add(sphere);
    console.log("Done creating new instrument");

    // TODO: set the others ongoing to false

}

// function animateNewInstrument() {
//     var animatedID = requestAnimationFrame()
// }