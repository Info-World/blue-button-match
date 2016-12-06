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
        result: [],
        finalResult: []
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

    // get final result for each new item
    var scr_ids = _.uniq(_.pluck(result.result, 'src_id'));
    _.each(scr_ids, function (srcIdIndex) {
        var results = _.where(result.result, { src_id: srcIdIndex });
        var isDuplicate = _.findIndex(results, { match: "duplicate" });
        var partials = _.where(results, { match: "partial" });
        var isPartial = _.findIndex(partials, { match: "partial", percent: (_.max(partials, function (part) { return part.percent; })).percent}); // get the highest level
        var isNew = _.findIndex(results, { match: "new" });

        var finalRes = {
            resourceType: compare_field
        };

        if (isDuplicate >= 0) {
            finalRes.src_id = results[isDuplicate].src_id;
            finalRes.dest_id = results[isDuplicate].dest_id;
            finalRes.match = 'duplicate';
            finalRes.master_id = results[isDuplicate].master_id;
            finalRes.subject_id = results[isDuplicate].subject_id;
        } else if (isPartial >= 0) {
            finalRes.src_id = partials[isPartial].src_id;
            finalRes.dest_id = partials[isPartial].dest_id;
            finalRes.match = 'partial';
            finalRes.percent = partials[isPartial].percent;
            finalRes.master_id = partials[isPartial].master_id;
            finalRes.subject_id = partials[isPartial].subject_id;
        } else {
            finalRes.src_id = results[isNew].src_id;
            finalRes.match = 'new';
            finalRes.subject_id = results[isNew].subject_id;
        }

        result.finalResult.push(finalRes);
    });

    return result;
};