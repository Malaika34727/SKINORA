
import { useEffect, useState } from 'react';
import Button from '../Components/Button';
import { submitContactMessage } from '../services/messages';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import './Contact.css';

const DEFAULT_EMAIL = 'hello@skinora.com';

const Contact = () => {
  const [storeEmail, setStoreEmail] = useState(DEFAULT_EMAIL);

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Load store email dynamically from Firestore
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'storeSettings');

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const settings = snapshot.data();

          if (settings.storeEmail?.trim()) {
            setStoreEmail(settings.storeEmail.trim());
          }
        }
      },
      (error) => {
        console.error('Could not load store email:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback({ error: '', success: '' });

    try {
      await submitContactMessage(form);

      setForm({
        name: '',
        email: '',
        subject: '',
        message: '',
      });

      setFeedback({
        error: '',
        success: 'Your message has been sent. Thank you for contacting SKINORA.',
      });
    } catch (error) {
      setFeedback({
        error: error.message || 'Your message could not be sent.',
        success: '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell contact-page">
      <div className="container contact-shell">
        <div className="contact-copy">
          <p className="eyebrow">Let’s connect</p>

          <h1>We’d love to hear from you.</h1>

          <p>
            Whether you’re looking for product recommendations, skincare guidance,
            or collaboration inquiries, our team is here to help.
          </p>

          <div className="contact-info-list">
            <div>
              <span>Email</span>
              <a href={`mailto:${storeEmail}`}>{storeEmail}</a>
            </div>

            <div>
              <span>WhatsApp</span>
              <a
                href="https://wa.me/923001234567"
                target="_blank"
                rel="noreferrer"
              >
                +92 300 1234567
              </a>
            </div>

            <div>
              <span>Instagram</span>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
              >
                @skinoraofficial
              </a>
            </div>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              minLength="2"
              maxLength="120"
              required
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              placeholder="Your email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              maxLength="254"
              required
            />
          </label>

          <label>
            <span>Subject</span>
            <input
              type="text"
              placeholder="How can we help?"
              value={form.subject}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
              minLength="2"
              maxLength="200"
              required
            />
          </label>

          <label>
            <span>Message</span>
            <textarea
              rows="6"
              placeholder="Tell us how we can help"
              value={form.message}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
              minLength="2"
              maxLength="3000"
              required
            />
          </label>

          {feedback.error && (
            <p role="alert">{feedback.error}</p>
          )}

          {feedback.success && (
            <p role="status">{feedback.success}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
          >
            {submitting ? 'Sending…' : 'Send Message'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
