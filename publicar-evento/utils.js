export const API_URL =
  "https://script.google.com/macros/s/AKfycbx-aF03sO-JizuijiMY1tu5v0GXhzH08GUtkUy0tegwzB8LLQ-VwzD7YEQ-vK1YEcK_/exec";

/**
 * Extracts success response from fetch result
 * @param {Response} response - The fetch response
 * @returns {Promise<Object>} - The response data
 */
export async function extractSuccessResponse(response) {
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const jsonResponse = await response.json();
  if (!jsonResponse.success) throw new Error(jsonResponse.message);
  return jsonResponse.data;
}

export class MissingFieldsError extends Error {
  constructor(missingFields) {
    const message = `Evento incompleto... No se reconocen los siguientes campos:\n\n${Object.entries(missingFields)
      .map(([key, msg]) => `❌ ${msg}`)
      .join("\n")}`;
    super(message);
    this.missingFields = missingFields;
  }
}

export function showMissingFieldsError(missingFields, outputElement) {
  outputElement.textContent += "Evento incompleto... No se reconocen los siguientes campos:\n\n";
  for (const key of Object.keys(missingFields)) {
    outputElement.textContent += `❌ ${missingFields[key]}\n`;
  }
  // outputElement.textContent += "\nPor favor agregá los datos faltantes en la descripción e intentá de nuevo.\n";
}

/**
 * Polls the API for event processing status until a slug is returned or max retries reached.
 * @param {string} api - Base API URL
 * @param {string} eventId - The ID of the event to poll for
 * @param {HTMLElement} output - Output element to log progress
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<Object>} - The event data containing the slug
 */
export async function pollForEventProcessing(api, eventId, output, maxRetries = 5) {
  let retries = 0;
  let eventData = { id: eventId };
  let error = null;

  while (!eventData?.slug) {
    const getEventByIdQuery = `?endpoint=getEventByIdAndProcessItIfNeeded&id=${eventId}`;

    try {
      eventData = await extractSuccessResponse(await fetch(api + getEventByIdQuery));
      console.log(`Event data received: `, eventData);
    } catch (e) {
      console.error("Error fetching event", eventData, e);
      error = e;
    }

    if (!eventData || eventData?.slug) return eventData;

    if (eventData.title) {
      // It has been enriched, but no slug means some required fields are missing
      const missingFields = {};
      for (const [key, msg] of [
        ["startsAt", "Fecha y hora de inicio"],
        ["locality", "Localidad (No se reconoce la localidad de Traslasierra y alrededores)"],
      ]) {
        if (!eventData[key]) {
          missingFields[key] = msg;
        }
      }
      if (Object.keys(missingFields).length > 0) {
        throw new MissingFieldsError(missingFields);
      }
    }

    retries++;
    if (retries >= maxRetries) {
      throw new Error(
        `timeout: no se obtuvo link al evento en tiempo suficiente.\n\nPor favor intente nuevamente.${
          error ? `\n\nError: ${error.name}: ${error.message}` : ""
        }`,
      );
    }
    if (output) output.textContent += "Procesando la información del evento...\n";
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return eventData;
}
