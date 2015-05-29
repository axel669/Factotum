var fc;
fc = (function (messageListener) {
    "use strict";

    var ajaxGet;
    var ajaxPost;
    var assign;
    var each;
    var find;
    var group;
    var indexOf;
    var promise;
    var quickSlice;
    var range;
    var remove;

    var passableError;
    var passableLog;

    var clearImmediate;
    var setImmediate;

    quickSlice = function (arrayLike, start) {
        var index;
        var length;
        var newArray;

        start = start || 0;
        length = arrayLike.length;
        newArray = [];

        index = start;
        while (true) {
            newArray.push(arrayLike[index]);

            index += 1;
            if (index === length) {
                break;
            }
        }

        return newArray;
    };

    remove = function (arrayLike, index, count) {
        var slice;

        slice = Array.prototype.slice.bind(arrayLike);
        count = count || 1;

        return slice(0, index).concat(slice(index + count));
    };

    range = function (length, initialValue) {
        var array;
        var index;
        var valueFunction;

        array = [];
        if ((typeof initialValue) === 'function') {
            valueFunction = initialValue;
        } else {
            valueFunction = function () {
                return initialValue;
            };
        }

        index = 0;
        while (true) {
            array.push(valueFunction(index));

            index += 1;
            if (index === length) {
                break;
            }
        }

        return array;
    };

    indexOf = function (arrayLike, testFunction, start) {
        var index;
        var length;

        start = start || 0;
        length = arrayLike.length;

        index = 0;
        while (true) {
            if (testFunction(arrayLike[index]) === true) {
                return index;
            }

            index += 1;
            if (index === length) {
                break;
            }
        }
        return -1;
    };

    assign = function (base) {
        quickSlice(arguments, 1).forEach(
            function (arg) {
                if (arg === undefined) {
                    return;
                }
                Object.keys(arg).forEach(
                    function (key) {
                        base[key] = arg[key];
                    }
                );
            }
        );
        return base;
    };

    each = function (arrayLike, func) {
        Array.prototype.forEach.call(arrayLike, func);
    };

    find = function (arrayLike, testFunction) {
        var index;

        index = indexOf(arrayLike, testFunction);
        if (index === -1) {
            return;
        }
        return arrayLike[index];
    };

    group = function (arrayLike, keyFunction) {
        var groups = {};

        each(
            arrayLike,
            function (value) {
                var key = keyFunction(value);

                if (groups.hasOwnProperty(key) === false) {
                    groups[key] = [];
                }
                groups[key].push(value);
            }
        );

        return groups;
    };

    (function () {
        var immediates = {};

        setImmediate = function (func) {
            var args;
            var callback;
            var id;

            id = Date.now().toString() + Math.random();
            args = quickSlice(arguments, 1);
            callback = function (evt) {
                if (evt.data === id) {
                    func.apply({}, args);
                    messageListener.removeEventListener("message", evt);
                    delete immediates[id];
                }
            };

            immediates[id] = callback;
            messageListener.addEventListener("message", callback);
            messageListener.postMessage(id, "*");

            return id;
        };

        clearImmediate = function (id) {
            if (immediates.hasOwnProperty(id) === true) {
                messageListener.removeEventListener('message', immediates[id]);
                delete immediates[id];
            }
        };
    }());

    passableLog = function () {
        return console.log.apply(console, quickSlice(arguments));
    };
    passableError = function () {
        return console.error.apply(console, quickSlice(arguments));
    };

    promise = function (func) {
        if (func !== undefined && (typeof func) !== 'function') {
            throw new TypeError("Argument given to factotum:promise is not a function");
        }

        var failureCallbacks;
        var finalValue;
        var status;
        var successCallbacks;

        var callbackWrapper;
        var reject;
        var resolve;
        var then;

        func = func || null;
        successCallbacks = [];
        failureCallbacks = [];
        status = 'pending';

        resolve = function (value) {
            if (status !== 'pending') {
                console.warn("Tried to call resolve on a non-pending factotum:promise");
                return;
            }

            status = 'resolved';
            finalValue = value;
            successCallbacks.forEach(
                function (callback) {
                    setImmediate(function () {
                        callback(value);
                    });
                }
            );

            successCallbacks = null;
            failureCallbacks = null;
        };

        reject = function (value) {
            if (status !== 'pending') {
                console.warn("Tried to call resolve on a non-pending factotum:promise");
                return;
            }

            status = 'rejected';
            finalValue = value;
            failureCallbacks.forEach(
                function (callback) {
                    setImmediate(function () {
                        callback(value);
                    });
                }
            );

            successCallbacks = null;
            failureCallbacks = null;
        };

        callbackWrapper = function (callback, nextPromise) {
            return function (value) {
                var retValue;

                try {
                    retValue = callback(value);
                    if (retValue.hasOwnProperty('then') === true && (typeof retValue.then) === 'function') {
                        retValue.then(
                            function (successValue) {
                                nextPromise.resolve(successValue);
                            },
                            function (failureValue) {
                                nextPromise.reject(failureValue);
                            }
                        );
                    } else {
                        nextPromise.resolve(retValue);
                    }
                } catch (error) {
                    nextPromise.reject(error);
                }
            };
        };
        then = function (onSuccess, onFailure) {
            var nextPromise;

            onSuccess = onSuccess || null;
            onFailure = onFailure || null;
            nextPromise = promise();

            switch (status) {
                case 'pending':
                    if (onSuccess !== null) {
                        successCallbacks.push(callbackWrapper(onSuccess, nextPromise));
                    }
                    if (onFailure !== null) {
                        failureCallbacks.push(callbackWrapper(onFailure, nextPromise));
                    }
                    break;
                case 'resolved':
                    if (onSuccess !== null) {
                        callbackWrapper(onSuccess, nextPromise)(finalValue);
                    }
                    break;
                case 'rejected':
                    if (onFailure !== null) {
                        callbackWrapper(onFailure, nextPromise)(finalValue);
                    }
                    break;
            }

            return nextPromise;
        };

        if (func !== null) {
            func(resolve, reject);
        }

        return Object.freeze({
            get status() {
                return status;
            },
            set status(value) {
                throw new Error("Cannot set status of a factotum:promise. Tried to set to `" + value + '`');
            },
            then: then,
            resolve: resolve,
            reject: reject
        });
    };
    promise.all = function () {
        var allPromise;
        var args;
        var finalValues;
        var remaining;

        args = quickSlice(arguments);
        finalValues = range(args.length);
        remaining = args.length;
        allPromise = promise();

        args.forEach(function (arg, index) {
            arg.then(function (value) {
                remaining -= 1;
                finalValues[index] = value;
                if (remaining === 0) {
                    allPromise.resolve(finalValues);
                }
            });
        });

        return allPromise;
    };
    promise.race = function () {
        var first;

        first = fc.promise();
        quickSlice(arguments).forEach(
            function (arg) {
                arg.then(function (value) {
                    if (first.status === 'pending') {
                        first.resolve(value);
                    }
                });
            }
        );

        return first;
    };

    ajaxGet = function (url, headers) {
        headers = headers || {};

        return promise(
            function (resolve, reject) {
                var request = new XMLHttpRequest();

                request.addEventListener(
                    "load",
                    function () {
                        if (request.status >= 200 && request.status < 300) {
                            resolve({
                                statusCode: request.status,
                                statusText: request.statusText,
                                text: request.responseText
                            });
                        } else {
                            reject("WHAT");
                        }
                    }
                );

                try {
                    request.open("GET", url, true);
                    Object.keys(headers).forEach(
                        function (header) {
                            request.setRequestHeader(header, headers[header]);
                        }
                    );
                    request.send(null);
                } catch (ex) {
                    reject(ex);
                }
            }
        );
    };

    ajaxPost = function (url, data, headers) {
        headers = headers || {};

        return promise(
            function (resolve, reject) {
                var postData;
                var request;

                request = new XMLHttpRequest();
                postData = JSON.stringify(data);

                request.addEventListener(
                    "load",
                    function () {
                        if (request.status >= 200 && request.status < 300) {
                            resolve({
                                statusCode: request.status,
                                statusText: request.statusText,
                                text: request.responseText
                            });
                        } else {
                            reject("WHAT");
                        }
                    }
                );

                try {
                    request.open("GET", url, true);
                    Object.keys(headers).forEach(
                        function (header) {
                            request.setRequestHeader(header, headers[header]);
                        }
                    );
                    request.setRequestHeader("Content-Type", "application/json");
                    request.send(postData);
                } catch (ex) {
                    reject(ex);
                }
            }
        );
    };

    return Object.freeze({
        util: {
            log: passableLog,
            error: passableError,
            setImmediate: setImmediate,
            clearImmediate: clearImmediate
        },
        slice: quickSlice,
        remove: remove,
        range: range,
        indexOf: indexOf,
        assign: assign,
        each: each,
        find: find,
        group: group,
        promise: promise,
        ajax: {
            get: ajaxGet,
            post: ajaxPost
        }
    });
}(window || null));
if (typeof module !== 'undefined') {
    module.exports = fc;
}
