import emailjs from '@emailjs/browser';

export const sendOrderConfirmation = async (order) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS is not configured. Set its VITE_EMAILJS_* environment variables.');
  }

  const orderDate = new Date(order.orderDate || Date.now()).toLocaleString('en-PK');
  const itemLines = order.items.map((item) =>
    `${item.name} — ${item.quantity} × PKR ${item.unitPrice} = PKR ${item.lineTotal}`,
  );
  const orderReference = order.orderId || order.trackingId || order.orderNumber || order.id;
  const templateParams = {
    to_email: order.customerEmail,
    customer_email: order.customerEmail,
    customer_name: order.customerName,
    order_id: orderReference,
    order_number: orderReference,
    tracking_id: orderReference,
    order_document_id: orderReference,
    products: itemLines.join('\n'),
    order_items: itemLines.join('\n'),
    subtotal: order.subtotal,
    delivery_charges: order.deliveryCharges ?? order.shippingCharges ?? 0,
    shipping_address: order.shippingAddress || '',
    payment_method: order.paymentMethod || '',
    payment_status: order.paymentStatus || 'Pending',
    total_amount: order.totalAmount,
    order_date: orderDate,
    message: `Thank you for shopping with SKINORA. Your order ${order.orderNumber} has been received.`,
  };

  await emailjs.send(serviceId, templateId, templateParams, { publicKey });
};
