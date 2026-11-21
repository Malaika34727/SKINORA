
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { auth, db } from '../firebase';
import { initialProducts } from '../data/products';
import { deleteProductImage, uploadProductImage } from './storage';
import { getAdminStatus } from './authService';

const productsCollection = collection(db, 'products');

// ==========================================
// CHECK PRODUCT PERMISSIONS
// ==========================================

const verifyProductPermission = async (permission) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Please log in to continue.');
  }

  const adminStatus = await getAdminStatus(user);

  if (!adminStatus.isAdmin) {
    throw new Error('You are not authorized to manage products.');
  }

  // Super Admin has full product access
  if (adminStatus.role === 'admin') {
    return true;
  }

  // Check individual Sub Admin permission
  if (
    adminStatus.role === 'productManager' &&
    adminStatus.permissions?.[permission] === true
  ) {
    return true;
  }

  throw new Error(
    `You do not have permission to ${permission.replace(/([A-Z])/g, ' $1').toLowerCase()}.`
  );
};

// ==========================================
// CONVERT FIRESTORE DOCUMENT
// ==========================================

const toProduct = (snapshot) => {
  const data = snapshot.data();

  return {
    ...data,
    id: snapshot.id,
    imageUrl: data.imageUrl || data.image || '',
    brand: data.brand || '',
    status: data.status || 'active',
  };
};

// ==========================================
// PRODUCT PRICE
// ==========================================

export const getProductPrice = (product) => (
  Number.isFinite(product.discountPrice)
    && product.discountPrice >= 0
    && product.discountPrice <= product.price
    ? product.discountPrice
    : product.price
);

// ==========================================
// REALTIME PRODUCTS
// ==========================================

export const listenToProducts = (onProducts, onError) => onSnapshot(
  productsCollection,
  (snapshot) => onProducts(snapshot.docs.map(toProduct)),
  onError,
);

// ==========================================
// CREATE PRODUCT
// ==========================================

export const createProduct = async (values, file) => {
  await verifyProductPermission('addProduct');

  const productRef = doc(productsCollection);
  const image = await uploadProductImage(productRef.id, file);

  const { discountPrice, ...productValues } = values;

  try {
    await setDoc(productRef, {
      ...productValues,

      ...(discountPrice === undefined || discountPrice === null || discountPrice === ''
        ? {}
        : { discountPrice: Number(discountPrice) }),

      id: productRef.id,
      ...image,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    try {
      await deleteProductImage(image.imagePath);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        'Product save failed and its uploaded image could not be cleaned up.',
        { cause: cleanupError },
      );
    }

    throw error;
  }

  return {
    id: productRef.id,
    ...values,
    ...image,
  };
};

// ==========================================
// UPDATE PRODUCT
// ==========================================

export const updateProduct = async (productId, values, file) => {
  await verifyProductPermission('updateProduct');

  const productRef = doc(db, 'products', productId);
  const currentSnapshot = await getDoc(productRef);

  if (!currentSnapshot.exists()) {
    throw new Error('This product no longer exists.');
  }

  const oldImagePath = currentSnapshot.data().imagePath;
  const newImage = file
    ? await uploadProductImage(productId, file)
    : null;

  try {
    await updateDoc(productRef, {
      ...values,

      ...(Object.prototype.hasOwnProperty.call(values, 'discountPrice')
        ? {
            discountPrice:
              values.discountPrice === '' || values.discountPrice === null
                ? deleteField()
                : Number(values.discountPrice),
          }
        : {}),

      ...(newImage || {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (newImage) {
      try {
        await deleteProductImage(newImage.imagePath);
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          'Product update failed and its uploaded image could not be cleaned up.',
          { cause: cleanupError },
        );
      }
    }

    throw error;
  }

  let cleanupWarning = '';

  if (newImage && oldImagePath) {
    try {
      await deleteProductImage(oldImagePath);
    } catch (error) {
      cleanupWarning =
        `Product updated, but its previous image could not be deleted: ${error.message}`;
    }
  }

  return { cleanupWarning };
};

// ==========================================
// DELETE PRODUCT
// ==========================================

export const removeProduct = async (productId) => {
  await verifyProductPermission('deleteProduct');

  const productRef = doc(db, 'products', productId);
  const productSnapshot = await getDoc(productRef);

  if (!productSnapshot.exists()) {
    throw new Error('This product no longer exists.');
  }

  await deleteDoc(productRef);

  try {
    await deleteProductImage(productSnapshot.data().imagePath);
    return '';
  } catch (error) {
    return `Product deleted, but its image could not be deleted: ${error.message}`;
  }
};

// ==========================================
// IMPORT STARTER CATALOG
// ==========================================

export const importStarterCatalog = async () => {
  await verifyProductPermission('importProducts');

  const existingProducts = await getDocs(productsCollection);

  const existingNames = new Set(
    existingProducts.docs.map((product) =>
      String(product.data().name || '').trim().toLowerCase()
    ),
  );

  let imported = 0;
  let skipped = 0;

  for (const product of initialProducts) {
    const productRef = doc(db, 'products', product.id);

    if (
      existingNames.has(product.name.trim().toLowerCase()) ||
      (await getDoc(productRef)).exists()
    ) {
      skipped += 1;
      continue;
    }

    const response = await fetch(product.image);

    if (!response.ok) {
      throw new Error(
        `Could not load the starter image for ${product.name}.`
      );
    }

    const blob = await response.blob();

    const file = new File(
      [blob],
      `${product.id}.png`,
      { type: blob.type || 'image/png' }
    );

    const image = await uploadProductImage(product.id, file);

    let wasImported;

    try {
      wasImported = await runTransaction(db, async (transaction) => {
        const currentProduct = await transaction.get(productRef);

        if (currentProduct.exists()) {
          return false;
        }

        transaction.set(productRef, {
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          category: product.category,
          stock: product.stock,
          brand: '',
          status: 'active',
          ...image,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return true;
      });
    } catch (error) {
      try {
        await deleteProductImage(image.imagePath);
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          `Import failed for ${product.name} and its uploaded image could not be cleaned up.`,
          { cause: cleanupError },
        );
      }

      throw error;
    }

    if (!wasImported) {
      await deleteProductImage(image.imagePath);
      skipped += 1;
      continue;
    }

    existingNames.add(product.name.trim().toLowerCase());
    imported += 1;
  }

  return { imported, skipped };
};
