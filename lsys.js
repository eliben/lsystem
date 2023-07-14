'use strict';

let axiom = parseRule('f++f++f');

// TODO: initialize more elegantly
let rules = {};
addRule(rules, 'f=f-f++f-f');

const AngleChange = 60 * Math.PI / 180.0;
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
        angle: InitialAngle * Math.PI / 180.0,
        x: 0,
        y: 0,
        scale: 1,
    };
}

function computeFigure(rule, depth, executor) {
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
                computeFigure(rules[r.val], depth - 1, executor);
                state.scale = savedScale;
            } else if (r instanceof Pipe || r.val === 'f' || r.val === 'g') {
                // A command that requires movement -- f/g at depth 0, or
                // pipe at any depth.

                // Calculate the new position after this move.
                let newX = state.x + Math.sin(state.angle) * state.scale;
                let newY = state.y + Math.cos(state.angle) * state.scale;

                executor(state.x, state.y, newX, newY, r instanceof Pipe || r.val === 'f');
                state.x = newX;
                state.y = newY;
            }
        } else if (r instanceof Nested) {
            let savedState = structuredClone(state);
            computeFigure(r.rule, depth, executor);
            state = savedState;
        } else {
            throw new Error(`unrecognized rule ${r}`);
        }
    }
}

// TODO: Make it param, not global?
let state = initialState();

function translateCoord(c) {
    return 200 + c * 50;
}

computeFigure(axiom, 2, (oldx, oldy, newx, newy, dodraw) => {
    console.log(oldx, oldy, newx, newy, dodraw);

    Ctx.beginPath();
    Ctx.moveTo(translateCoord(oldx), translateCoord(oldy));
    Ctx.lineTo(translateCoord(newx), translateCoord(newy));
    Ctx.stroke();
});

