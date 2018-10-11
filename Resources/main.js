//Setup Canvas
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

//Setup variables
var pointAmount = 5;
var gridSize = [500, 500];
var validPoints;

//Array of points (2D)
var points = new Array(pointAmount - 1);

//UI
var nodes = document.getElementById("nodes");
var compute = document.getElementById("showCompute");
var borders = document.getElementById("showConnect");
var speed = document.getElementById("simSpeed");
var dotSize = document.getElementById("dotSize");

//
// Rendering
//
//Draws a blank point in 2D space
function drawPoint(x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, dotSize.value, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
}

function drawLine(x, y, x2, y2, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.fill();
}

//
// Initialization
//
//Generate & render random points
function generatePoints() {
    //Iterate over point amount
    for (var x = 0; x < pointAmount; x++) {
        points[x] = [(Math.random() * gridSize[0]), (Math.random() * gridSize[1])]; //Create random point
        drawPoint(points[x][0], points[x][1], "gray"); //Render point
    }
}

//
// Solution
//
async function convexHull(point) {

    var sum = 0;

    drawPoint(points[point][0], points[point][1], "green");

    //Iterate over points
    for (var y = 0; y < pointAmount; y++) {

        //Check if point has been eliminated
        if (validPoints[y] != null) {

            for (var z = 0; z < pointAmount; z++) {
                //Ensure 3 unique points
                if (point != y && point != z && y != z) {

                    //Check if point has been eliminated
                    if (validPoints[z] != null) {

                        for (var v = 0; v < pointAmount; v++) {
                            //Ensure 3 unique points
                            if (v != point && v != y && v != z) {

                                //Check if point has been eliminated
                                if (validPoints[v] != null) {

                                    if (PointInTriangle(points[v], points[point], points[y], points[z])) {
                                        validPoints[v] = null;
                                        drawPoint(points[v][0], points[v][1], "red");
                                    } else {
                                        drawPoint(points[v][0], points[v][1], "green");
                                    }
                                    if (compute.checked) {
                                        drawLine(points[point][0], points[point][1], points[y][0], points[y][1]);
                                        drawLine(points[point][0], points[point][1], points[z][0], points[z][1]);
                                        drawLine(points[y][0], points[y][1], points[z][0], points[z][1]);
                                        let delayres = await delay(speed.value);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    if(borders.checked)
        drawBorder();
}

function furthestLeft() {
    var furthestLeft = 0;
    for (var x = 0; x < pointAmount; x++) {
        if (points[furthestLeft][0] > points[x][0])
            furthestLeft = x;
    }

    return furthestLeft;
}

function drawBorder() {

    //Iterate over points
    for (var x = 0; x < pointAmount; x++) {
        //Check if point has been eliminated
        if (validPoints[x] != null) {
            for (var y = 0; y < pointAmount; y++) {

                //Check if point has been eliminated
                if (validPoints[y] != null) {

                    for (var z = 0; z < pointAmount; z++) {

                        if (validPoints[z] != null) {
                            drawLine(points[x][0], points[x][1], points[z][0], points[z][1], "green");
                        }
                    }
                }
            }
        }
    }
}


//
// Triangle calculations courtesy of Kornel Kisielewicz (https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle)
//
function sign(p1, p2, p3) {
    return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
}

function PointInTriangle(pt, v1, v2, v3) {
    var b1, b2, b3;

    b1 = sign(pt, v1, v2) < 0.0;
    b2 = sign(pt, v2, v3) < 0.0;
    b3 = sign(pt, v3, v1) < 0.0;

    return ((b1 == b2) && (b2 == b3));
}

//Delay function
async function delay(delayInms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(2);
        }, delayInms);
    });
}

function runSimulation() {
    //Clear canvas
    ctx.clearRect(0, 0, gridSize[0], gridSize[1]);

    //Update node amount
    pointAmount = nodes.value;


    //Generate & render random points
    generatePoints();

    // Fill valid points array
    validPoints = new Array(pointAmount - 1);
    for (var x = 0; x < pointAmount; x++)
        validPoints[x] = points[x];

    convexHull(furthestLeft());
}


