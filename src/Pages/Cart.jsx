import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../Components/Button';
import { useAuth } from '../context/AuthContextValue';
import { useStore } from '../context/StoreContextValue';
import { getCheckoutSettings, getOrderSubmissionError, placeOrder } from '../services/orders';
import { sendOrderConfirmation } from '../services/email';
import './Cart.css';

const Cart = () => {
  const { cart, cartSubtotal, cartSyncError, productsLoading, updateCartQty, removeFromCart, clearCart } = useStore();
  const { user } = useAuth();
  const [customer, setCustomer] = useState({ name: null, email: null, phone: null });
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
  const deliveryCharges = checkoutSettings
    ? (cartSubtotal >= checkoutSettings.freeShippingThreshold ? 0 : checkoutSettings.deliveryCharges)
    : 0;
  const total = cartSubtotal + deliveryCharges;

  useEffect(() => {
    let active = true;
    getCheckoutSettings()
      .then((settings) => {
        if (active) setCheckoutSettings(settings);
      })
      .catch((settingsError) => {
        if (active) setSettingsError(`Checkout settings could not be loaded: ${getOrderSubmissionError(settingsError)}`);
      })
      .finally(() => {
        if (active) setSettingsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    if (!cart.length) {
      setError('Your cart is empty.');
      return;
    }
    if (!user) {
      setError('Sign in before placing an order so it can be linked to your account.');
      return;
    }
    if (productsLoading) {
      setError('Please wait while we verify your products.');
      return;
    }
    if (settingsLoading || !checkoutSettings) {
      setError(settingsError || 'Please wait while secure checkout settings load.');
      return;
    }
    if (cart.some((item) => item.unavailable)) {
      setError('Remove unavailable products before placing your order.');
      return;
    }
    if (!shippingAddress.trim()) {
      setError('Enter the complete shipping address for this order.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!requestId.current) {
        requestId.current = window.sessionStorage.getItem('skinora-order-request-id') || '';
      }
      if (!requestId.current) {
        requestId.current = crypto.randomUUID().replace(/-/g, '');
        window.sessionStorage.setItem('skinora-order-request-id', requestId.current);
      }

      const order = await placeOrder({
        customerName: customer.name ?? user?.displayName ?? '',
        customerEmail: customer.email ?? user?.email ?? '',
        customerPhone: customer.phone ?? user?.phoneNumber ?? '',
        shippingAddress: shippingAddress.trim(),
        paymentMethod,
        cart,
        requestId: requestId.current,
      });

      if (order.duplicate) {
        clearCart();
        let requestIdCleared = true;
        try {
          window.sessionStorage.removeItem('skinora-order-request-id');
          requestId.current = '';
        } catch {
          requestIdCleared = false;
          setCheckoutBlocked(true);
        }
        try {
          await sendOrderConfirmation(order);
          setSuccess(`Order ${order.trackingId} was already placed. A confirmation email was sent to ${order.customerEmail}.${requestIdCleared ? '' : ' Further checkout is blocked because this browser could not clear the duplicate-protection key.'}`);
        } catch (emailError) {
          setSuccess(`Order ${order.trackingId} was already placed, but the confirmation email could not be sent.${requestIdCleared ? '' : ' Further checkout is blocked because this browser could not clear the duplicate-protection key.'}`);
          setError(emailError.message || 'Email confirmation failed.');
        }
        return;
      }

      clearCart();
      let requestIdCleared = true;
      try {
        window.sessionStorage.removeItem('skinora-order-request-id');
        requestId.current = '';
      } catch {
        requestIdCleared = false;
        setCheckoutBlocked(true);
      }
      try {
        await sendOrderConfirmation(order);
        setSuccess(`Thank you! Order ${order.trackingId} is placed. A confirmation email was sent to ${order.customerEmail}.${requestIdCleared ? '' : ' Further checkout is blocked because this browser could not clear the duplicate-protection key.'}`);
      } catch (emailError) {
        setSuccess(`Order ${order.trackingId} is placed, but the confirmation email could not be sent. Please keep this order reference.${requestIdCleared ? '' : ' Further checkout is blocked because this browser could not clear the duplicate-protection key.'}`);
        setError(emailError.message || 'Email confirmation failed.');
      }
    } catch (orderError) {
      setError(getOrderSubmissionError(orderError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell cart-page">
      <div className="container cart-shell">
        <div className="cart-header-row">
          <div>
            <p className="eyebrow">Your bag</p>
            <h1>Shopping cart</h1>
          </div>
          {success && <p role="status">{success}</p>}
          {error && cart.length === 0 && <p role="alert">{error}</p>}
          {cartSyncError && <p role="alert">{cartSyncError}</p>}
          {cart.length > 0 && (
            <button type="button" className="text-button" onClick={clearCart}>
              Clear cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart-box">
            <h3>Your cart is empty</h3>
            <p>Add a few essentials to your routine.</p>
            <Link to="/products">
              <Button variant="primary">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items-panel">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <img src={item.imageUrl} alt={item.name} className="cart-item-image" />

                  <div className="cart-item-body">
                    <div className="cart-item-main">
                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.unavailable ? 'No longer available' : item.category}</p>
                      </div>
                      <strong>PKR {item.price}</strong>
                    </div>

                    <div className="cart-item-meta">
                      <div className="quantity-box small-box">
                        <button type="button" onClick={() => updateCartQty(item.id, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, 1)}
                          disabled={item.unavailable || item.quantity >= item.stock || item.quantity >= 99}
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          +
                        </button>
                      </div>

                      <button type="button" className="remove-link" onClick={() => removeFromCart(item.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="cart-summary">
              <h3>Order summary</h3>
              <div className="summary-line">
                <span>Subtotal</span>
                <strong>PKR {cartSubtotal}</strong>
              </div>
              <div className="summary-line">
                <span>Shipping</span>
                <strong>{settingsLoading ? 'Calculating…' : `PKR ${deliveryCharges}`}</strong>
              </div>
              <div className="summary-line total-line">
                <span>Total</span>
                <strong>PKR {total}</strong>
              </div>
              {settingsError && <p role="alert">{settingsError}</p>}

              <form className="summary-actions" onSubmit={handlePlaceOrder}>
                <label>
                  <span>Your name</span>
                  <input
                    type="text"
                    value={customer.name ?? user?.displayName ?? ''}
                    onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))}
                    autoComplete="name"
                    minLength="2"
                    maxLength="120"
                    required
                  />
                </label>
                <label>
                  <span>Email address</span>
                  <input
                    type="email"
                    value={customer.email ?? user?.email ?? ''}
                    onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))}
                    autoComplete="email"
                    maxLength="254"
                    required
                  />
                </label>
                <label>
                  <span>Phone number</span>
                  <input
                    type="tel"
                    value={customer.phone ?? user?.phoneNumber ?? ''}
                    onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
                    autoComplete="tel"
                    pattern="\+?[0-9\s()-]{7,20}"
                    maxLength="20"
                    required
                  />
                </label>
                <label>
                  <span>Shipping address</span>
                  <textarea
                    value={shippingAddress}
                    onChange={(event) => setShippingAddress(event.target.value)}
                    autoComplete="street-address"
                    rows="3"
                    minLength="8"
                    maxLength="500"
                    required
                  />
                </label>
                <label>
                  <span>Payment method</span>
                  <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </label>
                {error && <p role="alert">{error}</p>}
                {!user && (
                  <p>
                    <Link to="/login" state={{ from: '/cart' }}>Sign in</Link> to place an order and view its status in your account.
                  </p>
                )}
                <Link to="/products">
                  <Button variant="secondary">Continue Shopping</Button>
                </Link>
                <Button type="submit" variant="primary" disabled={!user || checkoutBlocked || submitting || productsLoading || settingsLoading || !checkoutSettings || cart.some((item) => item.unavailable)}>
                  {submitting ? 'Placing order…' : !user ? 'Sign in to checkout' : productsLoading || settingsLoading ? 'Loading checkout…' : 'Place Order'}
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
