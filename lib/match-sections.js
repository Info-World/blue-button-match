"use strict";

var _ = require("underscore");
var equal = require('deep-equal');
var compare = require('./router.js').compare;

var createSet = function () {
    var set = Object.create(null);

    return {
        elements: function () {
            return set;
        },
        add: function (el) {
            set[el] = true;
        },
        delete: function (el) {
            delete set[el];
        }
    };
};

function range(len) {
    var rangeSet = createSet();
    for (var i = 0; i < len; i++) {
        rangeSet.add(i);
    }

    return rangeSet;
}

exports.matchSections = function matchSections(new_record, master, compare_field) {
    var result = {
        errors: [],
        result: []
    };
    var new_entries = range(new_record.length);
    var master_entries = range(master.length);

    for (var i in new_entries.elements()) {
        for (var j in master_entries.elements()) {
            var comp = compare(new_record[i], master[j], compare_field);
                comp.result.src_id = i;
                comp.result.dest_id = j;
                _.union(result.errors, comp.errors);
                result.result.push(comp.result);
        }
    }

    return result;
};