/**
 * @typedef {Object} EventResponse - The response from the Google Form.
 * @property {string} MarcaTemporal - The timestamp of the event.
 * @property {string} DireccionDeCorreoElectronico - The email address ("Dirección de correo electrónico").
 * @property {string} Localidad - The locality.
 * @property {string} Imagen - The URL of the image.
 * @property {string} [Ubicacion] - The location description ("Ubicación").
 * @property {string} [Descripcion] - The event description ("Descripción").
 * @property {string} Comienzo - The start time of the event.
 * @property {string} [Cierre] - The end time of the event.
 * @property {string} [TelefonoDeContacto] - The contact phone number ("Teléfono de contacto").
 * @property {string} [Instagram] - The Instagram handle.
 * @property {string} [Titulo] - The title of the event. ("Título")
 */

/**
 * @typedef  {EventResponse} EventData  - The iternal event data.
 * @property {string} id - The unique identifier.
 * @property {string} imageUrl - The URL for the image thumbnail.
 */
