// The MIT License (MIT)
//
// Copyright (c) 2014 Autodesk, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// http://opensource.org/licenses/MIT

/*
 * isObject, extend, isFunction, and bind are taken from undescore/lodash in
 * order to remove the dependency
 */

var isObject = exports.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
};

exports.extend = function(obj) {
    if (!isObject(obj)) {
        return obj;
    }
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
        source = arguments[i];
        for (prop in source) {
            obj[prop] = source[prop];
        }
    }
    return obj;
};

var isFunction = exports.isFunction = function(value) {
    return typeof value === 'function';
};

exports.EventEmitter = require('events').EventEmitter;
exports.nextTick = function(callback) {
    setTimeout(callback, 0);
};

exports.handleDefaultCallback = function (listener, listenable, defaultCallback) {
    if (defaultCallback && isFunction(defaultCallback)) {
        if (listenable.getDefaultData && isFunction(listenable.getDefaultData)) {
            data = listenable.getDefaultData();
            if (data && data.then && isFunction(data.then)) {
                data.then(function() {
                    defaultCallback.apply(listener, arguments);
                });
            } else {
                defaultCallback.call(listener, data);
            }
        }
    }
};
