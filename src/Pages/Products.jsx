import { useMemo, useState } from 'react';
import ProductCard from '../Components/ProductCard';
import { useStore } from '../context/StoreContext';
import './Products.css';

const Products = () => {
  const { products } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');

  const categories = ['All', ...new Set(products.map((product) => product.category))];

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    const filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch);
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const sorted = [...filtered];

    switch (sortBy) {
      case 'low-to-high':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'high-to-low':
        sorted.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    return sorted;
  }, [products, searchTerm, selectedCategory, sortBy]);

  return (
    <div className="page-shell products-page">
      <section className="section products-header-section">
        <div className="container">
          <div className="section-heading products-heading">
            <div>
              <p className="eyebrow">Curated collection</p>
              <h1>Shop SKINORA essentials</h1>
            </div>
          </div>

          <div className="products-toolbar">
            <div className="search-box">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products"
                aria-label="Search products"
              />
            </div>

            <div className="filter-controls">
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort products">
                <option value="featured">Featured</option>
                <option value="low-to-high">Price: Low to High</option>
                <option value="high-to-low">Price: High to Low</option>
              </select>
            </div>
          </div>

          <div className="category-filter-group">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`filter-chip ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {filteredProducts.length > 0 ? (
            <div className="product-grid product-grid-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No products match your search.</h3>
              <p>Try a different keyword or reset the category filters.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Products;
