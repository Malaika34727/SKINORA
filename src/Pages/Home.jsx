import { Link } from 'react-router-dom';
import Button from '../Components/Button';
import CategoryCard from '../Components/CategoryCard';
import ProductCard from '../Components/ProductCard';
import ScrollReveal from '../Components/ScrollReveal';
import { useStore } from '../context/StoreContext';
import { beautyImage, categories, heroImage, testimonials } from '../data/products';
import './Home.css';

const highlights = [
  { title: 'Clinically curated', text: 'Luxury ingredients chosen for visible skin confidence.' },
  { title: 'Dermatologist trusted', text: 'Gentle rituals designed to support healthy, hydrated skin.' },
  { title: 'Real glow results', text: 'A premium system created to brighten and restore.' },
];

const benefits = [
  'Deep hydration and barrier support',
  'Brightening formulas for a natural glow',
  'Calming care for daily rituals',
  'Clean, luxurious textures that feel weightless',
];

const Home = () => {
  const { products } = useStore();
  const featuredProducts = products.slice(0, 4);

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
                <strong>25k+</strong>
                <span>Happy clients</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>Average rating</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Glow-first formulas</span>
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

          <div className="product-grid four-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
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
            {categories.map((category, index) => (
              <ScrollReveal key={category.name} delay={index * 80}>
                <CategoryCard category={category} />
              </ScrollReveal>
            ))}
          </div>
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
            <p className="eyebrow light">Limited glow ritual</p>
            <h2>Bundle your essentials and save up to 20%.</h2>
          </div>
          <Link to="/products">
            <Button variant="primary">Shop Bundles</Button>
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

      <section className="newsletter-section">
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
