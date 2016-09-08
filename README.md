
Automatic compare of fhir JSON data (detection of new, duplicate and partial match entries)

## Library interfaces/APIs

This library exposes methods for comparing entire health records as well as lower level methods for compareing sections of health records.

This library provides the following functionality

- Match two health records in JSON format
- Match individual sections of above

### Usage example

```
var match = require("./index.js");

var newResources = require("./newResources.json"); // new documents
var oldResources = require("./oldResources.json"); // to compare with

var result = match.match(newResources, oldResources);

console.log(JSON.stringify(result, null, 4));

````

This will produce a match object looking like this: (or see compare-result.json for full example)

```
{
	"errors" : [],
	"match" : {
		"documentreference" : [{
				"match" : "partial",
				"percent" : 90,
				"subject_id" : "DocumentReference/bf040600-40ef-4a39-a075-4ae17fb2e15f",
				"master_id" : "DocumentReference/5d93f304-6554-4867-b81c-b5b0e69acdef",
				"diff" : {
					"resourceType" : "duplicate",
					"masterIdentifier" : "new",
					"subject" : "duplicate",
					"type" : "duplicate",
					"author" : "duplicate",
					"custodian" : "duplicate",
					"authenticator" : "duplicate",
					"created" : "partial",
					"indexed" : "new",
					"status" : "duplicate",
					"docStatus" : "duplicate",
					"description" : "duplicate",
					"mimeType" : "duplicate",
					"location" : "new",
					"id" : "new"
				},
				"src_id" : "0",
				"dest_id" : "0"
			}, {
				"match" : "partial",
				"percent" : 70,
				"subject_id" : "DocumentReference/bf040600-40ef-4a39-a075-4ae17fb2e15f",
				"master_id" : "DocumentReference/d0cca24e-7226-4566-a588-2872660d1a44",
				"diff" : {
					"resourceType" : "duplicate",
					"masterIdentifier" : "new",
					"subject" : "duplicate",
					"type" : "duplicate",
					"author" : "duplicate",
					"custodian" : "new",
					"authenticator" : "duplicate",
					"created" : "new",
					"indexed" : "new",
					"status" : "duplicate",
					"docStatus" : "duplicate",
					"description" : "new",
					"mimeType" : "duplicate",
					"location" : "new",
					"id" : "new"
				},
				"src_id" : "0",
				"dest_id" : "1"
			},...
		]
	}
}
```

#### Matching record explanation

Match element can be `{"match" : "duplicate", "percent": 100}`, `{"match" : "new", "percent: 0"}` or `{"match" : "partial", "percent": 75}`.

Partial match is expressed in percent and can range from `1` to `99`.  Percent is included in the duplicate and new objects as well for range based calculations, but will always equal `100` or `0` respectively.

Element attribute `src_id` refers to the element position (index) in the related array of the new document being merged (new record). Element attribute `dest_id` refers to the element position (index) in the related section's array of the Master Health Record.

```
{
    "match": {
        "allergyintolerance": [
            {
                "match": "new",
                "percent": 0,
                "src_id": "0",
                "dest_id": "0"
            },
            {
                "match": "partial",
                "percent": 65,
                "diff": {
                    "resourceType": "duplicate",
                    "type": "duplicate",
                    "recordedDate": "partial",
                    "status": "new",
                    "patient": "duplicate",
                    "substance": "duplicate",
                    "reaction": "new"
                },
                "src_id": "1",
                "dest_id": "0"
            }
        ]
    }
}
```

## Matching Rules

#### Common matching rules

_dateTime match_ - Hard match on dates, After initial date mismatch, fuzzy date match performed.  Will check for overlap of dates if they don't hard match and will result half the percentage.

_codeEntry match (Code System match)_ - Either code and system must match or names.

_string match_ - Case insensitive/trimmed match of string values.

_stringArray match_ - Case insensitive/trimmed match of arrays for equality.

_boolean match_ - Simple true/false equality comparison.

_object match_ - Deep equal match of objects performed.

_objectArray match_ - Deep equal match of objects performed in arrays.

_resourceReference match_ - Case insensitive/trimmed match of reference and display values.

Each sections logic is contained in a .json file corresponding to the section name.  It is divided into primary and secondary logic.  Secondary logic only executes only if primary logic resulted in a successful match, and can bolster match percentages.   Each section contains an array of match data.

Each element of match data has 3 components, a path, the location of the element, the type, or what common utility should handle it, and the percentage, which is a resulting increase if a match is made successfully.

Additionally, elements may have 'subarrays', which is used to populate sub-arrays from the match and provides corresponding diffs.  Their structure is the same as match entries.

Note:  Currently, the logic is designed so a match over 50% is considered actionable.

###AllergyIntolerance

Primary: Substance - codedEntry match.

Secondary: RecordedDate - dateTime match.

###Condition

Primary: Code - codedEntry match.

Secondary: DateAsserted - dateTime match.

###Medication

Primary: Code - codedEntry match and Name - string match.

SubArrays: ClinicalQuantity.subunitQuantity - object match.

###MedicationAdministration

Primary: Medication - resourceReference match.

Secondary: WhenGiven - object match.

SubArrays: Dosage.quantity - onject match.

###MedicationPrescription

Primary: Medication - resourceReference match.

Secondary: DateWritten - dateTime match and Status - string match.

###Observation

Primary: Name - codedEntry match.

Secondary: Issued - dateTime match and valueQuantity - object match.

SubArrays: Extension.valueCoding - codedEntry match.

## Release Notes

See release notes [here] (./RELEASENOTES.md)

## License

Licensed under [Apache 2.0](./LICENSE)