
import emailjs from '@emailjs/browser';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// =====================================================
// VALIDATE IMAGE URL
// Only actual HTTP/HTTPS URLs are accepted
// =====================================================

const extractImageUrl = (value) => {
  if (typeof value === 'string') {
    const url = value.trim();

    if (
      url.startsWith('https://') ||
      url.startsWith('http://')
    ) {
      return url;
    }

    return '';
  }

  if (value && typeof value === 'object') {
    const candidates = [
      value.imageUrl,
      value.url,
      value.src,
      value.downloadURL,
      value.downloadUrl,
    ];

    for (const candidate of candidates) {
      const validUrl = extractImageUrl(candidate);

      if (validUrl) return validUrl;
    }
  }

  return '';
};

// =====================================================
// GET IMAGE FROM ORDER ITEM
// =====================================================

const getImageFromItem = (item) => {
  const candidates = [
    item?.imageUrl,
    item?.image,
    item?.productImage,
    item?.product?.imageUrl,
    item?.product?.image,
    item?.images,
    item?.product?.images,
  ];

  for (const candidate of candidates) {
    const directUrl = extractImageUrl(candidate);

    if (directUrl) return directUrl;

    if (Array.isArray(candidate)) {
      for (const image of candidate) {
        const arrayUrl = extractImageUrl(image);

        if (arrayUrl) return arrayUrl;
      }
    }
  }

  return '';
};

// =====================================================
// FETCH IMAGE FROM FIRESTORE IF MISSING
// =====================================================

const getFirestoreProductImage = async (item) => {
  // First try the image saved inside the order item
  const existingImage = getImageFromItem(item);

  if (existingImage) {
    return existingImage;
  }

  // Find product ID
  const productId =
    item?.productId ||
    item?.id ||
    item?.product?.id ||
    item?.product?.productId;

  if (!productId) {
    console.warn(
      'SKINORA: Product ID missing for image lookup.',
      item
    );

    return '';
  }

  try {
    const productRef = doc(
      db,
      'products',
      String(productId)
    );

    const productSnapshot = await getDoc(productRef);

    if (!productSnapshot.exists()) {
      console.warn(
        'SKINORA: Product not found:',
        productId
      );

      return '';
    }

    const product = productSnapshot.data();

    const candidates = [
      product?.imageUrl,
      product?.image,
      product?.productImage,
      product?.images,
    ];

    for (const candidate of candidates) {
      const directUrl = extractImageUrl(candidate);

      if (directUrl) return directUrl;

      if (Array.isArray(candidate)) {
        for (const image of candidate) {
          const arrayUrl = extractImageUrl(image);

          if (arrayUrl) return arrayUrl;
        }
      }
    }

    console.warn(
      'SKINORA: No valid image URL found in product:',
      productId,
      product
    );

    return '';
  } catch (error) {
    console.error(
      'SKINORA: Firestore image lookup failed:',
      productId,
      error
    );

    return '';
  }
};

// =====================================================
// SEND ORDER CONFIRMATION EMAIL
// =====================================================

export const sendOrderConfirmation = async (order) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  // EMAILJS CONFIGURATION
  if (!serviceId || !templateId || !publicKey) {
    throw new Error(
      'EmailJS is not configured. Check your environment variables.'
    );
  }

  // ORDER VALIDATION
  if (!order) {
    throw new Error('Order information is missing.');
  }

  if (!order.customerEmail) {
    throw new Error('Customer email address is missing.');
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    throw new Error('Order products are missing.');
  }

  // ORDER REFERENCE
  const orderReference =
    order.orderNumber ||
    order.trackingId ||
    order.orderId ||
    order.id;

  if (!orderReference) {
    throw new Error('Order reference is missing.');
  }

  // ===================================================
  // PREPARE PRODUCTS AND RESOLVE IMAGES
  // ===================================================

  const orders = await Promise.all(
    order.items.map(async (item) => {
      const imageUrl = await getFirestoreProductImage(item);

      const productName =
        item.name ||
        item.title ||
        item.product?.name ||
        'SKINORA Product';

      const productPrice =
        Number(item.price ?? item.unitPrice) || 0;

      const productQuantity =
        Number(item.quantity ?? item.qty) || 0;

      const product = {
        name: productName,
        price: productPrice,
        units: productQuantity,

        // Image variables for EmailJS template compatibility
        image: imageUrl,
        image_url: imageUrl,
        imageUrl: imageUrl,
      };

      console.log('SKINORA Email product:', {
        name: product.name,
        image: imageUrl,
        hasImage: Boolean(imageUrl),
      });

      return product;
    })
  );

  // ===================================================
  // EMAILJS TEMPLATE VARIABLES
  // ===================================================

  const templateParams = {
    email: order.customerEmail,

    order_id: String(orderReference),

    orders,

    cost: {
      shipping: Number(
        order.deliveryCharges ??
        order.shippingCharges ??
        0
      ),

      tax: Number(order.tax) || 0,

      total: Number(order.totalAmount) || 0,
    },
  };

  // DEBUG IMAGE DATA
  console.log('SKINORA EmailJS payload:', {
    email: templateParams.email,
    order_id: templateParams.order_id,
    products: templateParams.orders.map((item) => ({
      name: item.name,
      image: item.image,
      image_url: item.image_url,
      imageUrl: item.imageUrl,
    })),
  });

  // ===================================================
  // SEND EMAIL
  // ===================================================

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      { publicKey }
    );

    console.log(
      'SKINORA confirmation email sent successfully:',
      response
    );

    return response;
  } catch (error) {
    console.error(
      'SKINORA confirmation email failed:',
      error
    );

    throw new Error(
      error?.text ||
      error?.message ||
      'Unable to send order confirmation email.'
    );
  }
};
