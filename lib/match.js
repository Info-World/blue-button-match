"use strict";
var matchSections = require("./match-sections.js").matchSections;
var _ = require("underscore");

//Takes the standardized data elements and flags match dispositions.
var match = function match(new_record, master, log) {
    log.info("Start compare");

    var result = {
        errors: [],
        match: {},
        result: []
    };

    var resourcesList = _.chain(new_record.entry).pluck('resource').pluck('resourceType').uniq().value();

    _.each(resourcesList, function (section) {
        var name = section.toLowerCase();
        var master_section = [];
        var new_section = [];

        _.each(master.entry, function(doc) {
            if (doc.resource.resourceType.toLowerCase() === name) {
                master_section.push(doc.resource);
            }
        });

        _.each(new_record.entry, function(doc) {
            if (doc.resource.resourceType.toLowerCase() === name) {
                new_section.push(doc.resource);
            }
        });

        log.info("Comparing " + new_section.length + " new " + name + (new_section.length > 1 ? " files" : " file") + " with " + master_section.length + " master " + name + (master_section.length > 1 ? " files" : " file"));

        if (master_section && master_section.length === 0) {
            if (new_section.length > 0) {
                result.match[name] = [];
                var finalResult = [];
                for (var index = 0; index < new_section.length; index++) {
                    finalResult.push({
                        resourceType: name,
                        src_id: index,
                        match: 'new',
                        subject_id: new_section[index].id || ""
                    });
                }
                result.result = _.union(finalResult, result.result);
                result.errors.push({error: "No files", message: 'There are no master ' + section + ' files to compare with ' + new_section.length + ' new ' + (new_section.length === 1 ? 'file' : 'files')});
            }
        } else if (new_section && new_section.length === 0) {
            log.info('No files to compare with ' + section);
        } else {
            var compareResult = matchSections(new_section, master_section, name);
            result.match[name] = compareResult.result;
            result.result = _.union(compareResult.finalResult, result.result);
            _.union(result.errors, compareResult.errors);
        }
    });

    log.info('Finish compare');

    return result;
};

module.exports.match = match;
