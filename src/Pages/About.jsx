import ScrollReveal from '../Components/ScrollReveal';
import { beautyImage, textureImage } from '../data/products';
import './About.css';

const About = () => {
  return (
    <div className="page-shell about-page">
      <section className="section about-hero">
        <div className="container about-hero-grid">
          <ScrollReveal className="about-copy">
            <p className="eyebrow">Our philosophy</p>
            <h1>Skin-first rituals for everyday radiance.</h1>
            <p>
              At SKINORA, we believe skincare should feel as thoughtful and elevated as it looks. Our formulas combine nourishing actives, calming botanicals, and gentle textures that work with your skin to restore softness, clarity, and confidence.
            </p>
          </ScrollReveal>

          <ScrollReveal className="about-visual" delay={120}>
            <img src={beautyImage} alt="SKINORA skincare philosophy" />
          </ScrollReveal>
        </div>
      </section>

      <section className="section values-section">
        <div className="container">
          <div className="section-heading center-heading">
            <p className="eyebrow">What guides us</p>
            <h2>Glow without compromise</h2>
          </div>

          <div className="value-grid">
            <ScrollReveal className="value-card" delay={50}>
              <h3>Thoughtful ingredients</h3>
              <p>We spotlight effective, skin-supportive actives that deliver visible results without harshness.</p>
            </ScrollReveal>

            <ScrollReveal className="value-card" delay={120}>
              <h3>Luxury textures</h3>
              <p>Our formulas are designed to feel indulgent, weightless, and beautifully indulgent in everyday use.</p>
            </ScrollReveal>

            <ScrollReveal className="value-card" delay={190}>
              <h3>Inclusive care</h3>
              <p>Each product is created to celebrate different skin needs, tones, and routines with balance in mind.</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="section story-section">
        <div className="container story-grid">
          <div className="story-panel">
            <img src={textureImage} alt="SKINORA texture background" />
          </div>

          <div className="story-copy">
            <p className="eyebrow">Our story</p>
            <h2>Born from a love of skin wellness.</h2>
            <p>
              SKINORA was created for people who want their routine to feel luxurious and restorative. From daily hydration to targeted glow rituals, each product supports skin health with a focus on comfort, confidence, and long-term care.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
