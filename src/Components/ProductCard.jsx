import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContextValue';
import { getProductPrice } from '../services/products';
import Button from './Button';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useStore();
  const salePrice = getProductPrice(product);
  const unavailable = product.status === 'inactive' || product.stock <= 0;

  return (
    <article className="product-card magnetic-card">
      <div className="product-card-image-wrap">
        <img src={product.imageUrl} alt={product.name} className="product-card-image" />
        <span className="product-badge">{product.category}</span>
      </div>

      <div className="product-card-body">
        <div className="product-meta-row">
          <h3>{product.name}</h3>
          <p className="product-price">
            PKR {salePrice}
            {salePrice < product.price && <del> PKR {product.price}</del>}
          </p>
        </div>

        <p className="product-description">{product.description}</p>

        <div className="product-actions">
          <Link to={`/product/${product.id}`} className="view-link">View Details</Link>
          <Button onClick={() => addToCart(product, 1)} className="small" variant="primary" disabled={unavailable}>
            {unavailable ? 'Unavailable' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
