import { Link } from 'react-router-dom';
import Button from '../Components/Button';
import { useStore } from '../context/StoreContext';
import './Cart.css';

const Cart = () => {
  const { cart, cartSubtotal, updateCartQty, removeFromCart, clearCart } = useStore();

  const total = cartSubtotal;

  const handleOrderNow = () => {
    const customerName = 'SKINORA Customer';
    const itemSummary = cart
      .map((item) => `${item.name} (ID: ${item.id}) x${item.quantity} @ PKR ${item.price} each`)
      .join(', ');

    const message = `Hello SKINORA, I would like to place an order.%0A%0ACustomer Name: ${customerName}%0AProducts: ${itemSummary}%0AOrder Total: PKR ${total}%0AThank you.`;
    const whatsappUrl = `https://wa.me/923001234567?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="page-shell cart-page">
      <div className="container cart-shell">
        <div className="cart-header-row">
          <div>
            <p className="eyebrow">Your bag</p>
            <h1>Shopping cart</h1>
          </div>
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
                  <img src={item.image} alt={item.name} className="cart-item-image" />

                  <div className="cart-item-body">
                    <div className="cart-item-main">
                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.category}</p>
                      </div>
                      <strong>PKR {item.price}</strong>
                    </div>

                    <div className="cart-item-meta">
                      <div className="quantity-box small-box">
                        <button type="button" onClick={() => updateCartQty(item.id, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => updateCartQty(item.id, 1)}>+</button>
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
                <strong>PKR {total}</strong>
              </div>
              <div className="summary-line">
                <span>Shipping</span>
                <strong>Free</strong>
              </div>
              <div className="summary-line total-line">
                <span>Total</span>
                <strong>PKR {total}</strong>
              </div>

              <div className="summary-actions">
                <Link to="/products">
                  <Button variant="secondary">Continue Shopping</Button>
                </Link>
                <Button onClick={handleOrderNow} variant="primary">Order Now</Button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
