import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import Button from './Button';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useStore();

  return (
    <article className="product-card magnetic-card">
      <div className="product-card-image-wrap">
        <img src={product.image} alt={product.name} className="product-card-image" />
        <span className="product-badge">{product.category}</span>
      </div>

      <div className="product-card-body">
        <div className="product-meta-row">
          <h3>{product.name}</h3>
          <p className="product-price">PKR {product.price}</p>
        </div>

        <p className="product-description">{product.description}</p>

        <div className="product-actions">
          <Link to={`/product/${product.id}`} className="view-link">View Details</Link>
          <Button onClick={() => addToCart(product, 1)} className="small" variant="primary">
            Add to Cart
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
