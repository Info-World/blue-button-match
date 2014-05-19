/*jshint -W117 */
// relaxed JSHint to allow use of xit and xdescribe to disable some test cases (make them pending)

"use strict";

var expect = require('chai').expect;

var fs = require('fs');
var bbjs = require('blue-button');

var match = require('../lib/match.js');
var compare = require('../lib/compare-partial.js').compare;
var lookups = require('../lib/lookups.js');
var equal = require('deep-equal');
var comparePartial = require("../lib/compare-partial.js").compare;

var matchSections = require("../lib/match-sections.js").matchSections;

var bb;
var bb2, bb3, bb4;

before(function(done) {
    var xml = fs.readFileSync('test/records/ccda/CCD_demo1.xml', 'utf-8');
    bb = bbjs.parseString(xml).data;
    var xml2 = fs.readFileSync('test/records/ccda/CCD_demo2.xml', 'utf-8');
    bb2 = bbjs.parseString(xml2).data;
    var xml3 = fs.readFileSync('test/records/ccda/CCD_demo3.xml', 'utf-8');
    bb3 = bbjs.parseString(xml3).data;

    var xml4 = fs.readFileSync('test/records/ccda/CCD_demo4.xml', 'utf-8');
    bb4 = bbjs.parseString(xml4).data;

    //console.log(bb);
    done();
});


describe('Matching library (match-sections.js) tests', function() {



    describe('Sections level tests', function() {

        it('testing matchSections method with two different BB.js data files', function() {

            for (var section in lookups.sections) {
                var name = lookups.sections[section];
                //console.log(">>> "+name);
                //TODO: need CCD4 to be completely different from CCD1
                name = "allergies";

                if (bb.hasOwnProperty(name) && bb4.hasOwnProperty(name)) {

                    //console.log(">>>>", name);
                    //console.log(comparePartial);
                    //console.log(comparePartial(name));

                    var m = matchSections(bb[name], bb4[name], comparePartial(name));

                    for (var item in m) {
                        //console.log(m[item].match);
                        expect(m[item].match).to.equal("new");
                        expect(m[item]).to.have.property('src_id');
                        expect(m[item]).to.not.have.property('dest_id');
                    }
                }
            }

        });


        it('testing matchSections method with two same BB.js data files', function() {

            for (var section in lookups.sections) {
                var name = lookups.sections[section];

                if (bb3.hasOwnProperty(name) && bb3.hasOwnProperty(name)) {

                    var m = matchSections(bb3[name], bb3[name], comparePartial(name));

                    for (var item in m) {
                        expect(m[item].match).to.equal("duplicate");
                        expect(m[item]).to.have.property('src_id');
                        expect(m[item]).to.have.property('dest_id');
                    }
                }
            }

        });


        describe('allergy sections comparison', function() {
            it('testing matchSections method on two equal allergy sections', function() {
                //console.log(match.matchSections(bb.data["allergies"],bb.data["allergies"]));
                var m = matchSections(bb["allergies"], bb["allergies"], comparePartial("allergies"));

                for (var item in m) {
                    expect(m[item].match).to.equal("duplicate");
                    expect(m[item]).to.have.property('src_id');
                    expect(m[item]).to.have.property('dest_id');
                }
            });
        });

        //TODO: this test relies on details of sample files, had to be rewritten if samples change
        it('allergy section comparison of documents with mix and match', function() {
            //console.log("match bb3 to bb");
            var m = matchSections(bb3["allergies"], bb["allergies"], comparePartial("allergies"));
            //console.log("match bb3 to bb2");
            var m2 = matchSections(bb3["allergies"], bb2["allergies"], comparePartial("allergies"));

            expect(m).to.be.ok;
            expect(m2).to.be.ok;

            //console.log(m);
            //console.log(m2);


            //basic sorting function for later

            function src_sort(a, b) {
                if (a.src_id < b.src_id) {
                    return -1;
                }
                if (a.src_id > b.src_id) {
                    return 1;
                }
                return 0;
            }




            var mr = [{
                match: 'duplicate',
                src_id: '0',
                dest_id: '0'
            }, {
                match: 'duplicate',
                src_id: '1',
                dest_id: '1'
            }, {
                match: 'duplicate',
                src_id: '3',
                dest_id: '2'
            }, {
                match: 'new',
                src_id: '2'
            }, {
                match: 'new',
                src_id: '4'
            }];
            var mr2 = [{
                match: 'duplicate',
                src_id: '0',
                dest_id: '0'
            }, {
                match: 'duplicate',
                src_id: '1',
                dest_id: '1'
            }, {
                match: 'duplicate',
                src_id: '3',
                dest_id: '3'
            }, {
                match: 'new',
                src_id: '2'
            }, {
                match: 'new',
                src_id: '4'
            }];

            //sorting arrays by src_id since order matters...
            expect(m.sort(src_sort)).to.deep.equal(mr.sort(src_sort));
            expect(m2.sort(src_sort)).to.deep.equal(mr2.sort(src_sort));
        });

    });




});