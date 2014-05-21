/**
* Copyright (c) Microsoft.  All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';
var util = require('util');

var positionalSpec = /%([sdj%])/g;
var indexedSpec = /%{(\d+)(?::(.))?}/g;
var namedSpec = /%{([^:}]+)(?::(.))?}/g;

function doFormat(code, value) {
  switch (code) {
    case 's': return String(value);
    case 'd': return Number(value);
    case 'j': return JSON.stringify(value);
    default: return value;
  }
}

function sfmt(format) {
  var result = "";
  var argIndex = 1;
  var args = arguments;

  result = format.replace(positionalSpec, function (x, code) {
    switch (code) {
      case '%': return '%';
      default: return doFormat(code, args[argIndex++]);
    }
  });

  result = result.replace(indexedSpec, function (x, index, code) {
    return doFormat(code, args[+index + 1]);
  });

  var namedArg = arguments[1];
  result = result.replace(namedSpec, function (x, name, code) {
    return doFormat(code, namedArg[name]);
  });

  return result;
}

module.exports = sfmt;
