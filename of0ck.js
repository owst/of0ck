/*
 * Copyright (c) 2011, Owen Stephens
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Owen Stephens nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL Owen Stephens BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * Input symbols (with BF translation):
 *
 * oO == > - Increment the pointer.
 * oo == < - Decrement the pointer.
 * 0O == + - Increment the byte at the pointer.
 * 0o == - - Decrement the byte at the pointer.
 * Oo == . - Output the byte at the pointer.
 * OO == , - Input a byte and store it in the byte at the pointer.
 * O0 == [ - Jump forward past the matching ] if byte at the pointer is zero.
 * o0 == ] - Jump backward to the matching [ unless byte at the pointer is zero.
 */

var ptrInc    = "oO";
var ptrDec    = "oo";
var valInc    = "0O";
var valDec    = "0o";
var outVal    = "Oo";
var inVal     = "OO";
var loopBegin = "O0";
var loopEnd   = "o0";

function validate(input) {
    var inputLength = input.length;
    if (inputLength % 2 !== 0) {
        throw "Invalid input length!";
    }

    var validSymbols = [ptrInc, ptrDec, valInc, valDec, outVal, inVal,
                        loopBegin, loopEnd];
    var braceStack = [];
    var pos = 0;

    // check for correctness in program
    while (pos < inputLength >> 1) {
        var currentSymbol = input.charAt(pos * 2) + input.charAt(pos * 2 + 1);

        if ($.inArray(currentSymbol, validSymbols) < 0) {
            throw "Invalid symbol: " + currentSymbol;
        }

        if (currentSymbol === loopBegin) {
            braceStack.push(pos);
        } else if (currentSymbol === loopEnd) {
            braceStack.pop();
        }

        ++pos;
    }

    if (braceStack.length > 0) {
        throw "Unmatched brace at input position " + braceStack.pop();
    }
}

function execute(input, stdin) {
    var cells = [];

    // initialise empty cells
    var i = 30000;
    while (i--) {
        cells[i] = 0;
    }

    var cellPtr = 0;
    var outputBuffer = "";
    var pos = 0;
    var braceStack = [];

    while (pos < input.length >> 1) {
        var currentSymbol = input.charAt(pos * 2) + input.charAt(pos * 2 + 1);

        switch(currentSymbol) {
            case ptrInc:
                ++cellPtr;
                break;
            case ptrDec:
                --cellPtr;
                break;
            case valInc:
                ++cells[cellPtr];
                break;
            case valDec:
                --cells[cellPtr];
                break;
            case outVal:
                // output a character, wrapping values > 255
                outputBuffer += String.fromCharCode(cells[cellPtr] % 256);
                break;
            case inVal:
                // take a character from the stdin string, using a null byte if
                // no input is available.
                var charCode = 0;
                if (stdin.length > 0) {
                    charCode = stdin.charCodeAt(0);
                    stdin = stdin.substr(1);
                }
                cells[cellPtr] = charCode;

                break;
            case loopBegin:
                // if the current cell value is > 0 then enter the loop
                // else, skip over it.
                if (cells[cellPtr] > 0) {
                    braceStack.push(pos);
                } else {
                    // scan forwards for the matching loop end.
                    var openCount = 1;

                    while (openCount > 0) {
                        ++pos;
                        var symbol = input.charAt(pos * 2) +
                          input.charAt(pos * 2 + 1);

                        if (symbol === loopBegin) {
                            ++openCount;
                        } else if (symbol === loopEnd) {
                            --openCount;
                        }
                    }
                }
                break;
            case loopEnd:
                // when encountering a loop end, go to the start of the
                // loop if the current cell value is > 0, else continue
                if (cells[cellPtr] > 0) {
                    pos = braceStack.pop();
                    continue;
                } else {
                    braceStack.pop();
                }

                break;
        }

        ++pos;
    }

    return outputBuffer;
}

function interpret(input, stdin) {
    // remove all comment lines and whitespace
    input = input.replace(/^\*.*/mg, "").replace(/\s+/mg, "");

    validate(input);

    return execute(input, stdin);
}

function translateBfToOf0ck(bfInput) {
    var replaceArray = [
        [/\s+/mg, ""],
        [/>/g,    ptrInc],
        [/</g,    ptrDec],
        [/\+/g,   valInc],
        [/-/g,    valDec],
        [/\./g,   outVal],
        [/,/g,    inVal],
        [/\[/g,   loopBegin],
        [/\]/g,   loopEnd]
    ];

    for (var i in replaceArray) {
        bfInput = bfInput.replace(replaceArray[i][0],
                                  replaceArray[i][1]);
    }

    return bfInput;
}
