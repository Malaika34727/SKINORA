# SKINORA

Skincare e-commerce app built with React, Firebase, and EmailJS.

## Local setup

1. Install the root dependencies with `npm install`.
2. Copy `.env.example` to `.env` with `Copy-Item .env.example .env` (PowerShell), then set the EmailJS values and reCAPTCHA v3 site key. The Firebase web configuration is in `src/firebase.js`; it uses project `greeningapp-d28b6`.
3. Run `npm run dev` and open the local Vite URL.

The customer storefront provides `/login`, `/signup`, and a protected `/account` page. Customers must sign in to place orders; their cart and order history are associated with their Authentication UID. Product documents support optional `brand` and `discountPrice` values plus an `active`/`inactive` status. Checkout validates the live Firestore price and inventory in a Cloud Function transaction.

Run the local production build and lint checks with `npm run build` and `npm run lint`.

The EmailJS public key is intended for browser use and is visible in the built client. Do not put Firebase service-account credentials or private keys in the frontend.

## Firebase setup

In Firebase Console for `greeningapp-d28b6`:

1. Confirm the Firestore database is the `(default)` database. The Storage authorization rule checks admin membership in `(default)`.
2. Enable Email/Password authentication. Enable Google authentication if customers should use the Google button on the sign-in page.
3. Enable Firebase Storage.
4. Register the web app with Firebase App Check using reCAPTCHA v3. Put its actual site key in `VITE_RECAPTCHA_V3_SITE_KEY` in `.env`; allow the local development hostname and production hostname in the reCAPTCHA configuration. Checkout callables (`getCheckoutSettings`, `ensureCustomerProfile`, and `placeOrder`) enforce App Check and will not work with an empty or placeholder key. Keep enforcement enabled; do not use debug tokens or disable enforcement as a workaround.
5. Create an administrator in Authentication. Copy that user's UID, then create an empty `admins/{UID}` document in Firestore. Admin documents cannot be created through the client.
6. Deploy the Firestore rules, Storage rules, and order Cloud Functions from the repository root:

   ```powershell
   npx firebase-tools login
   npx firebase-tools deploy --project greeningapp-d28b6 --only firestore:rules,storage,functions
   ```

   Cloud Functions deployment requires a billing-enabled Firebase/Google Cloud project. The order function verifies current Firestore prices and stock in a transaction. Cancelling an order restores its stock. Do not replace it with browser-only price checks.
7. Sign in at `/admin/login`, then select **Import starter catalog** on Manage Products. The migration uploads original product images to Storage and skips products already present by ID or normalized name.

The app and Functions default to Firestore's `(default)` database. If the project uses a named database, configure `VITE_FIRESTORE_DATABASE_ID` for Vite and `FIRESTORE_DATABASE_ID` for Functions, and update the Storage rule's admin lookup accordingly before deployment.

## Safe Firestore initialization

The Admin SDK initializer is pinned to `greeningapp-d28b6` and uses Application Default Credentials. From the `functions` directory, run `node scripts\initializeFirestore.js` for a read-only dry run. It reports whether the five requested collections have documents and calculates a safe yearly counter value from existing order IDs. It does not print customer or message contents.

Only after reviewing the dry-run output and separately approving the production write, run `node scripts\initializeFirestore.js --apply`. This transaction creates or advances only `settings/orderCounter` and verifies it by reading it back. It refuses invalid/future counter values, mismatched order/tracking IDs, or duplicate IDs. Match `FIRESTORE_DATABASE_ID` to the database used by the deployed Functions.

Products are populated through the existing **Import starter catalog** admin action, which skips existing products. The initializer never creates placeholder customers, orders, or messages; Firestore collections become visible only after a real document is written by the corresponding application workflow.

## EmailJS template

Set `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_PUBLIC_KEY` in `.env`. Configure the EmailJS template recipient as `{{to_email}}`. The app passes `customer_name`, `customer_email`, `order_id`, `order_number`, `tracking_id`, `order_document_id`, `products`, `order_items`, `total_amount`, `order_date`, and `message`. Align the template with these names. An email failure does not undo a saved order.

Orders receive an atomic yearly customer-facing ID such as `SKN-2026-00001`, stored as both `trackingId` and `orderNumber`; their Firestore document ID remains separate. The first successful order creates or advances `settings/orderCounter`. Orders are currently recorded as **Pending**; no online payment provider is integrated. Contact submissions are saved in `messages`; there is not yet a separate admin message-inbox screen.
