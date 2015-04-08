var fc = (function (messageListener) {
    "use strict";

    var setImmediate,
        clearImmediate;

    function quickSlice(arrayLike, start) {
        var newArray = [],
            length = arrayLike.length,
            index;

        start = start || 0;

        for (index = start; index < length; index += 1) {
            newArray.push(arrayLike[index]);
        }

        return newArray;
    }

    function range(length, initialValue) {
        var array = [],
            valueFunction,
            index;

        if ((typeof initialValue) === 'function') {
            valueFunction = initialValue;
        } else {
            valueFunction = function () {
                return initialValue;
            };
        }

        for (index = 0; index < length; index += 1) {
            array.push(valueFunction(index));
        }

        return array;
    }

    function indexOf(arrayLike, testFunction, start) {
        var index,
            length = arrayLike.length;
        start = start || 0;

        for (index = start; index < length; index += 1) {
            if (testFunction(arrayLike[index]) === true) {
                return index;
            }
        }
        return -1;
    }

    function assign(base) {
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
    }

    function each(arrayLike, func) {
        Array.prototype.forEach.call(arrayLike, func);
    }

    function find(arrayLike, testFunction) {
        var index = indexOf(arrayLike, testFunction);
        if (index === -1) {
            return;
        }
        return arrayLike[index];
    }

    function group(arrayLike, keyFunction) {
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
    }

    (function () {
        var immediates = {};

        setImmediate = function (func) {
            var id = Date.now().toString() + Math.random(),
                args = quickSlice(arguments, 1),
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

    function passableLog() {
        return console.log.apply(console, quickSlice(arguments));
    }
    function passableError() {
        return console.error.apply(console, quickSlice(arguments));
    }

    function promise(func) {
        if (func !== undefined && (typeof func) !== 'function') {
            throw new TypeError("Argument given to factotum:promise is not a function");
        }
        func = func || null;

        var successCallbacks = [],
            failureCallbacks = [],
            status = "pending",
            finalValue;

        function resolve(value) {
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
        }

        function reject(value) {
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
        }

        function callbackWrapper(callback, nextPromise) {
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
        }
        function then(onSuccess, onFailure) {
            onSuccess = onSuccess || null;
            onFailure = onFailure || null;

            var nextPromise = promise();

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
        }

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
    }
    promise.all = function () {
        var args = quickSlice(arguments),
            finalValues = range(args.length),
            remaining = args.length,
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
        var first = fc.promise();

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

    function ajaxGet(url, headers) {
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
    }

    function ajaxPost(url, data, headers) {
        headers = headers || {};

        return promise(
            function (resolve, reject) {
                var request = new XMLHttpRequest(),
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
    }

    function sprintf(format) {
        var args = quickSlice(arguments, 1);

        return format.replace(
            /\%\%|\%\{[a-zA-Z0-9\/ ]+?\}/g,
            function (str) {
                if (str === "%%") {
                    return "%";
                }

                var info = str.slice(2, -1).split('/'),
                    propertyChain = info[0].split('.'),
                    formatType = info[1] || 'string',
                    value = args,
                    formatFunction = null;

                if (sprintf.userFormat.hasOwnProperty(formatType) === true) {
                    formatFunction = sprintf.userFormat[formatType];
                }
                if (sprintf.format.hasOwnProperty(formatType) === true) {
                    formatFunction = sprintf.format[formatType];
                }

                if (formatFunction === null) {
                    throw new Error("Format `" + formatType + "` has not been added to sprintf");
                }

                propertyChain.forEach(
                    function (prop) {
                        value = value[prop];
                    }
                );

                return formatFunction(value);
            }
        );
    }
    sprintf.format = Object.freeze({
        string: function (value) {
            return value.toString();
        },
        number: function (value) {
            return (+value);
        },
        exp: function (value) {
            return (+value).toExponential();
        },
        EXP: function (value) {
            return (+value).toExponential().toUpperCase();
        },
        hex: function (value) {
            return (+value).toString(16);
        },
        HEX: function (value) {
            return (+value).toString(16).toUpperCase();
        },
        bin: function (value) {
            return (+value).toString(2);
        },
        json: function (value) {
            return JSON.stringify(value);
        },
        url: function (value) {
            return encodeURIComponent(value.toString());
        }
    });
    sprintf.userFormat = {};

    return Object.freeze({
        util: {
            log: passableLog,
            error: passableError,
            setImmediate: setImmediate,
            clearImmediate: clearImmediate
        },
        slice: quickSlice,
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
        },
        sprintf: sprintf
    });
}(window));
