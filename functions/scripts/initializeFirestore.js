import { applicationDefault, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const expectedProjectId = 'greeningapp-d28b6';
const year = new Date().getUTCFullYear();
const applyChanges = process.argv.includes('--apply');
const databaseId = process.env.FIRESTORE_DATABASE_ID;
const adminApp = getApps().length
  ? getApp()
  : initializeApp({
    credential: applicationDefault(),
    projectId: expectedProjectId,
  });

if (adminApp.options.projectId !== expectedProjectId) {
  throw new Error(`Refusing to continue: expected project ${expectedProjectId}, got ${adminApp.options.projectId || 'unknown'}.`);
}

const db = databaseId ? getFirestore(adminApp, databaseId) : getFirestore(adminApp);
const counterRef = db.collection('settings').doc('orderCounter');
const ordersRef = db.collection('orders');
const prefix = `SKN-${year}-`;
const upperBound = `${prefix}\uf8ff`;
const trackingIdQuery = ordersRef
  .where('trackingId', '>=', prefix)
  .where('trackingId', '<', upperBound)
  .orderBy('trackingId')
  .select('trackingId', 'orderNumber', 'orderId');
const orderNumberQuery = ordersRef
  .where('orderNumber', '>=', prefix)
  .where('orderNumber', '<', upperBound)
  .orderBy('orderNumber')
  .select('trackingId', 'orderNumber', 'orderId');
const orderIdQuery = ordersRef
  .where('orderId', '>=', prefix)
  .where('orderId', '<', upperBound)
  .orderBy('orderId')
  .select('trackingId', 'orderNumber', 'orderId');

const inspectCounterState = async (transaction) => {
  const get = (reference) => (transaction ? transaction.get(reference) : reference.get());
  const [counterSnapshot, trackingSnapshot, orderNumberSnapshot, orderIdSnapshot] = await Promise.all([
    get(counterRef),
    get(trackingIdQuery),
    get(orderNumberQuery),
    get(orderIdQuery),
  ]);
  const orders = new Map();

  for (const snapshot of [trackingSnapshot, orderNumberSnapshot, orderIdSnapshot]) {
    for (const orderDocument of snapshot.docs) {
      orders.set(orderDocument.id, {
        ...orders.get(orderDocument.id),
        ...orderDocument.data(),
      });
    }
  }

  let maxOrderSequence = 0;
  const usedTrackingIds = new Set();
  for (const order of orders.values()) {
    const canonicalOrderId = order.orderId || order.trackingId || order.orderNumber;
    if (canonicalOrderId && order.trackingId && order.trackingId !== canonicalOrderId) {
      throw new Error('An existing order has mismatched trackingId and orderId; no counter changes were made.');
    }
    if (canonicalOrderId && order.orderNumber && order.orderNumber !== canonicalOrderId) {
      throw new Error('An existing order has mismatched orderNumber and orderId; no counter changes were made.');
    }

    const trackingId = canonicalOrderId;
    if (!trackingId?.startsWith(prefix)) continue;

    const match = /^SKN-(\d{4})-(\d{5,})$/.exec(trackingId);
    if (!match || Number(match[1]) !== year) {
      throw new Error('An existing order has an invalid current-year tracking ID; no counter changes were made.');
    }

    const sequence = Number(match[2]);
    if (!Number.isSafeInteger(sequence) || sequence < 1 || usedTrackingIds.has(trackingId)) {
      throw new Error(`Order tracking IDs are invalid or duplicated; no counter changes were made.`);
    }
    usedTrackingIds.add(trackingId);
    maxOrderSequence = Math.max(maxOrderSequence, sequence);
  }

  const counter = counterSnapshot.data();
  if (counterSnapshot.exists) {
    if (!Number.isInteger(counter.year) || counter.year > year) {
      throw new Error('The existing order counter has an invalid or future year; no counter changes were made.');
    }
    if (counter.year === year && (!Number.isSafeInteger(counter.lastSequence) || counter.lastSequence < 0)) {
      throw new Error('The existing order counter sequence is invalid; no counter changes were made.');
    }
  }

  const existingSequence = counter?.year === year ? counter.lastSequence : 0;
  const lastSequence = Math.max(existingSequence, maxOrderSequence);

  return {
    exists: counterSnapshot.exists,
    lastSequence,
    needsWrite: !counterSnapshot.exists || counter.year !== year || lastSequence > existingSequence,
    maxOrderSequence,
  };
};

const collectionNames = new Set((await db.listCollections()).map((collection) => collection.id));
const requestedCollections = ['products', 'customers', 'orders', 'messages', 'settings'];
const collectionReport = await Promise.all(requestedCollections.map(async (name) => {
  const collectionExists = collectionNames.has(name);
  const documentCount = collectionExists
    ? (await db.collection(name).count().get()).data().count
    : 0;
  return { name, exists: collectionExists, documentCount };
}));
const state = await inspectCounterState(null);

console.log(`Firestore read access confirmed for target project: ${expectedProjectId}`);
console.log(`Firestore database: ${databaseId || '(default)'}`);
console.log('Collections (existence is based on current documents):');
for (const collection of collectionReport) {
  console.log(`- ${collection.name}: ${collection.exists ? `present (${collection.documentCount} documents)` : 'not present'}`);
}

if (state.needsWrite) {
  const action = state.exists ? 'advance' : 'create';
  console.log(`Counter dry run: ${action} settings/orderCounter with { year: ${year}, lastSequence: ${state.lastSequence } }.`);
} else {
  console.log(`Counter dry run: no change; settings/orderCounter is already at ${year}/${state.lastSequence}.`);
}

if (collectionReport.find(({ name }) => name === 'products')?.documentCount === 0) {
  console.log('Products: the existing admin starter-catalog importer can add the six starter products; no product documents are created by this script.');
}
console.log('Customers, orders, and messages are never seeded by this script.');

if (applyChanges && state.needsWrite) {
  const result = await db.runTransaction(async (transaction) => {
    const current = await inspectCounterState(transaction);
    if (!current.needsWrite) return { ...current, written: false };

    transaction.set(counterRef, {
      year,
      lastSequence: current.lastSequence,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return { ...current, written: true };
  });
  const savedCounter = await counterRef.get();
  const savedData = savedCounter.data();
  if (!savedCounter.exists || savedData.year !== year || savedData.lastSequence !== result.lastSequence) {
    throw new Error('The order counter write could not be verified by read-back.');
  }
  console.log(`${result.written ? 'Applied' : 'No write required; verified'} settings/orderCounter at ${year}/${result.lastSequence}.`);
} else if (applyChanges) {
  console.log('No write required.');
} else {
  console.log('Dry run only. No Firestore documents were written. Use --apply only after reviewing this report.');
}
