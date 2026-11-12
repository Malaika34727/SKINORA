import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../Components/Button';
import ProductCard from '../Components/ProductCard';
import { useStore } from '../context/StoreContext';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const { products, addToCart } = useStore();
  const [quantity, setQuantity] = useState(1);

  const product = useMemo(() => products.find((item) => item.id === id), [id, products]);

  if (!product) {
    return (
      <div className="page-shell empty-product-state">
        <div className="container">
          <h2>Product not found.</h2>
          <Link to="/products" className="back-link">Return to products</Link>
        </div>
      </div>
    );
  }

  const relatedProducts = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);

  return (
    <div className="page-shell product-details-page">
      <div className="container product-details-shell">
        <div className="product-visual-card">
          <img src={product.image} alt={product.name} className="product-visual" />
        </div>

        <div className="product-info-card">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="product-price-detail">PKR {product.price}</p>
          <p className="product-description-detail">{product.description}</p>

          <div className="quantity-row">
            <label htmlFor="quantity">Quantity</label>
            <div className="quantity-box">
              <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))}>-</button>
              <span id="quantity">{quantity}</span>
              <button type="button" onClick={() => setQuantity((current) => current + 1)}>+</button>
            </div>
          </div>

          <div className="details-actions">
            <Button onClick={() => addToCart(product, quantity)} variant="primary">Add to Cart</Button>
            <Link to="/products">
              <Button variant="secondary">Continue Shopping</Button>
            </Link>
          </div>

          <div className="product-meta-list">
            <div>
              <span>Product ID</span>
              <strong>{product.id}</strong>
            </div>
            <div>
              <span>In Stock</span>
              <strong>{product.stock}</strong>
            </div>
          </div>
        </div>
      </div>

      <section className="section related-products">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">You may also like</p>
              <h2>Related products</h2>
            </div>
          </div>

          {relatedProducts.length > 0 ? (
            <div className="product-grid product-grid-3">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          ) : (
            <p className="muted-copy">More product recommendations coming soon.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductDetails;
