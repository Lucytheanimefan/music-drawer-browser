var scene;
var camera;
var renderer;
var geometry;
var material;
var cube;



// Settings
var doScale = true;
var doRotation = true;
var doMovement = false; //true;
var doExplosion = false;
var doVertexUpdate = false; //true;


var threeDAnimateID;

function init3d() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("3dStuff").appendChild(renderer.domElement);
    geometry = new THREE.BoxGeometry(200, 200, 200, 10, 10, 10);

    if (doExplosion) {
        prepareExplosion();
    }

    material = new THREE.MeshBasicMaterial({ color: 0x56a0d3, wireframe: true });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    camera.position.z = 950;
}


function prepareExplosion() {
    var explodeModifier = new THREE.ExplodeModifier();
    explodeModifier.modify(geometry);
    geometry.verticesNeedUpdate = true;
}

function resetCube() {
    var geometry = new THREE.BoxGeometry(200, 200, 200, 10, 10, 10);
    cube = new THREE.Mesh(geometry, material);
}

function updateVertices(xChange, yChange) {
    if (!doVertexUpdate) {
        return;
    }
    // update cube vertices
    for (var i = 0; i < geometry.vertices.length; i++) {
        //console.log("Update vertex: " + i);
        geometry.vertices[i].x += energy; //-10 + Math.random() * 20 //xChange;
        geometry.vertices[i].y += energy; //-10 + Math.random() * 20 //yChange;
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

        var bufferLength = analyser.fftSize;
        var dataArray = new Uint8Array(bufferLength);
        var frequencyArray = new Uint8Array(analyser.frequencyBinCount);

        analyser.getByteTimeDomainData(dataArray);
        cube.material.color.set(genreColor);
        analyser.getByteFrequencyData(frequencyArray);
        //var maxFreq = Math.max(frequencyArray);

        var prevNum = 0;
        var amplitudeCumulativeAverage = 0;

        var prevRotateCount = 50;
        var prevRotateRate = 0;




        for (var i = 0; i < bufferLength; i++) {

            var v = dataArray[i] / 128.0;

            //Magnify the effect
            var rounded = 1.1 * Math.round(v);
            amplitudeCumulativeAverage = ((amplitudeCumulativeAverage * i) + v) / (i + 1);

            //console.log("v: " + v + ", CumAvg: " + amplitudeCumulativeAverage);
            if (doScale) {
                if (v > amplitudeCumulativeAverage || rounded != 1 || (prevNum != 1)) {
                    //console.log("Update scale");
                    
                    var y = rounded * v;
                    // NEED this 1.3 to determine larger magnitude changes!
                     if (v > 1.3*amplitudeCumulativeAverage){
                        y = rounded^2 * v;
                     }
                    cube.scale.x = y; // SCALE
                    cube.scale.y = y; // SCALE
                    cube.scale.z = y; // SCALE
                    prevNum = rounded;

                }
            }

            // This is not working
            if (doVertexUpdate) {
                updateVertices(v * 3, v * 2);
            }

            // Explode modifier
            if (doExplosion) {
                if (v > (4 * amplitudeCumulativeAverage)) {
                    var rand = energy * (Math.random() > 0.5 ? 1 : -1);
                    explode(rand);
                }
            }

            if (doRotation) {
                if (v >= 2 * amplitudeCumulativeAverage) {

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
        //console.log("Cumulative average: " + amplitudeCumulativeAverage);

        //updateVertices(energy, energy);

        // // rotate cube
        if (doRotation) {
            console.log("----rotEnergy: " + energy);
            cube.rotation.x += energy;
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
    threeDAnimateID = requestAnimationFrame(animate3d);
    renderer.render(scene, camera);
}




/* ---------------- Particles - Not being used right now --------------- */
var particleCount;
var particles;
var pMaterial;

function initParticles() {
    // create the particle variables
    particleCount = 1800,
        particles = new THREE.Geometry(),
        pMaterial = new THREE.ParticleBasicMaterial({
            color: 0xFFFFFF,
            size: 20,
            map: THREE.ImageUtils.loadTexture(
                "images/particle.png"
            ),
            blending: THREE.AdditiveBlending,
            transparent: true
        });

    // also update the particle system to
    // sort the particles which enables
    // the behaviour we want
    particleSystem.sortParticles = true;

    // now create the individual particles
    for (var p = 0; p < particleCount; p++) {

        // create a particle with random
        // position values, -250 -> 250
        var pX = Math.random() * 500 - 250,
            pY = Math.random() * 500 - 250,
            pZ = Math.random() * 500 - 250,
            particle = new THREE.Vertex(
                new THREE.Vector3(pX, pY, pZ)
            );
        // create a velocity vector
        particle.velocity = new THREE.Vector3(
            0, // x
            -Math.random(), // y: random vel
            0); // z

        // add it to the geometry
        particles.vertices.push(particle);
    }

    // create the particle system
    var particleSystem = new THREE.ParticleSystem(
        particles,
        pMaterial);

    // add it to the scene
    scene.addChild(particleSystem);
}
// animation loop
function particleUpdate() {

    // add some rotation to the system
    particleSystem.rotation.y += 0.01;

    var pCount = particleCount;
    while (pCount--) {

        // get the particle
        var particle =
            particles.vertices[pCount];

        // check if we need to reset
        if (particle.position.y < -200) {
            particle.position.y = 200;
            particle.velocity.y = 0;
        }

        // update the velocity with
        // a splat of randomniz
        particle.velocity.y -= Math.random() * .1;

        // and the position
        particle.position.addSelf(
            particle.velocity);
    }

    // flag to the particle system
    // that we've changed its vertices.
    particleSystem.
    geometry.
    __dirtyVertices = true;

    // draw
    renderer.render(scene, camera);

    // set up the next call
    requestAnimFrame(particleUpdate);
}