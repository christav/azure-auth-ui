// Maybe-monadish function
// usage:
//
// maybe(value)('prop')('prop')('prop')(function (x) { x + 2; })
// return null if any of the properties are null, otherwise returns f(value.prop.prop.prop)
// If final function is left out, result is value of final property, or null if not there.
//
// maybe(value, 'prop.prop.prop')() is shorthand
//

function maybe(value, property) {
  'use strict';

  function valueIsNull(propOrFunction, ifNullFunction) {
    if (arguments.length === 0) {
      return null;
    }

    if (typeof ifNullFunction === 'function') {
      return ifNullFunction();
    }

    if (typeof propOrFunction === 'function') {
      return null;
    }

    return valueIsNull;
  }

  function valueIsNotNull(propOrFunction) {
    if (arguments.length === 0) {
      return value;
    }

    if (typeof propOrFunction === 'function') {
      return propOrFunction(value);
    }

    return maybe(value, propOrFunction);
  }

  if (typeof value === 'undefined' || value === null) {
    return valueIsNull;
  }

  if (typeof property === 'undefined' || property === null || property === '') {
    return valueIsNotNull;
  }

  if ('number' === typeof property) {
    return maybe(value[property]);
  }

  var first = property.split('.', 1)[0];
  var rest = property.slice(first.length + 1);
  return maybe(value[first], rest);
}

module.exports = maybe;
