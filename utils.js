let utils = {}

utils.reverse = function(str) {
  var rev = '';
  for (var i = str.length - 1; i >= 0; --i) {
    rev += str.charAt(i);
  }
  return rev;
};

utils.difference = function(str1, str2) {
  var arr1 = str1.split('');
  var arr2 = str2.split('');
  for (var i = 0; i < arr2.length; ++i) {
    for (var j = 0; j < arr1.length; ++j) {
      if (arr2[i] == arr1[j]) {
        arr1[j] = '';
        break;
      }
    }
  }
  return arr1.join('');
};

utils.shuffle = function(tilesArr) {
  // Randomly permute the array using the Knuth shuffle.
  for (var i = tilesArr.length - 1; i > 0; --i) {
    var pos = Math.round(Math.random() * i);
    var temp = tilesArr[i];
    tilesArr[i] = tilesArr[pos];
    tilesArr[pos] = temp;
  }
  return tilesArr;
};

utils.bindFn = function(fn, obj) {
  return fn.bind(obj);
};

/**
 * Binds an event handler to a given DOM element for a given event type.
 * @param {Node} element A DOM element.
 * @param {string} event An event type, without the 'on' prefix (e.g. mouseover,
 *     keyup, ...).
 * @param {Function} listener The event handler.
 */
utils.bind = function(element, event, listener) {
  if (window.addEventListener) {  // Mozilla, Netscape, Firefox
    element.addEventListener(event, listener, false);
  } else {  // IE
    element.attachEvent('on' + event, listener);
  }
};

/**
 * Unbinds an event handler to a given DOM element for a given event type.
 * @param {Node} element A DOM element.
 * @param {string} event An event type, without the 'on' prefix (e.g. mouseover,
 *     keyup, ...).
 * @param {Function} listener The event handler that was set with bind.
 */
utils.unbind = function(element, event, listener) {
  if (window.removeEventListener) {  // Mozilla, Netscape, Firefox
    element.removeEventListener(event, listener, false);
  } else {  // IE
    element.detachEvent('on' + event, listener);
  }
};

/**
 * Unbinds, then binds the given event listener for the given DOM element.
 * @param {Node} element A DOM element.
 * @param {string} event An event type, without the 'on' prefix (e.g. mouseover,
 *     keyup, ...).
 * @param {Function} listener The event handler.
 */
utils.rebind = function(element, event, listener) {
  utils.unbind(element, event, listener);
  utils.bind(element, event, listener);
};

/**
 * Removes all children of a DOM node.
 * @param {Element} node The node to leave childless.
 */
utils.removeAllChildren = function(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
};

/**
 * Calculates the absolute position of an element in document coordinates.
 * @param {Element} node The node whose coords are to be computed.
 * @return {Object} The coordinates (x, y).
 */
utils.getDocumentCoords = function(node) {
  var el = node;
  var left = 0;
  var top = 0;
  while (el) {
    left += el.offsetLeft;
    top += el.offsetTop;
    el = el.offsetParent;
  }
  return {
    x: left,
    y: top
  };
};

export default utils;

