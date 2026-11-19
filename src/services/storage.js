import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const validateProductImage = (file) => {
  if (!file) {
    throw new Error('Choose a product image.');
  }

  if (!allowedTypes.has(file.type)) {
    throw new Error('Choose a JPG, JPEG, PNG, or WEBP image.');
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('The image must be 5 MB or smaller.');
  }
};

export const uploadProductImage = async (productId, file) => {
  validateProductImage(file);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const imagePath = `products/${productId}/${crypto.randomUUID()}-${safeName}`;
  const imageRef = ref(storage, imagePath);
  await uploadBytes(imageRef, file, { contentType: file.type });

  try {
    return { imageUrl: await getDownloadURL(imageRef), imagePath };
  } catch (downloadError) {
    try {
      await deleteObject(imageRef);
    } catch (cleanupError) {
      throw new AggregateError(
        [downloadError, cleanupError],
        'The image URL could not be created and the uploaded image could not be cleaned up.',
        { cause: cleanupError },
      );
    }
    throw downloadError;
  }
};

export const deleteProductImage = (imagePath) => {
  if (!imagePath) return Promise.resolve();
  return deleteObject(ref(storage, imagePath));
};
