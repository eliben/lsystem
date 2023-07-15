'use strict';

let axiom = parseRule('f++f++f');

// TODO: initialize more elegantly
let rules = {};
addRule(rules, 'f=f-f++f-f');

// All configuration angles are in degrees.
const AngleChange = 60;
const InitialAngle = 0;
const ScaleMultiplier = 0.65;
const CanvasWidth = 400;
const CanvasHeight = 400;

const Canvas = document.getElementById('plot');
const Ctx = Canvas.getContext('2d');
Canvas.width = CanvasWidth;
Canvas.height = CanvasHeight;

function initialState() {
    return {
        angle: InitialAngle,
        x: 0,
        y: 0,
        scale: 1,
    };
}

function computeFigure(rule, depth, state, executor) {
    console.log(`## depth=${depth}:`, rule);
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
    return 200 + c * 10;
}

computeFigure(axiom, 4, initialState(), (oldx, oldy, newx, newy, dodraw) => {
    console.log(oldx, oldy, newx, newy, dodraw);

    Ctx.beginPath();
    Ctx.moveTo(translateCoord(oldx), translateCoord(oldy));
    Ctx.lineTo(translateCoord(newx), translateCoord(newy));
    Ctx.stroke();
});

