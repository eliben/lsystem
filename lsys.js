'use strict';

// let axiom = parseRule('f-f-f-f');
// let axiom = parseRule('f++f++f');
// let axiom = parseRule('f--f--f');
let axiom = parseRule('f');

// let rules = parseAllRules(`f=f-f+f+ff-f-f+f`);
// let rules = parseAllRules(`
// f=f-f++f-f`
// );
// let rules = parseAllRules(`
// f=f--f--f--gg
// g=gg
// `);

let rules = parseAllRules(`f=|[-f][+f]`);

// All configuration angles are in degrees.
// TODO: also add angle noise
const AngleChange = 20;
const InitialAngle = 180;
const ScaleMultiplier = 0.65;
const Depth = 7;

const CanvasSize = 400;
const BorderOffset = 10;

const Canvas = document.getElementById('plot');
const Ctx = Canvas.getContext('2d');
Canvas.width = CanvasSize;
Canvas.height = CanvasSize;

function initialState() {
    return {
        angle: InitialAngle,
        x: 0,
        y: 0,
        scale: 1,
    };
}

// Recursively compute the given rule to the given depth, using an initial
// state.
// executor is invoked every time we want to move the cursor or draw a line.
// It's called as executor(oldx, oldy, newx, newy, doDraw) when the movement
// is from (oldx, oldy) to (newx, newy) and doDraw is true if we the pen is
// down ('f' or '|'), false if it's up (just movement, 'g').
function computeFigure(rule, depth, state, executor) {
    // console.log(`## depth=${depth}:`, rule);
    for (let r of rule) {
        if (r instanceof TurnRight) {
            state.angle += r.num * AngleChange;
        } else if (r instanceof TurnLeft) {
            state.angle -= r.num * AngleChange;
        } else if (r instanceof Letter || r instanceof Pipe) {
            if (depth > 0 && r instanceof Letter) {
                // If we haven't reached final depth yet, recurse -- but only
                // for letters. Pipes never recurse.
                let savedScale = state.scale;
                state.scale *= ScaleMultiplier;
                computeFigure(rules[r.val], depth - 1, state, executor);
                state.scale = savedScale;
            } else if (r instanceof Pipe || r.val === 'f' || r.val === 'g') {
                // A command that requires movement -- f/g at depth 0, or
                // pipe at any depth.

                // Calculate the new position after this move.
                let newX = state.x + Math.sin(state.angle * Math.PI / 180.0) * state.scale;
                let newY = state.y + Math.cos(state.angle * Math.PI / 180.0) * state.scale;

                executor(state.x, state.y, newX, newY, r instanceof Pipe || r.val === 'f');
                state.x = newX;
                state.y = newY;
            }
        } else if (r instanceof Nested) {
            computeFigure(r.rule, depth, structuredClone(state), executor);
        } else {
            throw new Error(`unrecognized rule ${r}`);
        }
    }
}

function translateCoord(c) {
    return 200 + c * 11.6;
}

// Draw axes and bounds
Ctx.strokeStyle = 'rgba(0, 0, 240, 0.2)';
Ctx.beginPath();
for (let y of [0, CanvasSize / 2, CanvasSize - 1]) {
    Ctx.moveTo(0, y);
    Ctx.lineTo(CanvasSize, y);
}
for (let x of [0, CanvasSize / 2, CanvasSize - 1]) {
    Ctx.moveTo(x, 0);
    Ctx.lineTo(x, CanvasSize);
}
Ctx.stroke();

// First run to determine the boundaries of the drawing, so we can calculate
// the offsets and scale require for it to fill the canvas. The initial state
// starts with scale=1, so it uses abstract units.
let minx = Infinity;
let maxx = -Infinity;
let miny = Infinity;
let maxy = -Infinity;

Ctx.strokeStyle = '#000000';
computeFigure(axiom, Depth, initialState(), (oldx, oldy, newx, newy, dodraw) => {
    minx = Math.min(minx, newx, oldx);
    maxx = Math.max(maxx, newx, oldx);
    miny = Math.min(miny, newy, oldy);
    maxy = Math.max(maxy, newy, oldy);
});

// Now we have the boundaries of the drawing in abstract units (scale=1), but
// we want to draw it on a real canvas!
//
// We want to map the drawing coordinates to the canvas coordinates. Let's
// say that the drawing looks like this:
//
//       +----+
//       |    |
//       |    |
//       |    |
//       |    |
//       +----+
//
// But the canvas looks like this:
//
//       +---------------------+
//       |                     |
//       |                     |
//       |                     |
//       |                     |
//       |                     |
//       |                     |
//       |                     |
//       |                     |
//       |                     |
//       +---------------------+
//
// The mapping is done in two steps:
//
// 1. Calculate the scaling factor to make the drawing just fit in the canvas;
//    the drawing can still be shifted relative to the canvas.
//
//        Drawing
//    +------------+
//    |            |   Canvas
//    |  +---------+-----------+
//    |  |         |           |
//    |  |         |           |
//    |  |         |           |
//    |  |         |           |
//    |  |         |           |
//    |  |         |           |
//    |  |         |           |
//    +--+---------+           |
//       |                     |
//       +---------------------+
//
// 2. Calcualte the shift needed to move the drawing into the canvas, centering
//    it if possible.

// "draw scale" - the scaling factor we have to multiply the
// computed coordinates to map to our canvas.
// Choose the larger range to make sure the drawing fits both x-wise and y-wise.
let xrange = maxx - minx;
let yrange = maxy - miny;
let maxrange = Math.max(xrange, yrange);
let drawscale = (CanvasSize - 2 * BorderOffset) / maxrange;

// How much shift to the right and down is required to fit into the canvas.
let xoffset = CanvasSize / 2 - (minx + xrange / 2) * drawscale;
let yoffset = CanvasSize / 2 - (miny + yrange / 2) * drawscale;

// Second run to actually draw the figure in the right place/scale.
function translateX(x) { return xoffset + x * drawscale; }
function translateY(y) { return yoffset + y * drawscale; }

computeFigure(axiom, Depth, initialState(), (oldx, oldy, newx, newy, dodraw) => {
    if (dodraw) {
        Ctx.beginPath();
        Ctx.moveTo(translateX(oldx), translateY(oldy));
        Ctx.lineTo(translateX(newx), translateY(newy));
        Ctx.stroke();
    }
});

