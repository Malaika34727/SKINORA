import { Link } from 'react-router-dom';
import Button from '../Components/Button';
import CategoryCard from '../Components/CategoryCard';
import ProductCard from '../Components/ProductCard';
import ScrollReveal from '../Components/ScrollReveal';
import { useStore } from '../context/StoreContextValue';
import { beautyImage, categories as fallbackCategories, heroImage, testimonials, textureImage } from '../data/products';
import './Home.css';

const highlights = [
  { title: 'Thoughtful essentials', text: 'A considered edit for the everyday skincare routine.' },
  { title: 'Comfort-first rituals', text: 'Textures and steps designed to make daily care feel special.' },
  { title: 'Your routine, your way', text: 'Explore a simple collection and find what fits your skin.' },
];

const benefits = [
  'Deep hydration and barrier support',
  'Brightening formulas for a natural glow',
  'Calming care for daily rituals',
  'Clean, luxurious textures that feel weightless',
];

const Home = () => {
  const { products, productsLoading, productsError, categories: storedCategories, categoriesError } = useStore();
  const featuredProducts = products.filter((product) => product.status !== 'inactive').slice(0, 4);
  const visibleCategories = storedCategories.length
    ? storedCategories
      .filter((category) => category.isActive !== false)
      .map((category) => ({
        ...category,
        img: fallbackCategories.find((item) => item.name === category.name)?.img || textureImage,
      }))
    : fallbackCategories;

  return (
    <div className="page-shell">
      <section className="hero-section">
        <div className="container hero-grid">
          <ScrollReveal className="hero-copy">
            <p className="eyebrow">Luxury skincare essentials</p>
            <h1>Glow deeper. Feel softer. Live beautifully.</h1>
            <p className="hero-text">
              Discover premium skincare crafted to renew your complexion, protect your glow, and transform your daily ritual into a self-care moment.
            </p>
            <div className="hero-actions">
              <Link to="/products">
                <Button variant="primary">Shop Now</Button>
              </Link>
              <Link to="/about">
                <Button variant="secondary">Our Story</Button>
              </Link>
            </div>
            <div className="hero-metrics">
              <div>
                <strong>01</strong>
                <span>Cleanse</span>
              </div>
              <div>
                <strong>02</strong>
                <span>Nourish</span>
              </div>
              <div>
                <strong>03</strong>
                <span>Protect</span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="hero-visual" delay={180}>
            <div className="hero-image-wrap">
              <img src={heroImage} alt="SKINORA skincare selection" className="hero-image" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="brand-intro container">
        <div className="section-heading simple-heading">
          <p className="eyebrow">Why SKINORA</p>
          <h2>Designed for luminous confidence.</h2>
        </div>
        <div className="highlight-grid">
          {highlights.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 100} className="highlight-card">
              <span className="highlight-number">0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Featured products</p>
              <h2>Best-loved essentials</h2>
            </div>
            <Link to="/products" className="inline-link">Explore all</Link>
          </div>

          {productsLoading ? (
            <p className="muted-copy" role="status">Loading the collection…</p>
          ) : productsError ? (
            <p className="muted-copy" role="alert">{productsError}</p>
          ) : featuredProducts.length > 0 ? (
            <div className="product-grid four-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="featured-empty">
              <p>Our collection is being prepared. Explore the SKINORA rituals in the meantime.</p>
              <Link to="/products" className="inline-link">Explore the collection</Link>
            </div>
          )}
        </div>
      </section>

      <section className="section categories-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Shop by category</p>
              <h2>Tailored skincare rituals</h2>
            </div>
          </div>

          <div className="category-grid">
            {visibleCategories.map((category, index) => (
              <ScrollReveal key={category.id || category.name} delay={index * 80}>
                <CategoryCard category={category} />
              </ScrollReveal>
            ))}
          </div>
          {categoriesError && <p role="alert">{categoriesError}</p>}
        </div>
      </section>

      <section className="section benefits-section">
        <div className="container benefits-grid">
          <ScrollReveal className="benefits-copy">
            <p className="eyebrow">The SKINORA difference</p>
            <h2>Care that feels as good as it looks.</h2>
            <p>
              Every formula is built around skin balance, nourishment, and confidence—so your routine feels luxurious and effective from the very first application.
            </p>
            <ul className="benefits-list">
              {benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal className="benefits-visual" delay={120}>
            <div className="benefits-image-panel">
              <img src={beautyImage} alt="Beauty skincare portrait" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="promo-banner-wrap">
        <div className="container promo-banner">
          <div className="promo-copy">
            <p className="eyebrow light">The SKINORA edit</p>
            <h2>Small rituals. A little more room to glow.</h2>
          </div>
          <Link to="/products">
            <Button variant="primary">Explore the collection</Button>
          </Link>
        </div>
      </section>

      <section className="section testimonials-section">
        <div className="container">
          <div className="section-heading center-heading">
            <p className="eyebrow">Testimonials</p>
            <h2>Real stories, real glow</h2>
          </div>

          <div className="testimonial-grid">
            {testimonials.map((item, index) => (
              <ScrollReveal key={item.name} delay={index * 90} className="testimonial-card">
                <div className="quote-mark">“</div>
                <p>{item.text}</p>
                <strong>{item.name}</strong>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="newsletter" className="newsletter-section">
        <div className="container newsletter-box">
          <div>
            <p className="eyebrow">Stay in the glow loop</p>
            <h2>Get skincare insights and exclusive offers.</h2>
          </div>
          <form className="newsletter-form">
            <input type="email" placeholder="Enter your email" aria-label="Email address" />
            <Button type="submit" variant="primary">Join Now</Button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
