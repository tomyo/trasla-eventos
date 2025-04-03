const SHEET_ID_FUTURE_EVENTS = "1SqqTT8nqEJ_4O2LBLoXcHBKxc7-NCJEZBbsVyObsuq8";
const SHEET_GID_FUTURE_EVENTS = "1955982099";

/**
 * Get formatted events from a Google Sheet using its ID and GID.
 *
 * @param {string} id - The ID of the Google Sheet.
 * @param {number} gid - The grid ID of the specific sheet within the Google Sheet.
 * @returns {Promise<Object[]>} A promise that resolves to an array of eventData objects.
 */
async function getGoogleSheetEvents(id = SHEET_ID_FUTURE_EVENTS, gid = SHEET_GID_FUTURE_EVENTS) {
  const result = [];
  for (const eventRawData of await getSheetData(id, gid)) {
    try {
      // result.push(formatEventResponse(eventRawData));
      result.push(enrichSheetEventData(eventRawData));
    } catch (error) {
      // Probably missing required data, skip this event.
      console.error(error, eventRawData);
      continue;
    }
  }
  return result;
}

/**
 * Adds extra properties to the event data fetched from the Google Sheet.
 *
 * @param {Object} data - An raw event data object.
 * @returns {Object} The processed eventData object with additional properties.
 */
function enrichSheetEventData(data) {
  data.previewImage = getGoogleDriveImagesPreview(data.images);
  return data;
}

/**
 * Fetches raw data from a Google Sheet and converts it into a JSON object.
 *
 * @param {string} id - The ID of the Google Sheet.
 * @param {number} gid - The grid ID of the specific sheet within the Google Sheet.
 * @returns {Promise<Object[]>} A promise that resolves to an array of objects representing the rows in the sheet, where each key is the corresponding column's header name
 */
async function getSheetData(id, gid = 0) {
  const queryTextResponse = await (
    await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&gid=${gid}`)
  ).text();

  ///Need to extract the JSON part between "google.visualization.Query.setResponse({"version":"0.6","reqId":"0","status":"ok","sig":"1053501725","table":{cols: [...], rows: [...]}});"
  const jsonString = queryTextResponse.match(/(?<="table":).*(?=}\);)/g)[0];
  const json = JSON.parse(jsonString);
  const table = [];
  const row = [];
  json.cols.forEach((column) => row.push(column.label));
  table.push(row);
  json.rows.forEach((r) => {
    const row = [];
    r.c.forEach((cel) => {
      let value = "";
      if (cel && (cel.f || cel.v)) {
        // cel.v is the actual value, cel.f is the formatted value.
        // i.e. { v: "Date(2025,2,30,21,1,11)", f: "30/3/2025 21:01:12" }
        if (cel.f && cel.v && typeof cel.v == "string" && cel.v.startsWith("Date(")) {
          value = parseEventResponseDateString(cel.f).toISOString();
        } else if (cel.v) {
          value = cel.v || cel.f;
        }
      }
      row.push(typeof value == "string" ? value.trim() : value);
    });
    const allValuesAreEmpty = row.reduce((acc, curr) => acc && !curr, true);
    if (allValuesAreEmpty) return;

    table.push(row);
  });
  return table_to_objects(table);
}

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

/**
 * 
 * @param {String} imageId 
 * @param {Number} width in pixels
 * @returns {String} Image url from a google drive to use in <img>
 
 */
function createGoogleDriveImageUrl(imageId, width = 512) {
  return `https://lh3.googleusercontent.com/d/${imageId}=w${width}`;
}

/**
 *
 * @param {String} urls, a string containing google drive links separated by commas
 * @returns {String} id of the last google drive link provided
 */
function getLastFileIdFromDriveUrls(urls) {
  const imageIdRegexp = /id=([\d\w-]*)/gm;
  const ids = Array.from(urls.matchAll(imageIdRegexp), (m) => m[1]);
  return ids.pop(); // Get the last match
}

/**
 *
 * @param {String} imageUrls A comma separated list of google drive urls
 * @returns {String} preview image url for the last file on the list
 * @returns
 */
function getGoogleDriveImagesPreview(imageUrls) {
  return createGoogleDriveImageUrl(getLastFileIdFromDriveUrls(imageUrls));
}

/**
 *
 * @param {String} dateString as formated by gsheet es-AR locale
 * @param {Number} timezone, offset in hours from UTC
 *
 * @returns {Date|null} UTC Date object
 *
 * Format expected: "dd/mm/yyyy hh:mm:ss"
 */
function parseEventResponseDateString(dateString, timezone = -3) {
  try {
    const [date, time] = dateString.split(" ");
    const [day, month, year] = date.split("/");
    const [hour, minute] = time.split(":");

    // Create a local timezone Date object, interpreting the response as UTC
    const localDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

    // Substract the utc offset, we do it this way to avoid hours overflow
    return new Date(localDate.setUTCHours(localDate.getUTCHours() - timezone));
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
}

export { getGoogleSheetEvents };
