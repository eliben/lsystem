'use strict';

let axiom = parseRule('f++f++f');

// TODO: initialize more elegantly
let rules = {};
addRule(rules, 'f=f-f++f-f');

let angleDegrees = 60;

