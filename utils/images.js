/**
 * Converts an array of Blob objects to an array of base64 encoded objects.
 * Each object contains the file name, mime type, and base64 encoded content.
 * @param {Blob[]} blobs - Array of Blob objects to convert.
 * @returns {Promise<Object[]>} - Promise resolving to an array of objects with base64 encoded content.
 */
export async function convertBlobsToBase64(blobs) {
  const promises = [];
  for (const blob of blobs) {
    if (!blob || !(blob instanceof Blob)) {
      console.warn("Skipping non-blob input:", blob);
      continue;
    }
    // No compression needed, use the original blob
    const promise = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result.split(",")[1];
        resolve({
          name: new Date().toISOString(),
          mimeType: blob.type,
          base64,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    promises.push(promise);
  }
  return await Promise.all(promises);
}

/**
 * Compresses an image file to a specified maximum width and quality.
 * @param {File} file - The image file to compress.
 * @param {number} maxWidth - The maximum width of the compressed image.
 * @param {number} quality - The quality of the compressed image (0 to 1).
 * @returns {Promise<File>} - A promise that resolves to the compressed image file.
 */
export function compressFileImage(file, maxWidth = 1000, quality = 0.7) {
  // reuse compressImageBlob to handle File objects
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      // Revoke the object URL to free memory
      URL.revokeObjectURL(img.src);
      try {
        const [compressedBlob, contentType] = await compressImageBlob(file, maxWidth, quality);
        const compressedFile = new File([compressedBlob], file.name, { type: contentType });
        resolve(compressedFile);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Returns [blob, contentType]
 */
export function compressImageBlob(blob, maxWidth = 1000, quality = 0.7, contentType = "image/jpeg") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Revoke the object URL to free memory
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Calculate the new dimensions
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Convert the canvas to a Blob
      canvas.toBlob((blob) => resolve([blob, contentType]), contentType, quality);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}
