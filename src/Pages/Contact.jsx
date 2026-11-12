import Button from '../Components/Button';
import './Contact.css';

const Contact = () => {
  return (
    <div className="page-shell contact-page">
      <div className="container contact-shell">
        <div className="contact-copy">
          <p className="eyebrow">Let’s connect</p>
          <h1>We’d love to hear from you.</h1>
          <p>
            Whether you’re looking for product recommendations, skincare guidance, or collaboration inquiries, our team is here to help.
          </p>

          <div className="contact-info-list">
            <div>
              <span>Email</span>
              <a href="mailto:hello@skinora.com">hello@skinora.com</a>
            </div>
            <div>
              <span>WhatsApp</span>
              <a href="https://wa.me/923001234567" target="_blank" rel="noreferrer">+92 300 1234567</a>
            </div>
            <div>
              <span>Instagram</span>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">@skinoraofficial</a>
            </div>
          </div>
        </div>

        <form className="contact-form">
          <label>
            <span>Name</span>
            <input type="text" placeholder="Your name" />
          </label>

          <label>
            <span>Email</span>
            <input type="email" placeholder="Your email" />
          </label>

          <label>
            <span>Message</span>
            <textarea rows="6" placeholder="Tell us how we can help" />
          </label>

          <Button type="submit" variant="primary">Send Message</Button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
