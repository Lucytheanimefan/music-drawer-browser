function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function lineBreak(numChars, line) {
    var toRet = "";
    for (var i = 0; i < line.length; i++) {
        toRet = toRet + line.charAt(i).toString();
        if (i % numChars == 0) {
            if (line.charAt(i + 1) == ' ') {
                toRet = toRet + "<br>";
            }
            /*else{
                            toRet = toRet + "-<br>";
                        }*/
        }
    }
    return toRet;
}


function drawLine(ctx, startx, starty, endx, endy, color = "black", width = 10) {
    // Stroked triangle
    ctx.beginPath();
    ctx.moveTo(startx, starty);
    ctx.lineTo(endx, endy);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
}

function animateLines(reqID, context, coordinates, width = 1, color = "black", opacity = 1, i = 0, callback = null) {
    setLine(context, i, coordinates, width, color, opacity);
    i += 1;

    if (i > (coordinates.length - 1)) {
        //console.log("greater than")
        if (callback) {
            //console.log("Callback!")
            callback();
        }
        cancelAnimationFrame(window["requestID" + reqID]);
        //console.log("Cancel animateLInes")

    } else {
        window["requestID" + reqID] = requestAnimationFrame(function() {
            animateLines(reqID, context, coordinates, width, color, opacity, i, callback);
        });
    }
}

function setLine(context, i, coords, width, color, opacity) {
    context.lineWidth = width;
    context.strokeStyle = color;
    context.globalAlpha = opacity;
    context.beginPath();
    if (i == 0) {
        context.moveTo(coords[i][0], coords[i][1]);
        context.lineTo(coords[i + 1][0], coords[i + 1][1]);
    } else {
        context.moveTo(coords[i - 1][0], coords[i - 1][1]);
        context.lineTo(coords[i][0], coords[i][1]);
    }
    context.closePath();
    context.stroke();
}

function generateCoordinates(start, end, step = 1, horizontal, extraCoord) {
    var coords = []
    for (var i = start; i < end; i += step) {
        if (horizontal) {
            coords.push([i, extraCoord]);
        } else {
            coords.push([extraCoord, i]);
        }
    }
    return coords;
}

/**
 * [generateDiagonalCoordinates description]
 * @param  {Object} startEnd {"start":[x,y],"end":[x1,y1]}
 * @return {[type]}          [description]
 */
function generateDiagonalCoordinates(startEnd, step = 1, keepXEnd = true, keepYEnd=true) {

    var start = startEnd["start"];
    var end = startEnd["end"];
    var newX = start[0];
    var newY = start[1];
    var coords = [start];
    if (end[0] > start[0]) {
        addX = step;
    } else {
        addX = -step;
    }
    if (end[1] > start[1]) {
        addY = step;
    } else {
        addY = -step;
    }
    while ((newX != end[0] && keepXEnd) && (newY != end[1]) && keepYEnd) {
        newX = newX + addX;
        newY = newY + addY;
        coords.push([newX, newY]);

    }
    //console.log(coords);
    return coords;

}

function crop(a, b) {
    // get the image data you want to keep.
    var imageData = ctx.getImageData(a.x, a.y, b.x, b.y);

    // create a new cavnas same as clipped size and a context
    var newCan = document.createElement('canvas');
    newCan.width = b.x - a.x;
    newCan.height = b.y - a.y;
    var newCtx = newCan.getContext('2d');

    // put the clipped image on the new canvas.
    newCtx.putImageData(imageData, 0, 0);
    return newCan;
}


function drawCircle(ctx, canvas, color, radius, x, y, clearRect = false) {
    //console.log("Draw filled circle");
    if (clearRect) {
        ctx.clearRect(-50, -50, canvas.width, canvas.height);
    }
    // draw the circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.closePath();

    // color in the circle
    ctx.fillStyle = color;
    ctx.fill();
}

function generateCircleCoordinates(steps, radius, centerX, centerY) {
    var coords = [];
    for (var i = 0; i <= steps; i++) {
        var x = (centerX + radius * Math.cos(2 * Math.PI * i / steps));
        var y = (centerY + radius * Math.sin(2 * Math.PI * i / steps));
        coords[i] = [x, y];
    }
    return coords;
}
