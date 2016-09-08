"use strict";

var _ = require('underscore');
var moment = require('moment');
var equal = require('deep-equal');
var compare = require('./router.js').compare;

exports.diff = function (a, b) {
    var diff = {};

    for (var key in a) {
        if (b[key]) {
            if (equal(a[key], b[key], { strict: true })) {
                diff[key] = "duplicate";
            }

            //
            // need special handling for dates, subarrays, etc
            //

            if (!diff[key]) {
                diff[key] = "new";
            }
        } else {
            diff[key] = "new";
        }
    }

    return diff;
};

//compares two dates objects for precise equality
exports.isDefined = function () {
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] === undefined) {
            return false;
        }
    }
    return true;
};

exports.dateEqualMatch = function (date1, date2) {
    if (_.isUndefined(date1) || _.isUndefined(date2)) {
        return false;
    }

    return equal(date1, date2);
};

exports.dateTimeMatch = function (obj1, obj2, dateEntry) {
    if (_.isUndefined(obj1) || _.isUndefined(obj2)) {
        return false;
    }

    var matchPercent = 0;

    // convert date to dateTime and timezone with specific format to have the best result
    var secDateA = moment(moment.utc(obj1[dateEntry.path]).format('YYYY-MM-DDTHH:mm:ss'));
    var secDateB = moment(moment.utc(obj2[dateEntry.path]).format('YYYY-MM-DDTHH:mm:ss'));
    var skip = false;

    // compare minutes, if results 0 minute diff (00-59 sec), result 100% percentage
    var secMinutesDiff = secDateA.diff(secDateB, 'minutes');
    if (secMinutesDiff === 0) {
        matchPercent = matchPercent + (dateEntry.percent);
        skip = true;
    }

    // compare date without time, the result will be half from the procent given
    var secDaysDiff = secDateA.diff(secDateB, 'days');
    // if diff = 0 both are in the same date but with different time => half from procent
    if (!skip && secDaysDiff === 0) {
        matchPercent = matchPercent + (dateEntry.percent * 0.5);
    }

    return matchPercent;
};

function lowerTrim(inputString) {
    return inputString.trim().toLowerCase();
}

exports.stringMatch = function (strA, strB) {
    if (strA && strB) {
        // if text are the same return true
        if (lowerTrim(strA) === lowerTrim(strB)) {
            return true;
        }

        // get percentage of match. if results more than 55%, return true
        for (var result = 0, i = strA.length; i--;) {
            if (typeof strB[i] == 'undefined' || strA[i] == strB[i]) {
                // ok
            } else if (lowerTrim(strA[i]) == lowerTrim(strB[i])) {
                result++;
            } else {
                result += 4;
            }
        }

        var percentage = parseFloat((1 - (result + 4 * Math.abs(strA.length - strB.length)) / (2 * (strA.length + strB.length))) * 100).toFixed(0);
        if (percentage >= 55) {
            return true;
        }
    }
};

exports.booleanMatch = function (a_boolean_entry, b_boolean_entry) {
    if (_.isUndefined(a_boolean_entry) === false) {
        if (_.isUndefined(b_boolean_entry) === false) {
            if (a_boolean_entry === b_boolean_entry) {
                return true;
            } else {
                return false;
            }
        }
    }
};

exports.codedMatch = function (a_coded_entry, b_coded_entry) {
    if (_.isUndefined(a_coded_entry) || _.isUndefined(b_coded_entry)) {
        return false;
    }

    if (a_coded_entry.coding && b_coded_entry.coding) {
        for (var a in a_coded_entry.coding) {
            for (var b in b_coded_entry.coding) {
                if (a_coded_entry.coding[a].code && a_coded_entry.coding[a].system && b_coded_entry.coding[b].code && b_coded_entry.coding[b].system) {
                    if ((lowerTrim(a_coded_entry.coding[a].code) === lowerTrim(b_coded_entry.coding[b].code)) && (lowerTrim(a_coded_entry.coding[a].system) === lowerTrim(b_coded_entry.coding[b].system))) {
                        return true;
                    }
                }

                if (a_coded_entry.coding[a].display && b_coded_entry.coding[b].display) {
                    if (lowerTrim(a_coded_entry.coding[a].display) === lowerTrim(b_coded_entry.coding[b].display)) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
};

exports.objectMatch = function (a_object, b_object) {
    if (_.isUndefined(a_object) || _.isUndefined(b_object)) {
        return false;
    }

    return equal(a_object, b_object);
};