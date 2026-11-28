
import { useEffect, useState } from 'react';

import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';

import {
  listenToSettings,
  saveStoreSettings,
} from '../services/adminData';

import '../Admin/AdminData.css';

const emptyForm = {
  storeName: 'SKINORA',
  storeEmail: 'hello@skinora.com',
  storePhone: '+923001234567',
  storeAddress: 'Karachi, Pakistan',
  deliveryCharges: 250,
  freeShippingThreshold: 5000,
  currency: 'PKR',
};

const Settings = () => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => listenToSettings(
    (settings) => {
      if (settings) {
        setForm({
          storeName: settings.storeName || '',
          storeEmail: settings.storeEmail || '',
          storePhone: settings.storePhone || '',
          storeAddress: settings.storeAddress || '',
          deliveryCharges: settings.deliveryCharges || 0,
          freeShippingThreshold: settings.freeShippingThreshold || 0,
          currency: settings.currency || 'PKR',
        });
      }
      setLoading(false);
    },
    (listenerError) => {
      setError(`Could not load settings: ${listenerError.message}`);
      setLoading(false);
    },
  ), []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await saveStoreSettings(form);
      setSuccess('Store settings saved successfully.');
    } catch (submitError) {
      setError(
        submitError.message || 'The settings could not be saved.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-shell settings-page">
      <AdminSidebar />

      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="admin-panel-content settings-content">

          <style>{`

            /* ===============================
               SETTINGS MAIN DESIGN
            =============================== */

            .settings-content {
              padding: 30px;
              color: #f5eee4;
            }

            .settings-heading {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              gap: 20px;
            }

            .settings-eyebrow {
              color: #d7b477;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 3px;
              margin: 0 0 10px;
              text-transform: uppercase;
            }

            .settings-heading h2 {
              color: #fff5e8;
              font-size: 29px;
              font-weight: 750;
              letter-spacing: .3px;
              margin: 0 0 9px;
            }

            .settings-description {
              color: #a99a8a;
              font-size: 13px;
              margin: 0;
            }

            .settings-heading-icon {
              width: 62px;
              height: 62px;
              display: grid;
              place-items: center;
              border-radius: 18px;
              font-size: 27px;
              color: #f0d39b;
              background: linear-gradient(145deg, #574025, #21170e);
              border: 1px solid rgba(235,193,117,.65);
              box-shadow:
                0 0 18px rgba(221,175,94,.25),
                inset 0 0 14px rgba(255,220,160,.12);
            }

            /* ===============================
               GOLDEN SHINE CARDS
            =============================== */

            .settings-layout {
              display: grid;
              grid-template-columns: minmax(0, 1fr) 300px;
              gap: 24px;
              align-items: start;
            }

            .settings-form-card,
            .settings-info-card {
              position: relative;
              isolation: isolate;
              overflow: hidden;
              background:
                linear-gradient(
                  135deg,
                  #30251b 0%,
                  #1b1511 48%,
                  #302317 100%
                );
              border: 1px solid rgba(218,178,108,.48);
              border-radius: 20px;
              padding: 27px;
              box-shadow:
                0 0 15px rgba(220,176,98,.09),
                0 15px 40px rgba(0,0,0,.32),
                inset 0 1px 0 rgba(255,230,180,.13);
              transition:
                transform .4s ease,
                border-color .4s ease,
                box-shadow .4s ease;
            }

            .settings-form-card::before,
            .settings-info-card::before {
              content: "";
              position: absolute;
              top: 0;
              left: -150%;
              width: 75%;
              height: 100%;
              background: linear-gradient(
                110deg,
                transparent,
                rgba(255,222,164,.04),
                rgba(255,226,177,.19),
                rgba(255,222,164,.04),
                transparent
              );
              transform: skewX(-22deg);
              transition: left .9s ease;
              pointer-events: none;
              z-index: -1;
            }

            .settings-form-card:hover::before,
            .settings-info-card:hover::before {
              left: 150%;
            }

            .settings-form-card:hover,
            .settings-info-card:hover {
              transform: translateY(-4px);
              border-color: rgba(244,205,133,.9);
              box-shadow:
                0 0 12px rgba(226,182,105,.25),
                0 0 30px rgba(226,182,105,.13),
                0 20px 45px rgba(0,0,0,.4),
                inset 0 1px 0 rgba(255,228,176,.25);
            }

            /* ===============================
               CARD HEADING
            =============================== */

            .settings-card-heading {
              display: flex;
              align-items: center;
              gap: 14px;
              padding-bottom: 22px;
              margin-bottom: 25px;
              border-bottom: 1px solid rgba(220,180,112,.2);
            }

            .settings-card-icon {
              width: 43px;
              height: 43px;
              display: grid;
              place-items: center;
              border-radius: 13px;
              color: #f0d49b;
              font-size: 20px;
              background: linear-gradient(145deg,#604728,#24190f);
              border: 1px solid rgba(228,189,120,.55);
              box-shadow:
                0 0 15px rgba(220,175,100,.2),
                inset 0 0 12px rgba(255,225,175,.1);
            }

            .settings-card-heading h3 {
              color: #f6ead9;
              font-size: 16px;
              font-weight: 700;
              margin: 0 0 5px;
            }

            .settings-card-heading p {
              color: #a89989;
              font-size: 11px;
              margin: 0;
            }

            /* ===============================
               FORM GRID
            =============================== */

            .settings-form-grid {
              display: grid;
              grid-template-columns: repeat(2,minmax(0,1fr));
              gap: 22px;
            }

            .settings-field {
              display: flex;
              flex-direction: column;
              gap: 9px;
              min-width: 0;
            }

            .settings-field label {
              color: #dfcdb4;
              font-size: 12px;
              font-weight: 650;
              letter-spacing: .3px;
            }

            .settings-field input,
            .settings-field textarea {
              width: 100%;
              box-sizing: border-box;
              padding: 13px 15px;
              background: rgba(15,12,10,.78);
              border: 1px solid #51402d;
              border-radius: 10px;
              color: #f7eee3;
              outline: none;
              font-family: inherit;
              font-size: 13px;
              transition: all .3s ease;
            }

            .settings-field input:hover,
            .settings-field textarea:hover {
              border-color: rgba(217,177,109,.65);
            }

            .settings-field input:focus,
            .settings-field textarea:focus {
              border-color: #e4bd78;
              box-shadow:
                0 0 0 3px rgba(220,178,105,.11),
                0 0 17px rgba(220,178,105,.18);
              background: #19130e;
            }

            .settings-field input::placeholder,
            .settings-field textarea::placeholder {
              color: #766758;
            }

            .settings-field textarea {
              resize: vertical;
              min-height: 115px;
              line-height: 1.6;
            }

            .settings-currency-note {
              color: #a38d70;
              font-size: 10px;
              margin-top: -3px;
            }

            .settings-address-field {
              margin-top: 23px;
            }

            /* ===============================
               FORM FOOTER
            =============================== */

            .settings-form-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 16px;
              margin-top: 28px;
              padding-top: 22px;
              border-top: 1px solid rgba(220,180,112,.2);
            }

            .settings-save-note {
              color: #a99a89;
              font-size: 11px;
              line-height: 1.6;
              margin: 0;
            }

            .settings-save-button {
              position: relative;
              overflow: hidden;
              border: 1px solid #f1d49c;
              border-radius: 10px;
              padding: 13px 24px;
              background: linear-gradient(
                110deg,
                #99703b,
                #f0d49a,
                #b58a4c,
                #e8c783
              );
              background-size: 200% 100%;
              color: #24190e;
              font-size: 12px;
              font-weight: 850;
              letter-spacing: .4px;
              cursor: pointer;
              box-shadow:
                0 0 16px rgba(218,177,105,.26),
                inset 0 1px 0 rgba(255,255,255,.4);
              transition: all .4s ease;
            }

            .settings-save-button:hover:not(:disabled) {
              background-position: 100% 0;
              transform: translateY(-3px);
              box-shadow:
                0 0 25px rgba(218,177,105,.45),
                0 8px 20px rgba(0,0,0,.3);
            }

            .settings-save-button:disabled {
              opacity: .6;
              cursor: not-allowed;
            }

            /* ===============================
               ALERT MESSAGES
            =============================== */

            .settings-alert {
              padding: 13px 15px;
              border-radius: 10px;
              font-size: 12px;
              margin-top: 20px;
            }

            .settings-alert.error {
              color: #ffb9a9;
              background: rgba(180,65,52,.13);
              border: 1px solid rgba(220,100,80,.3);
            }

            .settings-alert.success {
              color: #c4e7c5;
              background: rgba(65,145,85,.13);
              border: 1px solid rgba(100,180,115,.3);
            }

            /* ===============================
               RIGHT INFORMATION CARD
            =============================== */

            .settings-info-card h3 {
              color: #f4e6d2;
              font-size: 17px;
              margin: 0 0 10px;
            }

            .settings-info-card > p {
              color: #ad9b89;
              font-size: 12px;
              line-height: 1.8;
              margin: 0 0 22px;
            }

            .settings-info-item {
              display: flex;
              align-items: flex-start;
              gap: 13px;
              padding: 17px 0;
              border-top: 1px solid rgba(222,179,107,.16);
            }

            .settings-info-icon {
              width: 35px;
              height: 35px;
              flex-shrink: 0;
              display: grid;
              place-items: center;
              border-radius: 10px;
              color: #e8c788;
              background: rgba(204,159,88,.12);
              border: 1px solid rgba(218,177,108,.28);
              font-size: 15px;
            }

            .settings-info-item strong {
              display: block;
              color: #e9d9c3;
              font-size: 11px;
              margin-bottom: 6px;
            }

            .settings-info-item small {
              display: block;
              color: #a0907e;
              font-size: 10px;
              line-height: 1.6;
            }

            .settings-info-footer {
              margin-top: 18px;
              padding: 14px;
              border: 1px solid rgba(221,180,108,.27);
              border-radius: 11px;
              background: rgba(197,151,78,.07);
              color: #cbb18a;
              font-size: 10px;
              line-height: 1.7;
            }

            /* ===============================
               LOADING
            =============================== */

            .settings-loading {
              padding: 55px 20px;
              text-align: center;
              color: #e3c17f;
              border: 1px solid rgba(218,178,108,.4);
              border-radius: 17px;
              background: #211912;
              box-shadow: 0 0 20px rgba(218,178,108,.1);
            }

            /* ===============================
               RESPONSIVE
            =============================== */

            @media(max-width: 1100px) {
              .settings-layout {
                grid-template-columns: 1fr;
              }

              .settings-info-card {
                display: grid;
                grid-template-columns: repeat(2,minmax(0,1fr));
                gap: 0 22px;
              }

              .settings-info-card h3,
              .settings-info-card > p,
              .settings-info-footer {
                grid-column: 1 / -1;
              }
            }

            @media(max-width: 650px) {
              .settings-content {
                padding: 17px;
              }

              .settings-heading h2 {
                font-size: 23px;
              }

              .settings-heading-icon {
                width: 49px;
                height: 49px;
              }

              .settings-form-card,
              .settings-info-card {
                padding: 19px;
              }

              .settings-form-grid {
                grid-template-columns: 1fr;
              }

              .settings-info-card {
                display: block;
              }

              .settings-form-footer {
                flex-direction: column;
                align-items: stretch;
              }

              .settings-save-button {
                width: 100%;
              }
            }

            @media(prefers-reduced-motion: reduce) {
              .settings-form-card,
              .settings-info-card,
              .settings-form-card::before,
              .settings-info-card::before,
              .settings-save-button {
                transition: none;
              }
            }

          `}</style>

          {/* PAGE HEADER */}

          <div className="settings-heading">
            <div>
              <p className="settings-eyebrow">
                ✦ SKINORA / CONFIGURATION
              </p>

              <h2>Store Settings</h2>

              <p className="settings-description">
                Manage your store identity, delivery and business information.
              </p>
            </div>

            <div className="settings-heading-icon">
              ⚙
            </div>
          </div>

          {loading ? (
            <div className="settings-loading">
              Loading your store settings...
            </div>
          ) : (

            <div className="settings-layout">

              {/* MAIN SETTINGS FORM */}

              <form
                className="settings-form-card"
                onSubmit={handleSubmit}
              >

                <div className="settings-card-heading">
                  <div className="settings-card-icon">
                    ✦
                  </div>

                  <div>
                    <h3>General Information</h3>
                    <p>Manage your store's basic information</p>
                  </div>
                </div>

                <div className="settings-form-grid">

                  <div className="settings-field">
                    <label htmlFor="storeName">
                      Store Name
                    </label>

                    <input
                      id="storeName"
                      name="storeName"
                      value={form.storeName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="settings-field">
                    <label htmlFor="storeEmail">
                      Store Email
                    </label>

                    <input
                      id="storeEmail"
                      type="email"
                      name="storeEmail"
                      value={form.storeEmail}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="settings-field">
                    <label htmlFor="storePhone">
                      Contact Number
                    </label>

                    <input
                      id="storePhone"
                      name="storePhone"
                      value={form.storePhone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="settings-field">
                    <label htmlFor="currency">
                      Store Currency
                    </label>

                    <input
                      id="currency"
                      name="currency"
                      value={form.currency}
                      onChange={handleChange}
                    />

                    <span className="settings-currency-note">
                      Example: PKR, USD, GBP
                    </span>
                  </div>

                  <div className="settings-field">
                    <label htmlFor="deliveryCharges">
                      Delivery Charges
                    </label>

                    <input
                      id="deliveryCharges"
                      type="number"
                      min="0"
                      name="deliveryCharges"
                      value={form.deliveryCharges}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="settings-field">
                    <label htmlFor="freeShippingThreshold">
                      Free Shipping Threshold
                    </label>

                    <input
                      id="freeShippingThreshold"
                      type="number"
                      min="0"
                      name="freeShippingThreshold"
                      value={form.freeShippingThreshold}
                      onChange={handleChange}
                    />
                  </div>

                </div>

                <div className="settings-field settings-address-field">
                  <label htmlFor="storeAddress">
                    Store Address
                  </label>

                  <textarea
                    id="storeAddress"
                    name="storeAddress"
                    rows="4"
                    value={form.storeAddress}
                    onChange={handleChange}
                  />
                </div>

                {error && (
                  <p
                    className="settings-alert error"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                {success && (
                  <p
                    className="settings-alert success"
                    role="status"
                  >
                    {success}
                  </p>
                )}

                <div className="settings-form-footer">
                  <p className="settings-save-note">
                    ✦ Make sure your store information is correct.
                  </p>

                  <button
                    type="submit"
                    className="settings-save-button"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : '✦ Save Changes'}
                  </button>
                </div>

              </form>

              {/* INFORMATION PANEL */}

              <aside className="settings-info-card">

                <h3>Store Configuration</h3>

                <p>
                  Keep your business details updated for a smooth
                  shopping experience and accurate delivery information.
                </p>

                <div className="settings-info-item">
                  <div className="settings-info-icon">
                    ✦
                  </div>

                  <div>
                    <strong>Store Identity</strong>
                    <small>
                      Your official store name and contact details.
                    </small>
                  </div>
                </div>

                <div className="settings-info-item">
                  <div className="settings-info-icon">
                    ◇
                  </div>

                  <div>
                    <strong>Delivery Management</strong>
                    <small>
                      Control delivery charges and free shipping limits.
                    </small>
                  </div>
                </div>

                <div className="settings-info-item">
                  <div className="settings-info-icon">
                    ◎
                  </div>

                  <div>
                    <strong>Currency Settings</strong>
                    <small>
                      Set the currency used throughout your store.
                    </small>
                  </div>
                </div>

                <div className="settings-info-footer">
                  ✨ Premium Store Management
                  <br />
                  Your SKINORA business information in one place.
                </div>

              </aside>

            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Settings;
