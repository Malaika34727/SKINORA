
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';

import {
  storage,
  secondaryStorage,
} from '../firebase';

// ==========================================
// STORAGE INSTANCES
// ==========================================

export const mainStorage = storage;
export const adminStorage = secondaryStorage;

// ==========================================
// IMAGE VALIDATION
// ==========================================

const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const validateProductImage = (file) => {
  if (!file) {
    throw new Error('Choose a product image.');
  }

  if (!allowedTypes.has(file.type)) {
    throw new Error(
      'Choose a JPG, JPEG, PNG, or WEBP image.'
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      'The image must be 5 MB or smaller.'
    );
  }
};

// ==========================================
// UPLOAD PRODUCT IMAGE
// Default: Main Storage (Super Admin)
// Optional: Secondary Storage (Sub Admin)
// ==========================================

export const uploadProductImage = async (
  productId,
  file,
  storageInstance = storage
) => {
  validateProductImage(file);

  const safeName = file.name.replace(
    /[^a-zA-Z0-9._-]/g,
    '-'
  );

  const imagePath = `products/${productId}/${crypto.randomUUID()}-${safeName}`;

  const imageRef = ref(storageInstance, imagePath);

  await uploadBytes(imageRef, file, {
    contentType: file.type,
  });

  try {
    return {
      imageUrl: await getDownloadURL(imageRef),
      imagePath,
    };
  } catch (downloadError) {
    try {
      await deleteObject(imageRef);
    } catch (cleanupError) {
      throw new AggregateError(
        [downloadError, cleanupError],
        'The image URL could not be created and the uploaded image could not be cleaned up.',
        { cause: cleanupError }
      );
    }

    throw downloadError;
  }
};

// ==========================================
// DELETE PRODUCT IMAGE
// Default: Main Storage
// Optional: Secondary Storage
// ==========================================

export const deleteProductImage = (
  imagePath,
  storageInstance = storage
) => {
  if (!imagePath) {
    return Promise.resolve();
  }

  return deleteObject(
    ref(storageInstance, imagePath)
  );
};
