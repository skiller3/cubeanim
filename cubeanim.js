/******************************************************************************
 SIMPLE 3D CUBE SHIFT ANIMATION

 I constructed this animation to play with HTML5's new canvas API and for the
 intellectual challenge of realistically rendering a 3-dimensional model onto a 
 2-dimensional canvas. I would of course use a real game engine or graphics API
 (like WebGL) into make any 3D games or animations worth releasing into the wild.

 NOTE:
 All 3D geometric code assumes the camera is located at cartesian coordinate 
 (0, 0, 0) and is directed in vector [0, 0, 1] in non-camera-relative space. In 
 all math/trig below, any points on the line (0, 0, z) are intended to be in the 
 very center of the viewable area (canvas).  This schema doesn't align with how 
 the canvas expects geometric input -- we translate all points to be consistent 
 with the canvas API in the cavisifyPt() function.
 
 Author: Skye Isard
******************************************************************************/

var ARROW_LEFT_KEY_CODE = 37,
    ARROW_UP_KEY_CODE = 38,
    ARROW_RIGHT_KEY_CODE = 39,
    ARROW_DOWN_KEY_CODE = 40,
    SPACEBAR_KEY_CODE = 32;

var timerIds = [],
    hasStarted = false,
    paused = false,
    viewRange = {
        lr_angle: Math.PI / 2,
        ud_angle: Math.PI / 2
    },
    cube,
    canv,
    g;

/********************************************************************
 * Represents a 3D cartesian point that is NOT RELATIVE to our camera
 ********************************************************************/
function CartesianPt3D(arr) {
    this.x = arr[0];
    this.y = arr[1];
    this.z = arr[2];
}

/********************************************************
 * Represents a point in the 2D view of our camera/canvas
 ********************************************************/
function CanvasPt2D(x, y) {
    this.x = x;
    this.y = y;
}

function toDegrees(radians) {
    return 360 * radians / (2 * Math.PI);
}

function toRadians(degrees) {
    return 2 * Math.PI * (degrees / 360);
}

function updateMetricsDisplay() {
    var html = "<label>Canvas Width: " + canv.width.toFixed(1) + "; &nbsp;Canvas Height: " + canv.height.toFixed(1);

    if (paused) {
        var cubeTopLeft = cube.points[0];
        var lr_angle = toDegrees(Math.atan(cubeTopLeft.x / cubeTopLeft.z));
        var ud_angle = toDegrees(Math.atan(cubeTopLeft.y / cubeTopLeft.z));
        html += "; &nbsp;Cube Position: ("
        html += (cubeTopLeft.x.toFixed(2) + ", " + cubeTopLeft.y.toFixed(2) + ", " + cubeTopLeft.z.toFixed(2) + ", lrangle: " + lr_angle.toFixed(1) +
            ", udangle: " + ud_angle.toFixed(1) + ")");
    }
    html += "</label>";

    $("#metrics").html(html);
}


function handleKeydown(keyEvent) {
    if (keyEvent.which == SPACEBAR_KEY_CODE) {
        keyEvent.preventDefault();
       $("#pause").click();
    } 
    else if (paused) {
        var moveDrawUpdate = function (keyEvent, xshift, yshift, zshift) {
            keyEvent.preventDefault();
            cube.move(xshift, yshift, zshift);
            cube.draw();
            updateMetricsDisplay();
        }

        if (keyEvent.shiftKey) {
            switch (keyEvent.which) {
                case ARROW_UP_KEY_CODE:
                    moveDrawUpdate(keyEvent, 0, 0, 5);
                    break;
                case ARROW_DOWN_KEY_CODE:
                    moveDrawUpdate(keyEvent, 0, 0, -5);
                    break;
                default:
                    // NO-OP       
            }
        } else {
            switch (keyEvent.which) {
                case ARROW_UP_KEY_CODE:
                    moveDrawUpdate(keyEvent, 0, 5, 0);
                    break;
                case ARROW_DOWN_KEY_CODE:
                    moveDrawUpdate(keyEvent, 0, -5, 0);
                    break;
                case ARROW_LEFT_KEY_CODE:
                    moveDrawUpdate(keyEvent, -5, 0, 0);
                    break;
                case ARROW_RIGHT_KEY_CODE:
                    moveDrawUpdate(keyEvent, 5, 0, 0);
                    break;
                default:
                    // NO-OP       
            }
        }
    }
}


/*******************************************************************
 * Waits until helper scripts are loaded and then runs the animation
 *******************************************************************/
function startAnimation() {
    if (typeof $ !== "undefined" && typeof _ !== "undefined") {
        var screenDim = Math.min($(window).width(), $(window).height()) - 40;
        $("body").attr("width", screenDim).attr("height", screenDim);
        $("#acanvas-div").attr("width", screenDim - 1).attr("height", screenDim - 1);
        $("#acanvas").attr("width", screenDim - 2).attr("height", screenDim - 2);

        if (!hasStarted) {
            var restartAnimation = _.throttle(startAnimation, 1500, {
                leading: false
            });

            $(window).resize(function () {
                _.each(timerIds, clearInterval);
                // Apparently the idiomatic way to clear an array in JS, lol.
                timerIds.length = 0;
                restartAnimation();
            });

            $("#pause").click(function () {
                paused = !paused;
                if (paused) {
                    $(this).text("Resume");
                    $("body").append("<div id='key-message'><label>Use <span>Arrow " +
                                 "Keys</span> and <span>Shift</span> to move " + 
                                 "cube.</label></div>");
                }
                else {
                    $(this).text("Pause");
                    $("#key-message").remove();
                }
                updateMetricsDisplay();
                
            });

            $(document).keydown(handleKeydown);

            hasStarted = true;
        }

        runAnimation();

        updateMetricsDisplay();
    } else {
        setInterval(startAnimation, 100);
    }
}


/*********************************************************************
 * Performs all the setup and scheduling associated with the animation
 *********************************************************************/
function runAnimation() {

    canv = $("#acanvas").get(0);
    g = canv.getContext("2d");

    /**************************************************************************
     * Do our 3D modeling  ****************************************************
     **************************************************************************/

    /*
     * A cube shape that is meant to move across the screen.
     */
    var width = 25,
        height = 25,
        length = 25;

    var cubeDepth = 100;

    var leftMotionBound = -1 * Math.tan(viewRange.lr_angle / 2) * cubeDepth,
        topMotionBound = Math.tan(viewRange.ud_angle / 2) * cubeDepth,
        rightMotionBound = -1 * leftMotionBound,
        bottomMotionBound = -1 * topMotionBound;

    var p1 = new CartesianPt3D([leftMotionBound, topMotionBound, cubeDepth]),
        p2 = new CartesianPt3D([leftMotionBound + width, topMotionBound, cubeDepth]),
        p3 = new CartesianPt3D([leftMotionBound + width, topMotionBound - height, cubeDepth]),
        p4 = new CartesianPt3D([leftMotionBound, topMotionBound - height, cubeDepth]),
        p5 = new CartesianPt3D([leftMotionBound, topMotionBound, cubeDepth + length]),
        p6 = new CartesianPt3D([leftMotionBound + width, topMotionBound, cubeDepth + length]),
        p7 = new CartesianPt3D([leftMotionBound + width, topMotionBound - height, cubeDepth + length]),
        p8 = new CartesianPt3D([leftMotionBound, topMotionBound - height, cubeDepth + length]);

    cube = {

        points: [p1, p2, p3, p4, p5, p6, p7, p8],

        motionVector: {
            x: 1,
            y: -4
        },

        move: function () {

            var moveArgs = arguments;

            if (moveArgs.length == 3) {
                _.each(this.points, function (point) {
                    point.x += moveArgs[0];
                    point.y += moveArgs[1];
                    point.z += moveArgs[2];
                });
                return;
            }

            var vect = this.motionVector;
            if (p1.x + vect.x > leftMotionBound && p2.x + vect.x < rightMotionBound) {
                _.each(this.points, function (point) {
                    point.x = point.x + vect.x;
                });
            } else {
                vect.x = -1 * vect.x;
                if (p1.y + vect.y < topMotionBound && p3.y + vect.y > bottomMotionBound) {
                    _.each(this.points, function (point) {
                        point.y = point.y + vect.y;
                    });
                } else {
                    vect.y = -1 * vect.y;
                }
            }
        },

        draw: function () {
            var cps = _.map(this.points, canvisifyPt);

            g.strokeStyle = "black";
            var drawFace = function (cp1, cp2, cp3, cp4, color) {
                g.fillStyle = color;
                g.beginPath();
                g.moveTo(cp1.x, cp1.y);
                g.lineTo(cp2.x, cp2.y);
                g.lineTo(cp3.x, cp3.y);
                g.lineTo(cp4.x, cp4.y);
                g.closePath();
                g.stroke();
                g.fill();
            }

            /*
             * NOTE: Did I mention this code is not intended to EVER be part of a 3D graphics
             * engine? Everything about this is not generic...
             */

            g.clearRect(0, 0, canv.width, canv.height);
            
            if (this.points[0].z > 0) {
                // Draw the front face
                drawFace(cps[0], cps[1], cps[2], cps[3], "red");
    
                // Draw the left face if appropriate
                if (cps[0].x > canv.width / 2) {
                    drawFace(cps[0], cps[3], cps[7], cps[4], "blue");
                }
    
                // Draw the right face if appropriate
                if (cps[1].x < canv.width / 2) {
                    drawFace(cps[1], cps[2], cps[6], cps[5], "green");
                }
    
                // Draw the top face if appropriate
                if (cps[0].y > canv.height / 2) {
                    drawFace(cps[0], cps[1], cps[5], cps[4], "purple");
                }
    
                // Draw the bottom face if appropriate
                if (cps[3].y < canv.height / 2) {
                    drawFace(cps[2], cps[3], cps[7], cps[6], "yellow");
                }
            }
        }
    };


    /**************************************************************************
     * Define our 2D rendering functions **************************************
     **************************************************************************/

    /*
     * Converts a 3D cartesian modeling point to a drawable 2D canvas point. 
     */
    function canvisifyPt(cartesianPt) {
        var polar_lr = Math.atan(cartesianPt.x / cartesianPt.z);
        var polar_ud = Math.atan(cartesianPt.y / cartesianPt.z);

        // These locations are calculated assuming (0, 0) is in the center of the 2D
        // field of vision. 
        var d2x = polar_lr * canv.width / viewRange.lr_angle;
        var d2y = polar_ud * canv.height / viewRange.ud_angle;

        // Translate these locations so they match the expectation of the canvis API. In other
        // words, assume (0, 0) is in the upper-left corner of the canvas.    
        d2x = (canv.width / 2) + d2x;
        d2y = (canv.height / 2) - d2y;
        return new CanvasPt2D(d2x, d2y);
    }



    /**************************************************************************
     * Animation Setup ********************************************************
     **************************************************************************/
    cube.draw();

    timerIds.push(setInterval(function () {
        if (!paused) {
            cube.move();
            cube.draw();
        }
    }, 5));
}

startAnimation();
