//
// Var declaration:
//

//Setup variables
var pointAmount = 5;
var gridSize = [500, 500];
var validPoints;

// Array of points (2D)
var points = new Array();
var lines = new Array();

//
// UI DOM References:
//
// Canvas
const c = document.getElementById("myCanvas");
const ctx = c.getContext("2d");

var nodes = document.getElementById("nodes");

// Params
const compute = document.querySelector("#showCompute");
const borders = document.querySelector("#showConnect");
const speed = document.getElementById("simSpeed");
const dotSize = document.getElementById("dotSize");
const line_width = document.getElementById("lineWidth");

// Initialize canvas width/height
gridSize = [(document.documentElement.clientWidth / 100) * 68, (document.documentElement.clientHeight / 100) * 84]
ctx.canvas.width = gridSize[0];
ctx.canvas.height = gridSize[1];

//
// Point Class
//
class Point {
    // Constructor
    constructor(x, y) {
        // Add x and y to object
        this.pos = {
            "x": x,
            "y": y
        }

        // Set perimeter to true
        this.perimeter = null;
    }

    // Draws the point onto the canvas given the position (pos)
    // and state of point (perimeter)
    draw(colour) {
        // Change colour of point depending on perimeter status
        if (this.perimeter)
            ctx.fillStyle = "green";
        else if (this.perimeter != null)
            ctx.fillStyle = "red";
        else
            ctx.fillStyle = "black";

        // If colour override is set
        if (typeof colour != undefined)
            ctx.fillStyle = colour;

        // Draw dot onto canvas
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, dotSize.value, 0, 2 * Math.PI, true);
        ctx.closePath();
        ctx.fill();
    }

    connect(_point, colour) {
        // If a colour has been passed to the method use it
        if (typeof colour != 'undefined')
            ctx.strokeStyle = colour;
        else
            ctx.strokeStyle = "black";

        // Change line width
        ctx.lineWidth = line_width.value;

        // Draw connecing line between points
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(_point.pos.x, _point.pos.y);
        ctx.stroke();
        ctx.fill();
    }

    static async connect_perimeter() {
        // Pull all perimeter points
        var perimeter_points = Point.all_perimeter(points);

        // Sort array be x position (find leftmost point)
        for (var x = 0; x < perimeter_points.length; x++) {
            for (var y = x; y < perimeter_points.length; y++) {
                if (perimeter_points[x].pos.x > perimeter_points[y].pos.x) {
                    var temp = perimeter_points[x];
                    perimeter_points[x] = perimeter_points[y];
                    perimeter_points[y] = temp;
                }
            }
        }

        // Errorcheck:
        if (perimeter_points.length < 3)
            return console.error("Not enough points to connect perimeter!");

        // Run async if not showing computations
        if (showCompute.checked) {
            // Iterate over each perimeter point and connect it to it's adjacent points
            perimeter_points.forEach(async function (point) {
                // Pull all perimeter points
                var _points = Point.all_perimeter(points);
                // Sort points by x value (leftmost first)
                _points = point.smallest_distances(_points);

                // Push closest point to smallest distances array
                var closest_point = await point.closest_point(_points);

                // Push line to array
                lines.push([
                    [point.pos.x, point.pos.y],
                    [closest_point.pos.x, closest_point.pos.y]
                ]);

                // Draw connection
                point.connect(closest_point);
            });
        } else {
            // Run sync for visualization
            for (var x = 0; x < perimeter_points.length; x++) {
                // Pull all perimeter points
                var _points = Point.all_perimeter(points);
                // Sort points by x value (leftmost first)
                _points = perimeter_points[x].smallest_distances(_points);

                // Push closest point to smallest distances array
                var closest_point = await perimeter_points[x].closest_point(_points);

                // Push line to array
                lines.push([
                    [perimeter_points[x].pos.x, perimeter_points[x].pos.y],
                    [closest_point.pos.x, closest_point.pos.y]
                ]);

                // Draw connection
                perimeter_points[x].connect(closest_point);
            }
        }
    }

    // Returns cross product of 2 points
    cross_product(a, b) {
        return a[0] * b[1] - a[1] * b[0];
    }

    async closest_point(_points) {
        var next = _points[0];

        // Iterate over each point
        for (var x = 0; x < _points.length; x++) {
            // Check if current point is itself. Skip if so.
            if (_points[x] != this) {
                // Calculate vectors (differences between points)
                var a = this.difference(_points[x]);
                var b = this.difference(next);

                // Check if cross product between vectors is negative.
                // If so, the next connecting point (next) updates to _points[x]
                if (this.cross_product(a, b) < 0)
                    next = _points[x];

                if (showCompute.checked) {
                    refresh();
                    this.connect(next, "orange");
                    let delayres = await delay();
                }
            }
        }

        // Return next connection point
        return next;
    }

    smallest_distances(_points) {
        for (var x = 0; x < _points.length; x++) {
            for (var y = x; y < _points.length; y++) {
                if (this.distance_to_point(_points[x]) < this.distance_to_point(_points[y])) {
                    var temp = _points[x]
                    _points[x] = _points[y]
                    _points[y] = temp
                }
            }
        }

        return _points;
    }

    difference(_point) {
        return [
            [this.pos.x - _point.pos.x],
            [this.pos.y - _point.pos.y]
        ]
    }

    // Return distance to point
    distance_to_point(_point) {
        return Math.sqrt((this.pos.x - _point.pos.x) ** 2 + (this.pos.y - _point.pos.y) ** 2);
    }

    async is_perimeter() {
        // Iterate over each point and check if the current point it is within a triangle 
        // made out of any other two points.
        for (var y = 0; y < points.length; y++) {
            if (points[y].perimeter != false) {
                var perimeter = Point.all_perimeter(points);

                // Iterate over remaining points
                for (var x = 0; x < perimeter.length - 1; x++) {
                    // Check that check points do not equal eachoter
                    if (perimeter[x] == points[y] || perimeter[x + 1] == points[y])
                        break;

                    // Check that three points are not the current point
                    if (perimeter[x] != this && points[y] != this && perimeter[x + 1] != this) {
                        // Draw triangle
                        if (showCompute.checked) {
                            refresh();

                            // Draw current check point as blue
                            this.draw("blue");

                            perimeter[x].connect(points[y], "orange");
                            points[y].connect(perimeter[x + 1], "orange");
                            perimeter[x + 1].connect(perimeter[x], "orange");
                            let delayres = await delay();
                        }

                        // If the point was found to be within the triange set it's perimeter status to false and return
                        if (this.PointInTriangle(points[y], perimeter[x], perimeter[x + 1]))
                            return this.perimeter = false;
                    }
                }
            }
        }

        return this.perimeter = true;
    }

    coords() {
        return [this.pos.x, this.pos.y];
    }

    PointInTriangle(v1, v2, v3) {
        var b1, b2, b3;

        b1 = sign(this, v1, v2) < 0.0;
        b2 = sign(this, v2, v3) < 0.0;
        b3 = sign(this, v3, v1) < 0.0;

        return ((b1 == b2) && (b2 == b3));
    }

    // Takes in a list of point objects and returns
    // an array of all points objects which are perimeter types.
    static all_perimeter(_array) {
        var return_arr = new Array(); // New return array

        // Iterate over given array and check if each point is a perimeter point
        _array.forEach(function (point) {
            if (point.perimeter || point.perimeter == null)
                return_arr.push(point);
        });

        return return_arr;
    }
}

//
// Render
//
function refresh() {
    //Clear canvas
    ctx.clearRect(0, 0, gridSize[0], gridSize[1]);

    // Draw lines to screen
    lines.forEach(function (line) {
        ctx.fillStyle = "black";

        // Draw connecing line between points
        ctx.beginPath();
        ctx.moveTo(line[0][0], line[0][1]);
        ctx.lineTo(line[1][0], line[1][1]);
        ctx.stroke();
        ctx.fill();
    });

    // Draw points to screen
    points.forEach(function (point) {
        point.draw();
    });
}

//
// Initialization
//
//Generate & render random points
function generatePoints() {
    // Reset point array
    points = new Array();

    //Iterate over point amount and append new point to array
    for (var x = 0; x < pointAmount; x++)
        points.push(new Point(Math.random() * gridSize[0], Math.random() * gridSize[1])); //Create random point
}

async function solve() {

    if (showCompute.checked) {
        for (var x = 0; x < points.length; x++)
            await points[x].is_perimeter();
    } else {
        // Iterate over each point
        points.forEach(async function (point) {
            await point.is_perimeter();
        });
    }
}

//
// Triangle calculations courtesy of Kornel Kisielewicz (https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle)
//
function sign(p1, p2, p3) {
    return (p1.pos.x - p3.pos.x) * (p2.pos.y - p3.pos.y) - (p2.pos.x - p3.pos.x) * (p1.pos.y - p3.pos.y);
}

//Delay function
async function delay() {
    var s = await (speed.value * 1000);

    return new Promise(resolve => {
        setTimeout(() => {
            resolve(2);
        }, s);
    });
}

async function runSimulation() {
    //Clear canvas
    ctx.clearRect(0, 0, gridSize[0], gridSize[1]);

    // Reset lines
    lines = new Array();

    //Update node amount
    pointAmount = nodes.value;


    //Generate & render random points
    generatePoints();

    await solve();

    if (borders.checked)
        await Point.connect_perimeter(points);

    refresh();
}