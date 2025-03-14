const SHEET_ID_FUTURE_EVENTS = "1SqqTT8nqEJ_4O2LBLoXcHBKxc7-NCJEZBbsVyObsuq8";
const SHEET_ID_ALL_EVENTS = "1MQQwYAcLdsTDw328-p8QOAMMXxLxIaHYKshDGxEEX8w";

import { formatEventResponse } from "./utils.js";

/* 
    Receive a gsheet array as input in the form of
    [
        ['header a', 'header b', 'header c'],
        ['value 1 a', 'value 1 b', 'value 1 c'],
        ['value 2 a', 'value 2 b', 'value 2 c'],
    ]
    
    Output the corresponding json object associated
    [
        {
            'header a': 'value 1 a',
            'header b': 'value 1 b',
            'header c': 'value 1 c'
        },
        {
            'header a': 'value 2 a',
            'header b': 'value 2 b',
            'header c': 'value 2 c'
        }
    ]
*/
function table_to_objects(gsheet_array) {
  // array containing the jsons
  let final_object = [];

  // iterate over the gsheet array receives from 1 to end
  for (let row_values = 1; row_values < gsheet_array.length; row_values++) {
    // each row in the gheet array will represent an object
    const row = gsheet_array[row_values];
    // store the index of the headers
    let index_keys = 0;
    // create a temporary object holding to hold the values of each row
    let temp_object = {};

    // loop over each row
    for (let index_value = 0; index_value < row.length; index_value++) {
      // get each value and assign it as a value to the respective key
      const value = row[index_value];
      temp_object[gsheet_array[index_keys][index_value]] = gsheet_array[row_values][index_value];
    }

    // append the current temporary object to the final array of objects
    final_object.push(temp_object);
  }

  // return the final array of json
  return final_object;
}

async function getRawSheetData({ includePastEvents = false } = {}) {
  var id = includePastEvents ? SHEET_ID_ALL_EVENTS : SHEET_ID_FUTURE_EVENTS;
  var gid = includePastEvents ? "2075906374" : "0";
  var txt = await (
    await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&tq?gid=${gid}`)
  ).text();

  var jsonString = txt.match(/(?<="table":).*(?=}\);)/g)[0];
  var json = JSON.parse(jsonString);
  var table = [];
  var row = [];
  json.cols.forEach((colonne) => row.push(colonne.label));
  table.push(row);
  json.rows.forEach((r) => {
    var row = [];
    r.c.forEach((cel) => {
      try {
        var value = cel.f ? cel.f : cel.v;
      } catch (e) {
        var value = "";
      }
      row.push(typeof value == "string" ? value.trim() : value);
    });
    const allValuesAreEmpty = row.reduce((acc, curr) => acc && !curr, true);
    if (allValuesAreEmpty) return;

    table.push(row);
  });
  return table_to_objects(table);
}

export { getSheetData };

async function getSheetData({ includePastEvents = false } = {}) {
  const result = [];
  for (const er of await getRawSheetData({ includePastEvents })) {
    try {
      result.push(formatEventResponse(er));
    } catch (error) {
      // Probably missing required data, skip this event.
      console.error(error, er);
      continue;
    }
  }
  return result;
}
