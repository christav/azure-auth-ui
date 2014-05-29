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

var masterRE = /(%%)|%([sdji])|%{(\d+)(?::(.))?}|%{([^:}]+)(?::(.))?}/g;

function doFormat(code, value) {
  switch (code) {
    case 's': return String(value);
    case 'd': return Number(value);
    case 'j': return JSON.stringify(value);
    case 'i': return util.inspect(value, null);
    default: return value;
  }
}

function sfmt(format) {
  var argIndex = 1;
  var args = arguments;

  var namedArg = arguments[1];

  return format.replace(masterRE, function (x, percents, positionalFormat, index, indexFormat, named, namedFormat) {
    if (percents) {
      return '%';
    }

    if (positionalFormat) {
      return doFormat(positionalFormat, args[argIndex++]);
    }

    if (index) {
      return doFormat(indexFormat, args[+index + 1]);
    }

    if (named) {
      return doFormat(namedFormat, namedArg[named]);
    }
  });
}

module.exports = sfmt;
