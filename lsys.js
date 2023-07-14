'use strict';

class Letter {
    constructor(val) {
        this.val = val;
    }
}

class Pipe {
    constructor() { }
}

class TurnLeft {
    constructor(num) {
        this.num = num;
    }
}

class TurnRight {
    constructor(num) {
        this.num = num;
    }
}

class Nested {
    constructor(rule) {
        this.rule = rule;
    }
}

// Parses an l-system textural rule (or axiom) from a string to an array of
// elements.
function parseRule(s) {
    s = s.toLowerCase();
    let pos = 0;
    let rule = [];

    while (pos < s.length) {
        let c = s.charAt(pos);
        if (isLetter(c)) {
            rule.push(new Letter(c));
            pos++;
        } else if (c === '|') {
            rule.push(new Pipe());
            pos++;
        } else if (isDigit(c)) {
            // Numeric char: read the whole number and the sign following it.
            let endpos = pos + 1;
            while (endpos < s.length && isDigit(s.charAt(endpos))) {
                endpos++;
            }
            if (endpos >= s.length) {
                throw new Error(`rule ends with number starting at ${pos}`);
            }

            // Here pos points to the first char of the number, and
            // endpos at the first char after the number.
            let num = Number(s.substr(pos, endpos - pos));
            if (isNaN(num)) {
                throw new Error(`invalid number at position ${pos}`);
            }

            let sign = s.charAt(endpos);
            if (sign === '-') {
                rule.push(new TurnLeft(num));
            } else if (sign === '+') {
                rule.push(new TurnRight(num));
            } else {
                throw new Error(`bad char ${sign} after number`);
            }
            pos = endpos + 1;
        } else if (c === '[') {
            // Nesting. Find the closing ']' and call parseRule recursively.
            let endpos = s.indexOf(']', pos);
            if (endpos === -1) {
                throw new Error(`unterminated '[' at ${pos}`);
            }
            let subrule = parseRule(s.substr(pos + 1, endpos - pos - 1));
            rule.push(new Nested(subrule));
            pos = endpos + 1;
        } else {
            throw new Error(`bad char ${c}`);
        }
    }

    return rule;
}

function isDigit(c) {
    return c >= '0' && c <= '9';
}

function isLetter(c) {
    return c >= 'a' && c <= 'z';
}