"use strict";

var fs = require('fs');
var equal = require('deep-equal');
var _ = require('underscore');
var utils = require('./utils.js');
var moment = require('moment');
var path = require('path');
var dirSections = fs.readdirSync(path.resolve(__dirname, './sections'), 'utf8');
var sections = {};

dirSections.forEach(function(file) {
    sections[file.split('.')[0]] = JSON.parse(fs.readFileSync(path.resolve(__dirname, './sections/' + file), 'utf8'));
});

//Full comparison of two JSON elements for equality and partial match.
exports.compare = function compare(a, b, section) {
    var result = {
        errors: [],
        result: []
    };

    var subject_id = '', master_id = '';

    if (a && a.id) {
        if (a.id.indexOf('/') === -1) {
            subject_id = a.resourceType + '/' + a.id;
        } else {
            subject_id = a.id;
        }
    }

    if (b && b.id) {
        if (b.id.indexOf('/') === -1) {
            master_id = b.resourceType + '/' + b.id;
        } else {
            master_id = b.id;
        }
    }

    if (sections && sections[section]) {
        var logic = sections[section];
    } else {
        result.result = {
            match: "new",
            percent: 0,
            "subject_id": subject_id
        };
        return result;
    }

    if (equal(a, b)) {
        result.result = {
            match: "duplicate",
            percent: "100"
        };

        return result;
    } else {
        var pct = 0;
        var newPct = 0;
        var subarray = [];
        var matchedPaths = [];

        var calculateMatch = function (primaryEntries, secondaryEntries, object_a, object_b, isSubMatch) {
            var primaryTotal = primaryEntries.length;
            var primaryCount = 0;
            var matchPercent = 0;

            //Extract primary matching logic from schema.
            var primaryCodedEntries = _.where(primaryEntries, {
                type: 'codedEntry'
            });
            var primaryDateEntries = _.where(primaryEntries, {
                type: 'dateTime'
            });
            var primaryStringEntries = _.where(primaryEntries, {
                type: 'string'
            });
            var primaryStringArrayEntries = _.where(primaryEntries, {
                type: 'stringArray'
            });
            var primaryObjectEntries = _.where(primaryEntries, {
                type: 'object'
            });
            var primaryObjectArrayEntries = _.where(primaryEntries, {
                type: 'objectArray'
            });
            var primaryResourceReferenceEntries = _.where(primaryEntries, {
                type: 'resourceReference'
            });
            var secondaryCodedEntries = _.where(secondaryEntries, {
                type: 'codedEntry'
            });
            var secondaryDateEntries = _.where(secondaryEntries, {
                type: 'dateTime'
            });
            var secondaryStringEntries = _.where(secondaryEntries, {
                type: 'string'
            });
            var secondaryBooleanEntries = _.where(secondaryEntries, {
                type: 'boolean'
            });
            var secondaryResourceReferenceEntries = _.where(secondaryEntries, {
                type: 'resourceReference'
            });
            var secondaryObjectEntries = _.where(secondaryEntries, {
                type: 'object'
            });

            for (var ipce in primaryCodedEntries) {
                //If path is missing, just take the main object.
                if (primaryCodedEntries[ipce].path === undefined) {
                    if (utils.codedMatch(object_a, object_b)) {
                        matchPercent = matchPercent + primaryCodedEntries[ipce].percent;
                    }
                } else {
                    var inputObjectAPCE = object_a;
                    var inputObjectBPCE = object_b;

                    //Handle dot notation.
                    if (primaryCodedEntries[ipce].path.indexOf(".") > -1) {
                        var strSplitPCE = primaryCodedEntries[ipce].path.split(".");
                        for (var splitEntryPCE in strSplitPCE) {
                            if (_.isUndefined(inputObjectAPCE[strSplitPCE[splitEntryPCE]])) {
                                inputObjectAPCE = {};
                            } else {
                                inputObjectAPCE = inputObjectAPCE[strSplitPCE[splitEntryPCE]];
                            }

                            if (_.isUndefined(inputObjectBPCE[strSplitPCE[splitEntryPCE]])) {
                                inputObjectBPCE = {};
                            } else {
                                inputObjectBPCE = inputObjectBPCE[strSplitPCE[splitEntryPCE]];
                            }
                        }
                    } else {
                        inputObjectAPCE = object_a[primaryCodedEntries[ipce].path];
                        inputObjectBPCE = object_b[primaryCodedEntries[ipce].path];
                    }

                    if (utils.codedMatch(inputObjectAPCE, inputObjectBPCE)) {
                        matchPercent = matchPercent + primaryCodedEntries[ipce].percent;
                        if (!isSubMatch) {
                            matchedPaths.push(primaryCodedEntries[ipce].path);
                        }
                        primaryCount++;
                    }
                }
            }

            for (var ipde in primaryDateEntries) {
                if (primaryDateEntries[ipde].path.indexOf(".") > -1) {
                    var strDateSplit = primaryDateEntries[ipde].path.split(".");
                    for (var splitDateEntry in strDateSplit) {
                        if (object_a[primaryDateEntries[ipde].path][strDateSplit[splitDateEntry]] !== undefined && object_b[primaryDateEntries[ipde].path][strDateSplit[splitDateEntry]] !== undefined) {
                            if (utils.dateEqualMatch(object_a[primaryDateEntries[ipde].path][strDateSplit[splitDateEntry]], object_b[primaryDateEntries[ipde].path][strDateSplit[splitDateEntry]])) {
                                matchPercent = matchPercent + primaryDateEntries[ipde].percent;
                                primaryCount++;
                            } else if (utils.dateTimeMatch(object_a[primaryDateEntries[ipde].path][strDateSplit[splitDateEntry]], object_b[primaryDateEntries[ipde].path][strDateSplit[splitDateEntry]], primaryDateEntries[ipde])) {
                                matchPercent = matchPercent + utils.dateTimeMatch(object_a[primaryDateEntries[ipde].path][strDateSplit[splitDateEntry]], object_b[primaryDateEntries[ipde].path][strDateSplit[splitDateEntry]]);
                                primaryCount++;
                            }
                        }
                    }
                } else if (utils.dateEqualMatch(object_a[primaryDateEntries[ipde].path], object_b[primaryDateEntries[ipde].path])) {
                    matchPercent = matchPercent + primaryDateEntries[ipde].percent;
                    primaryCount++;
                } else if (utils.dateTimeMatch(object_a, object_b, primaryDateEntries[ipde])) {
                    matchPercent = matchPercent + utils.dateTimeMatch(object_a[primaryDateEntries[ipde]], object_b[primaryDateEntries[ipde]]);
                    primaryCount++;
                }
            }

            for (var i in primaryStringEntries) {
                var inputObjectAPSE = object_a;
                var inputObjectBPSE = object_b;

                if (primaryStringEntries[i].path.indexOf(".") > -1) {
                    var strSplit = primaryStringEntries[i].path.split(".");
                    for (var splitEntry in strSplit) {
                        if (inputObjectAPSE[strSplit[splitEntry]] !== undefined && inputObjectBPSE[strSplit[splitEntry]] !== undefined) {
                            inputObjectAPSE = inputObjectAPSE[strSplit[splitEntry]];
                            inputObjectBPSE = inputObjectBPSE[strSplit[splitEntry]];
                        } else {
                            inputObjectAPSE = '';
                            inputObjectBPSE = '';
                        }
                    }
                } else {
                    inputObjectAPSE = object_a[primaryStringEntries[i].path];
                    inputObjectBPSE = object_b[primaryStringEntries[i].path];
                }

                if (utils.stringMatch(inputObjectAPSE, inputObjectBPSE)) {
                    matchPercent = matchPercent + primaryStringEntries[i].percent;
                    if (!isSubMatch) {
                        matchedPaths.push(primaryStringEntries[i].path);
                    }
                    primaryCount++;
                }
            }

            for (var ipsae in primaryStringArrayEntries) {

                var matchedArrays = false;

                var inputObjectA = object_a[primaryStringArrayEntries[ipsae].path];
                var inputObjectB = object_b[primaryStringArrayEntries[ipsae].path];

                for (var ia in inputObjectA) {
                    for (var ib in inputObjectB) {

                        if (utils.stringMatch(inputObjectA[ia], inputObjectB[ib])) {
                            matchedArrays = true;
                        }
                    }
                }

                if (matchedArrays) {
                    matchPercent = matchPercent + primaryStringArrayEntries[ipsae].percent;
                    if (!isSubMatch) {
                        matchedPaths.push(primaryStringArrayEntries[ipsae].path);
                    }
                    primaryCount++;
                }
            }

            for (var ipoe in primaryObjectEntries) {
                var inputObjectAPOE = object_a;
                var inputObjectBPOE = object_b;

                //Handle dot notation.
                if (primaryObjectEntries[ipoe].path.indexOf(".") > -1) {
                    var strSplitPOE = primaryObjectEntries[ipoe].path.split(".");
                    for (var splitEntryPOE in strSplitPOE) {
                        if (_.isUndefined(inputObjectAPOE[strSplitPOE[splitEntryPOE]])) {
                            inputObjectAPOE = {};
                        } else {
                            inputObjectAPOE = inputObjectAPOE[strSplitPOE[splitEntryPOE]];
                        }

                        if (_.isUndefined(inputObjectBPOE[strSplitPOE[splitEntryPOE]])) {
                            inputObjectBPOE = {};
                        } else {
                            inputObjectBPOE = inputObjectBPOE[strSplitPOE[splitEntryPOE]];
                        }
                    }
                } else {
                    inputObjectAPOE = object_a[primaryObjectEntries[ipoe].path];
                    inputObjectBPOE = object_b[primaryObjectEntries[ipoe].path];
                }

                if (utils.objectMatch(inputObjectAPOE, inputObjectBPOE)) {
                    matchPercent = matchPercent + primaryObjectEntries[ipoe].percent;
                    primaryCount++;
                }
            }

            for (var index in primaryObjectArrayEntries) {
                var inputObjectArrayAPOE = object_a[primaryObjectArrayEntries[index].path];
                var inputObjectArrayBPOE = object_b[primaryObjectArrayEntries[index].path];

                for (var ioa in inputObjectArrayAPOE) {
                    for (var iob in inputObjectArrayBPOE) {
                        if (utils.objectMatch(inputObjectArrayAPOE[ioa], inputObjectArrayBPOE[iob])) {
                            matchPercent = matchPercent + primaryObjectArrayEntries[index].percent;
                            if (!isSubMatch) {
                                matchedPaths.push(primaryObjectArrayEntries[index].path);
                            }
                            primaryCount++;
                        }
                    }
                }
            }

            for (var irre in primaryResourceReferenceEntries) {
                var inputRROA = object_a[primaryResourceReferenceEntries[irre].path];
                var inputRROB = object_b[primaryResourceReferenceEntries[irre].path];

                if (equal(inputRROA, inputRROB)) {
                    // both display and reference matches
                    matchPercent = matchPercent + primaryResourceReferenceEntries[irre].percent;
                    primaryCount++;
                } else if (inputRROA.reference && inputRROA.reference.trim().toLowerCase() === inputRROB.reference && inputRROB.reference.trim().toLowerCase()) {
                    // if they have the same reference, equals 100% match
                    matchPercent = matchPercent + primaryResourceReferenceEntries[irre].percent;
                    if (!isSubMatch) {
                        matchedPaths.push(primaryResourceReferenceEntries[irre].path);
                    }
                } else if (inputRROA.display && inputRROA.display.trim().toLowerCase() === inputRROB.display && inputRROB.display.trim().toLowerCase()) {
                    // in case both have the same display, but different reference, the result will be half of the percent
                    matchPercent = matchPercent + (primaryResourceReferenceEntries[irre].percent * 0.5);
                    if (!isSubMatch) {
                        matchedPaths.push(primaryResourceReferenceEntries[irre].path);
                    }
                }
            }

            //If primary entries match, run the secondary match.

            if (matchPercent > 0) {
                for (var isce in secondaryCodedEntries) {
                    if (secondaryCodedEntries[isce].path === undefined) {
                        if (utils.codedMatch(object_a, object_b)) {
                            matchPercent = matchPercent + secondaryCodedEntries[isce].percent;
                            if (!isSubMatch) {
                                matchedPaths.push(secondaryCodedEntries[isce].path);
                            }
                        }
                    } else {
                        if (utils.codedMatch(object_a[secondaryCodedEntries[isce].path], object_b[secondaryCodedEntries[isce].path])) {
                            matchPercent = matchPercent + secondaryCodedEntries[isce].percent;
                            if (!isSubMatch) {
                                matchedPaths.push(secondaryCodedEntries[isce].path);
                            }
                        }
                    }
                }

                for (var isde in secondaryDateEntries) {
                     if (secondaryDateEntries[isde].path.indexOf(".") > -1) {
                        var strSecondaryDateSplit = secondaryDateEntries[isde].path.split(".");
                        for (var splitSecondaryDateEntry in strSecondaryDateSplit) {
                            if (object_a[strSecondaryDateSplit[splitSecondaryDateEntry]] !== undefined && object_b[strSecondaryDateSplit[splitSecondaryDateEntry]] !== undefined) {
                                if (utils.dateEqualMatch(object_a[strSecondaryDateSplit[splitSecondaryDateEntry]], object_b[strSecondaryDateSplit[splitSecondaryDateEntry]])) {
                                    matchPercent = matchPercent + secondaryDateEntries[isde].percent;
                                } else if (utils.dateTimeMatch(object_a[strSecondaryDateSplit[splitSecondaryDateEntry]], object_b[strSecondaryDateSplit[splitSecondaryDateEntry]], { path: strSecondaryDateSplit[splitSecondaryDateEntry] })) {
                                    matchPercent = matchPercent + utils.dateTimeMatch(object_a[strSecondaryDateSplit[splitSecondaryDateEntry]], object_b[strSecondaryDateSplit[splitSecondaryDateEntry]], { path: strSecondaryDateSplit[splitSecondaryDateEntry] });
                                }
                            }
                        }
                    } else if (utils.dateEqualMatch(object_a[secondaryDateEntries[isde].path], object_b[secondaryDateEntries[isde].path])) {
                        matchPercent = matchPercent + secondaryDateEntries[isde].percent;
                        if (!isSubMatch) {
                            matchedPaths.push(secondaryDateEntries[isde].path);
                        }
                    } else if (utils.dateTimeMatch(object_a, object_b, secondaryDateEntries[isde]) > 0) {
                        matchPercent = matchPercent + utils.dateTimeMatch(object_a, object_b, secondaryDateEntries[isde]);
                        if (!isSubMatch) {
                            matchedPaths.push(secondaryDateEntries[isde].path);
                        }
                    }
                }

                for (var isse in secondaryStringEntries) {

                    var inputObjectASSE = object_a;
                    var inputObjectBSSE = object_b;

                    //Handle dot notation.
                    if (secondaryStringEntries[isse].path.indexOf(".") > -1) {
                        var strSplitSSE = secondaryStringEntries[isse].path.split(".");
                        for (var splitEntrySSE in strSplitSSE) {

                            if (_.isUndefined(inputObjectASSE[strSplitSSE[splitEntrySSE]])) {
                                inputObjectASSE = "";
                            } else {
                                inputObjectASSE = inputObjectASSE[strSplitSSE[splitEntrySSE]];
                            }

                            if (_.isUndefined(inputObjectBSSE[strSplitSSE[splitEntrySSE]])) {
                                inputObjectBSSE = "";
                            } else {
                                inputObjectBSSE = inputObjectBSSE[strSplitSSE[splitEntrySSE]];
                            }

                        }

                    } else {
                        inputObjectASSE = object_a[secondaryStringEntries[isse].path];
                        inputObjectBSSE = object_b[secondaryStringEntries[isse].path];
                    }

                    if (inputObjectASSE !== "" && inputObjectBSSE !== "") {
                        if (utils.stringMatch(inputObjectASSE, inputObjectBSSE)) {
                            matchPercent = matchPercent + secondaryStringEntries[isse].percent;
                            if (!isSubMatch) {
                                matchedPaths.push(secondaryStringEntries[isse].path);
                            }
                        }
                    }
                }

                for (var isbe in secondaryBooleanEntries) {
                    if (utils.booleanMatch(object_a[secondaryBooleanEntries[isbe].path], object_b[secondaryBooleanEntries[isbe].path])) {
                        matchPercent = matchPercent + secondaryBooleanEntries[isbe].percent;
                        if (!isSubMatch) {
                            matchedPaths.push(secondaryBooleanEntries[isbe].path);
                        }
                    }
                }

                for (var isrre in secondaryResourceReferenceEntries) {
                    var inputSRROA = object_a[secondaryResourceReferenceEntries[isrre].path];
                    var inputSRROB = object_b[secondaryResourceReferenceEntries[isrre].path];

                    if (equal(inputSRROA, inputSRROB)) {
                        // both display and reference matches
                        matchPercent = matchPercent + secondaryResourceReferenceEntries[isrre].percent;
                        if (!isSubMatch) {
                            matchedPaths.push(secondaryResourceReferenceEntries[isrre].path);
                        }
                    } else if (inputSRROA.reference.trim().toLowerCase() === inputSRROB.reference.trim().toLowerCase()) {
                        // if they have the same reference, equals 100% match
                        matchPercent = matchPercent + secondaryResourceReferenceEntries[isrre].percent;
                        if (!isSubMatch) {
                            matchedPaths.push(secondaryResourceReferenceEntries[isrre].path);
                        }
                    } else if (inputSRROA.display.trim().toLowerCase() === inputSRROB.display.trim().toLowerCase()) {
                        // in case both have the same display, but different reference, the result will be half of the percent
                        matchPercent = matchPercent + (secondaryResourceReferenceEntries[isrre].percent * 0.5);
                        if (!isSubMatch) {
                            matchedPaths.push(secondaryResourceReferenceEntries[isrre].path);
                        }
                    }
                }

                for (var isoe in secondaryObjectEntries) {
                    var inputObjectASOE = object_a;
                    var inputObjectBSOE = object_b;

                    //Handle dot notation.
                    if (secondaryObjectEntries[isoe].path.indexOf(".") > -1) {
                        var strSplitSOE = secondaryObjectEntries[isoe].path.split(".");
                        for (var splitEntrySOE in strSplitSOE) {
                            if (_.isUndefined(inputObjectASOE[strSplitSOE[splitEntrySOE]])) {
                                inputObjectASOE = {};
                            } else {
                                inputObjectASOE = inputObjectASOE[strSplitSOE[splitEntrySOE]];
                            }

                            if (_.isUndefined(inputObjectBSOE[strSplitSOE[splitEntrySOE]])) {
                                inputObjectBSOE = {};
                            } else {
                                inputObjectBSOE = inputObjectBSOE[strSplitSOE[splitEntrySOE]];
                            }
                        }
                    } else {
                        inputObjectASOE = object_a[secondaryObjectEntries[isoe].path];
                        inputObjectBSOE = object_b[secondaryObjectEntries[isoe].path];
                    }

                    if (utils.objectMatch(inputObjectASOE, inputObjectBSOE)) {
                        matchPercent = matchPercent + secondaryObjectEntries[isoe].percent;
                    }
                }
            }

            matchPercent = Math.round(matchPercent * 100) / 100;

            return matchPercent;
        };

        var calculateSubMatch = function (primaryEntries, secondaryEntries, object_a, object_b) {
            var isSubMatch = true;

            if (equal(object_a, object_b)) {
                var primarySubArrayPercent = [0];
                var secondarySubArrayPercent = [0];

                if (_.isArray(primaryEntries)) {
                    primarySubArrayPercent = _.pluck(primaryEntries, 'percent') || [0];
                } else {
                    primarySubArrayPercent = [primaryEntries.percent] || [0];
                }

                if (secondaryEntries) {
                    if (_.isArray(secondaryEntries)) {
                        secondarySubArrayPercent = _.pluck(secondaryEntries, 'percent') || [0];
                    } else {
                        secondarySubArrayPercent = secondaryEntries.percent && [secondaryEntries.percent] || [0];
                    }
                }

                var allValues = primarySubArrayPercent.concat(secondarySubArrayPercent);
                var totalPercent = _.reduce(allValues, function(memo, num){ return memo + num; }, 0);
                return {
                    "match": "duplicate",
                    "percent": totalPercent
                };
            } else {
                var subMatchPercent = calculateMatch(primaryEntries, secondaryEntries, object_a, object_b, isSubMatch);

                if (subMatchPercent === 0) {
                    return {
                        "match": "new",
                        "percent": 0
                    };
                } else {
                    return {
                        "match": "partial",
                        "percent": subMatchPercent
                    };
                }
            }
        };

        //Process first object.
        newPct = newPct + calculateMatch(logic.primary, logic.secondary, a, b);

        //if newPct = 0, return 'new', otherwise, run subarrays.
        var aMatches;
        var subPct = 0;

        if (newPct === 0) {
            result.result = {
                "match": "new",
                "percent": newPct,
                "subject_id": subject_id
            };

            return result;
        } else {
            aMatches = {};

            //Loop sub arrays.
            for (var i in logic.subArrays) {
                for (var ii in logic.subArrays[i]) {
                    var atemp = a;
                    var btemp = b;

                    //if string split it.
                    if (ii.indexOf(".") > -1) {
                        var subPathSplit = ii.split(".");
                        for (var iteration in subPathSplit) {
                            atemp = atemp[subPathSplit[iteration]];
                            btemp = btemp[subPathSplit[iteration]];
                        }
                    } else {
                        if (_.isUndefined(a[ii])) {
                            atemp = [];
                        } else {
                            atemp = atemp[ii];
                        }

                        if (_.isUndefined(b[ii])) {
                            btemp = [];
                        } else {
                            btemp = btemp[ii];
                        }
                    }

                    for (var aObj in atemp) {
                        for (var bObj in btemp) {
                            var subObjectResults = calculateSubMatch(logic.subArrays[i][ii].primary, logic.subArrays[i][ii].secondary, atemp[aObj], btemp[bObj]);

                            if (aMatches[ii] === undefined) {
                                aMatches[ii] = [];
                            }

                            subPct = subPct + subObjectResults.percent;

                            //Graph against all dest target objects.
                            aMatches[ii].push({
                                "match": subObjectResults.match,
                                "percent": subObjectResults.percent,
                                "src_id": aObj,
                                "dest_id": bObj
                            });
                        }
                    }
                }
            }
        }

        var diff = utils.diff(a, b);
        var totalPoints = newPct + subPct;

        if (matchedPaths.length > 0) {
            _.each(matchedPaths, function(key) {
                if (diff[key] && diff[key] !== "duplicate") {
                    diff[key] = "partial";
                }
            });
        }

        if (!_.isEmpty(aMatches)) {
            _.each(_.keys(aMatches), function(key) {
                if (diff && diff[key]) {
                    var match = _.pluck(aMatches[key], "match");

                    if (match && match.length > 1) {
                        diff[key] = "partial";
                    } else {
                        diff[key] = match[0];
                    }
                }
            });
        }

        result.result = {
            match: totalPoints >= 100 ? "duplicate" : "partial",
            percent: totalPoints,
            subject_id: subject_id,
            master_id: master_id,
            diff: diff
        };

        // disabled! this will show subarrays match, it is not necessary to be displayed
        if (!_.isEmpty(aMatches) && false) {
            result.result.subelements = aMatches;
        }

        return result;
    }
};