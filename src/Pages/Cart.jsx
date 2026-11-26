
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../Components/Button';
import { useAuth } from '../context/AuthContextValue';
import { useStore } from '../context/StoreContextValue';
import {
  getCheckoutSettings,
  getOrderSubmissionError,
  placeOrder,
} from '../services/orders';
import { sendOrderConfirmation } from '../services/email';
import './Cart.css';

const formatPKR = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString('en-PK')}`;

const Cart = () => {
  const {
    cart,
    cartSubtotal,
    cartSyncError,
    productsLoading,
    updateCartQty,
    removeFromCart,
    clearCart,
  } = useStore();

  // CUSTOMER SESSION ONLY - MAIN AUTH
  const { customerUser, loading: authLoading } = useAuth();
  const user = customerUser;

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
  });

  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

  const [checkoutSettings, setCheckoutSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [checkoutBlocked, setCheckoutBlocked] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const requestId = useRef('');

  // CUSTOMER INPUT VALUES

  const customerName =
    customer.name !== ''
      ? customer.name
      : user?.displayName || '';

  const customerPhone =
    customer.phone !== ''
      ? customer.phone
      : user?.phoneNumber || '';

  // SHIPPING CALCULATION

  const deliveryCharges = checkoutSettings
    ? cartSubtotal >= checkoutSettings.freeShippingThreshold
      ? 0
      : checkoutSettings.deliveryCharges
    : 0;

  const total = cartSubtotal + deliveryCharges;

  // LOAD CHECKOUT SETTINGS

  useEffect(() => {
    let active = true;

    getCheckoutSettings()
      .then((settings) => {
        if (active) {
          setCheckoutSettings(settings);
        }
      })
      .catch((settingsError) => {
        if (active) {
          setSettingsError(
            `Checkout settings could not be loaded: ${getOrderSubmissionError(settingsError)}`
          );
        }
      })
      .finally(() => {
        if (active) {
          setSettingsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // PLACE ORDER

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setError('');
    setSuccess('');

    // VALIDATION

    if (!cart.length) {
      setError('Your cart is empty.');
      return;
    }

    if (!user?.uid) {
      setError('Sign in before placing your order.');
      return;
    }

    if (!user.email) {
      setError('Your account email is missing. Please sign in again.');
      return;
    }

    if (productsLoading) {
      setError('Please wait while we verify your products.');
      return;
    }

    if (settingsLoading || !checkoutSettings) {
      setError(settingsError || 'Please wait while checkout settings load.');
      return;
    }

    if (cart.some((item) => item.unavailable)) {
      setError('Remove unavailable products before placing your order.');
      return;
    }

    const finalCustomerName = customerName.trim();

    if (finalCustomerName.length < 2) {
      setError('Please enter your complete customer name.');
      return;
    }

    const finalPhone = customerPhone.trim();

    if (!finalPhone) {
      setError('Please enter your phone number.');
      return;
    }

    const finalAddress = shippingAddress.trim();

    if (finalAddress.length < 8) {
      setError('Enter the complete shipping address for this order.');
      return;
    }

    if (!paymentMethod) {
      setError('Please select a payment method.');
      return;
    }

    if (checkoutBlocked) {
      setError(
        'Checkout is blocked to prevent duplicate orders. Please refresh your page.'
      );
      return;
    }

    setSubmitting(true);

    try {
      // REQUEST ID

      if (!requestId.current) {
        requestId.current =
          window.sessionStorage.getItem(
            'skinora-order-request-id'
          ) || '';
      }

      if (!requestId.current) {
        requestId.current = crypto.randomUUID().replace(/-/g, '');

        window.sessionStorage.setItem(
          'skinora-order-request-id',
          requestId.current
        );
      }

      // FIRESTORE ORDER

      const result = await placeOrder({
        customer: {
          name: finalCustomerName,
          phone: finalPhone,
        },
        cartItems: cart,
        address: finalAddress,
        phone: finalPhone,
        paymentMethod,
        requestId: requestId.current,
      });

      const order = result?.order || result;

      // ORDER REFERENCE

      const orderReference =
        order?.displayOrderId ||
        order?.orderNumber ||
        order?.trackingId ||
        result?.displayOrderId ||
        result?.orderNumber ||
        result?.orderId ||
        order?.id ||
        'N/A';

      // DUPLICATE ORDER

      if (result?.duplicate) {
        setSuccess(
          `Your order has already been placed successfully. Order ID: ${orderReference}. No new confirmation email was sent. Please check your inbox and Spam folder for the original confirmation.`
        );
        return;
      }

      // ORDER SUCCESSFULLY SAVED

      clearCart();

      // RESET REQUEST ID

      let requestIdCleared = true;

      try {
        window.sessionStorage.removeItem(
          'skinora-order-request-id'
        );

        requestId.current = '';
      } catch {
        requestIdCleared = false;
        setCheckoutBlocked(true);
      }

      const warning = requestIdCleared
        ? ''
        : ' Checkout is temporarily blocked to prevent duplicate orders.';

      // EMAILJS CONFIRMATION

      try {
        await sendOrderConfirmation({
          ...order,
          orderId: orderReference,
          orderNumber: orderReference,
          trackingId: orderReference,
          customerEmail: user.email,
          customerName: finalCustomerName,
          customerPhone: finalPhone,
          items: order?.items || [],
          totalAmount: order?.totalAmount ?? total,
          deliveryCharges:
            order?.deliveryCharges ?? deliveryCharges,
        });

        setSuccess(
          `Thank you! Your order has been placed successfully. Order ID: ${orderReference}. A confirmation email has been sent to ${user.email}.${warning}`
        );
      } catch (emailError) {
        setSuccess(
          `Your order has been placed successfully! Order ID: ${orderReference}.`
        );

        setError(
          `Your order is saved, but the confirmation email could not be sent. Please check My Orders for your order details. ${emailError?.message || ''}${warning}`
        );
      }
    } catch (orderError) {
      setError(getOrderSubmissionError(orderError));
    } finally {
      setSubmitting(false);
    }
  };

  // UI

  return (
    <div className="page-shell cart-page">
      <div className="container cart-shell">

        {/* CART HEADER */}

        <div className="cart-header-row">
          <div>
            <p className="eyebrow">Your bag</p>
            <h1>Shopping cart</h1>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              className="text-button"
              onClick={clearCart}
              disabled={submitting}
            >
              Clear cart
            </button>
          )}
        </div>

        {/* ORDER SUCCESS CARD */}

        {success && (
          <div className="cart-success-card" role="status">
            <div className="cart-success-icon">✓</div>

            <div className="cart-success-content">
              <h3>Order Confirmed!</h3>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* CART SYNC ERROR */}

        {cartSyncError && (
          <div className="cart-notice cart-error-notice" role="alert">
            {cartSyncError}
          </div>
        )}

        {/* EMPTY CART */}

        {cart.length === 0 ? (
          <div className="empty-cart-box">
            {error && (
              <p className="cart-error-text" role="alert">
                {error}
              </p>
            )}

            <h3>Your cart is empty</h3>
            <p>Add a few essentials to your routine.</p>

            <Link to="/products">
              <Button variant="primary">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="cart-layout">

            {/* CART ITEMS */}

            <div className="cart-items-panel">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="cart-item-image"
                  />

                  <div className="cart-item-body">
                    <div className="cart-item-main">
                      <div>
                        <h3>{item.name}</h3>
                        <p>
                          {item.unavailable
                            ? 'No longer available'
                            : item.category}
                        </p>
                      </div>

                      <strong>{formatPKR(item.price)}</strong>
                    </div>

                    <div className="cart-item-meta">
                      <div className="quantity-box small-box">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, -1)}
                          disabled={submitting}
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, 1)}
                          disabled={
                            submitting ||
                            item.unavailable ||
                            item.quantity >= item.stock ||
                            item.quantity >= 99
                          }
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="remove-link"
                        onClick={() => removeFromCart(item.id)}
                        disabled={submitting}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ORDER SUMMARY */}

            <aside className="cart-summary">
              <h3>Order summary</h3>

              <div className="summary-line">
                <span>Subtotal</span>
                <strong>{formatPKR(cartSubtotal)}</strong>
              </div>

              <div className="summary-line">
                <span>Shipping</span>
                <strong>
                  {settingsLoading
                    ? 'Calculating…'
                    : formatPKR(deliveryCharges)}
                </strong>
              </div>

              <div className="summary-line total-line">
                <span>Total</span>
                <strong>{formatPKR(total)}</strong>
              </div>

              {settingsError && (
                <p className="cart-error-text" role="alert">
                  {settingsError}
                </p>
              )}

              {/* CHECKOUT FORM */}

              <form
                className="summary-actions"
                onSubmit={handlePlaceOrder}
              >
                {/* CUSTOMER NAME */}

                <label>
                  <span>Your name</span>

                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) =>
                      setCustomer((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    autoComplete="name"
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </label>

                {/* CUSTOMER EMAIL */}

                <label>
                  <span>Email address</span>

                  <input
                    type="email"
                    value={user?.email ?? ''}
                    autoComplete="email"
                    readOnly
                    required
                  />

                  <small>
                    Order confirmation will be sent to your account email.
                  </small>
                </label>

                {/* PHONE */}

                <label>
                  <span>Phone number</span>

                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(event) =>
                      setCustomer((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    autoComplete="tel"
                    maxLength={20}
                    required
                  />
                </label>

                {/* SHIPPING ADDRESS */}

                <label>
                  <span>Shipping address</span>

                  <textarea
                    value={shippingAddress}
                    onChange={(event) =>
                      setShippingAddress(event.target.value)
                    }
                    autoComplete="street-address"
                    rows={3}
                    minLength={8}
                    maxLength={500}
                    required
                  />
                </label>

                {/* PAYMENT */}

                <label>
                  <span>Payment method</span>

                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value)
                    }
                    disabled={submitting}
                  >
                    <option value="Cash on Delivery">
                      Cash on Delivery
                    </option>

                    <option value="Bank Transfer">
                      Bank Transfer
                    </option>
                  </select>
                </label>

                {/* ERROR */}

                {error && (
                  <div className="cart-notice cart-error-notice" role="alert">
                    {error}
                  </div>
                )}

                {!user && !authLoading && (
                  <p>
                    <Link to="/login" state={{ from: '/cart' }}>
                      Sign in
                    </Link>{' '}
                    to place an order and view its status in your account.
                  </p>
                )}

                {/* CONTINUE SHOPPING */}

                <Link
                  to="/products"
                  onClick={(event) => {
                    if (submitting) event.preventDefault();
                  }}
                >
                  <Button variant="secondary">
                    Continue Shopping
                  </Button>
                </Link>

                {/* PLACE ORDER BUTTON */}

                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    !user ||
                    authLoading ||
                    checkoutBlocked ||
                    submitting ||
                    productsLoading ||
                    settingsLoading ||
                    !checkoutSettings ||
                    cart.some((item) => item.unavailable)
                  }
                >
                  {submitting
                    ? 'Placing order…'
                    : !user
                      ? 'Sign in to checkout'
                      : authLoading ||
                        productsLoading ||
                        settingsLoading
                        ? 'Loading checkout…'
                        : checkoutBlocked
                          ? 'Checkout blocked'
                          : 'Place Order'}
                </Button>
              </form>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
