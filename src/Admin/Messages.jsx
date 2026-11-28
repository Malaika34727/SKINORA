
import { useEffect, useMemo, useState } from 'react';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import {
  deleteMessage,
  listenToMessages,
  updateMessageStatus,
} from '../services/adminData';
import '../Admin/AdminData.css';

const messageStatuses = ['All', 'Unread', 'Read', 'Pending'];

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(
    () =>
      listenToMessages(
        (nextMessages) => {
          setMessages(nextMessages);
          setLoading(false);
        },
        (listenerError) => {
          setError(`Could not load messages: ${listenerError.message}`);
          setLoading(false);
        },
      ),
    [],
  );

  const filteredMessages = useMemo(() => {
    const term = search.trim().toLowerCase();

    return messages.filter((message) => {
      const matchesStatus =
        statusFilter === 'All' || message.status === statusFilter;

      const matchesText =
        !term ||
        [
          message.name,
          message.email,
          message.subject,
          message.message,
        ].some((value) =>
          String(value || '').toLowerCase().includes(term),
        );

      return matchesStatus && matchesText;
    });
  }, [messages, search, statusFilter]);

  const unreadCount = messages.filter(
    (message) => (message.status || 'Unread') === 'Unread',
  ).length;

  const readCount = messages.filter(
    (message) => message.status === 'Read',
  ).length;

  const pendingCount = messages.filter(
    (message) => message.status === 'Pending',
  ).length;

  const handleStatusChange = async (messageId, nextStatus) => {
    try {
      await updateMessageStatus(messageId, nextStatus);
      setError('');
    } catch (updateError) {
      setError(`Could not update message state: ${updateError.message}`);
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('Delete this contact message?')) return;

    try {
      await deleteMessage(messageId);
      setError('');
    } catch (deleteError) {
      setError(`Could not delete message: ${deleteError.message}`);
    }
  };

  return (
    <div className="admin-shell messages-page">
      <AdminSidebar />

      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="admin-panel-content messages-content">

          {/* Heading */}
          <div className="messages-heading">
            <div>
              <span className="messages-eyebrow">
                SKINORA / CUSTOMER SUPPORT
              </span>
              <h1>Contact Inbox</h1>
              <p>
                Manage customer inquiries, review messages and track their
                status.
              </p>
            </div>

            <div className="messages-total-badge">
              <span>Total Messages</span>
              <strong>{messages.length}</strong>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="messages-stats-grid">

            <div className="messages-stat-card">
              <div className="messages-stat-top">
                <span className="messages-stat-icon">✉</span>
                <span className="messages-stat-label">ALL MESSAGES</span>
              </div>
              <strong>{messages.length}</strong>
              <p>Messages received</p>
            </div>

            <div className="messages-stat-card">
              <div className="messages-stat-top">
                <span className="messages-stat-icon">●</span>
                <span className="messages-stat-label">UNREAD</span>
              </div>
              <strong>{unreadCount}</strong>
              <p>Awaiting attention</p>
            </div>

            <div className="messages-stat-card">
              <div className="messages-stat-top">
                <span className="messages-stat-icon">✓</span>
                <span className="messages-stat-label">READ</span>
              </div>
              <strong>{readCount}</strong>
              <p>Already reviewed</p>
            </div>

            <div className="messages-stat-card">
              <div className="messages-stat-top">
                <span className="messages-stat-icon">◷</span>
                <span className="messages-stat-label">PENDING</span>
              </div>
              <strong>{pendingCount}</strong>
              <p>Awaiting follow-up</p>
            </div>

          </div>

          {/* Inbox Section */}
          <section className="messages-inbox">

            <div className="messages-inbox-heading">
              <div>
                <span className="messages-section-label">
                  INBOX MANAGEMENT
                </span>
                <h2>Customer Messages</h2>
                <p>Browse and manage incoming customer inquiries.</p>
              </div>

              <span className="messages-results-count">
                {filteredMessages.length} Results
              </span>
            </div>

            {/* Search and Filter */}
            <div className="messages-toolbar">

              <div className="messages-search">
                <span>⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, subject or message..."
                  aria-label="Search messages"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="messages-clear-button"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="messages-filter">
                <label htmlFor="message-status-filter">FILTER BY</label>
                <select
                  id="message-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter messages by status"
                >
                  {messageStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Error */}
            {error && (
              <div className="messages-error" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="messages-state">
                <div className="messages-loader"></div>
                <h3>Loading inbox</h3>
                <p>Retrieving your customer messages...</p>
              </div>
            )}

            {/* Message List */}
            {!loading && (
              <div className="messages-list">

                {filteredMessages.length === 0 && (
                  <div className="messages-state">
                    <span className="messages-empty-icon">✉</span>
                    <h3>No messages found</h3>
                    <p>
                      {search || statusFilter !== 'All'
                        ? 'Try changing your search or status filter.'
                        : 'New customer inquiries will appear here.'}
                    </p>
                  </div>
                )}

                {filteredMessages.map((message) => {
                  const currentStatus = message.status || 'Unread';

                  return (
                    <article
                      key={message.id}
                      className={`messages-card ${
                        currentStatus === 'Unread'
                          ? 'messages-card-unread'
                          : ''
                      }`}
                    >

                      {/* Message Header */}
                      <div className="messages-card-header">

                        <div className="messages-sender">
                          <div className="messages-avatar">
                            {(message.name || 'C')
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="messages-sender-info">
                            <h3>{message.name || 'Unknown Customer'}</h3>
                            <p>{message.email || 'No email provided'}</p>
                          </div>
                        </div>

                        <span
                          className={`messages-status messages-status-${currentStatus.toLowerCase()}`}
                        >
                          <span></span>
                          {currentStatus}
                        </span>

                      </div>

                      {/* Message Content */}
                      <div className="messages-card-body">

                        <span className="messages-subject-label">
                          MESSAGE SUBJECT
                        </span>

                        <h4>{message.subject || 'No subject'}</h4>

                        <p className="messages-message-text">
                          {message.message || 'No message content.'}
                        </p>

                      </div>

                      {/* Actions */}
                      <div className="messages-card-footer">

                        <div className="messages-status-control">
                          <label htmlFor={`status-${message.id}`}>
                            UPDATE STATUS
                          </label>

                          <select
                            id={`status-${message.id}`}
                            value={currentStatus}
                            onChange={(event) =>
                              handleStatusChange(
                                message.id,
                                event.target.value,
                              )
                            }
                            aria-label={`Update status for ${message.subject}`}
                          >
                            {messageStatuses
                              .filter((status) => status !== 'All')
                              .map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          className="messages-delete-button"
                          onClick={() => handleDelete(message.id)}
                        >
                          <span>⌫</span>
                          Delete Message
                        </button>

                      </div>

                    </article>
                  );
                })}

              </div>
            )}

          </section>
        </div>
      </main>

      {/* Scoped Styling */}
      <style>{`
        .messages-page {
          --msg-dark: #30231f;
          --msg-brown: #49342c;
          --msg-gold: #c6a36a;
          --msg-gold-light: #e2c99c;
          --msg-cream: #f8f4ed;
          --msg-text: #392c26;
          --msg-muted: #98877c;
          --msg-border: #e9dfd2;
        }

        .messages-content {
          padding: 30px;
          color: var(--msg-text);
        }

        .messages-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .messages-eyebrow,
        .messages-section-label {
          color: #b18d58;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .messages-heading h1 {
          margin: 8px 0 6px;
          color: #30231f;
          font-family: Georgia, serif;
          font-size: clamp(28px, 3vw, 36px);
          font-weight: 600;
        }

        .messages-heading p,
        .messages-inbox-heading p {
          margin: 0;
          color: #94847a;
          font-size: 13px;
          line-height: 1.7;
        }

        .messages-total-badge {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 15px 22px;
          min-width: 135px;
          background: #30231f;
          border: 1px solid #b99762;
          border-radius: 12px;
        }

        .messages-total-badge span {
          color: #d4c1a5;
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .messages-total-badge strong {
          color: #f2dfbd;
          font-family: Georgia, serif;
          font-size: 27px;
        }

        .messages-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 17px;
          margin-bottom: 30px;
        }

        .messages-stat-card {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          padding: 21px;
          min-height: 145px;
          background: linear-gradient(
            135deg,
            #30231f 0%,
            #49342c 65%,
            #392821 100%
          );
          border: 1px solid rgba(198, 163, 106, 0.5);
          border-radius: 15px;
          box-shadow: 0 8px 20px rgba(48, 35, 31, 0.1),
            inset 0 1px 0 rgba(255,255,255,0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .messages-stat-card::after {
          content: '';
          position: absolute;
          top: -100%;
          left: -70%;
          width: 45%;
          height: 300%;
          z-index: -1;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 229, 184, 0.13),
            transparent
          );
          transform: rotate(25deg);
          animation: messagesCardShine 6s ease-in-out infinite;
        }

        .messages-stat-card:nth-child(2)::after {
          animation-delay: 1.2s;
        }

        .messages-stat-card:nth-child(3)::after {
          animation-delay: 2.4s;
        }

        .messages-stat-card:nth-child(4)::after {
          animation-delay: 3.6s;
        }

        @keyframes messagesCardShine {
          0%, 65% { left: -80%; }
          100% { left: 150%; }
        }

        .messages-stat-card:hover {
          transform: translateY(-6px);
          border-color: #d5b77f;
          box-shadow: 0 15px 28px rgba(48, 35, 31, 0.2);
        }

        .messages-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 17px;
        }

        .messages-stat-icon {
          display: grid;
          place-items: center;
          width: 35px;
          height: 35px;
          color: #e5c891;
          background: rgba(226, 201, 156, 0.12);
          border: 1px solid rgba(226, 201, 156, 0.3);
          border-radius: 10px;
          font-size: 19px;
        }

        .messages-stat-label {
          color: #c9ad7e;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .messages-stat-card > strong {
          display: block;
          color: #f4e6ce;
          font-family: Georgia, serif;
          font-size: 31px;
          font-weight: 600;
        }

        .messages-stat-card > p {
          margin: 5px 0 0;
          color: #c5b4a2;
          font-size: 11px;
        }

        .messages-inbox {
          padding: 25px;
          background: #fffefa;
          border: 1px solid var(--msg-border);
          border-radius: 16px;
          box-shadow: 0 8px 25px rgba(48, 35, 31, 0.045);
        }

        .messages-inbox-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 20px;
        }

        .messages-inbox-heading h2 {
          margin: 7px 0 5px;
          color: #392c26;
          font-family: Georgia, serif;
          font-size: 23px;
          font-weight: 600;
        }

        .messages-results-count {
          padding: 8px 13px;
          color: #8d7047;
          background: #f6efe3;
          border: 1px solid #e8d7bb;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .messages-toolbar {
          display: grid;
          grid-template-columns: 1fr 190px;
          gap: 13px;
          margin-bottom: 20px;
        }

        .messages-search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          min-height: 47px;
          background: #faf7f1;
          border: 1px solid #e8dfd3;
          border-radius: 10px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .messages-search:focus-within {
          border-color: #b99560;
          box-shadow: 0 0 0 3px rgba(185, 149, 96, 0.1);
        }

        .messages-search > span {
          color: #a88960;
          font-size: 24px;
        }

        .messages-search input {
          flex: 1;
          width: 100%;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: #392c26;
          font-size: 12px;
        }

        .messages-search input::placeholder {
          color: #ad9f92;
        }

        .messages-clear-button {
          padding: 6px 10px;
          color: #8d7047;
          background: #f0e5d3;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
        }

        .messages-filter {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 11px;
          background: #faf7f1;
          border: 1px solid #e8dfd3;
          border-radius: 10px;
        }

        .messages-filter label {
          color: #a18e7d;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.7px;
        }

        .messages-filter select {
          flex: 1;
          min-width: 0;
          padding: 10px 0;
          color: #49372e;
          background: transparent;
          border: none;
          outline: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .messages-error {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 15px 0;
          padding: 13px 15px;
          color: #9b4242;
          background: #fff1ef;
          border: 1px solid #f0ceca;
          border-radius: 9px;
          font-size: 12px;
        }

        .messages-error span {
          display: grid;
          place-items: center;
          width: 20px;
          height: 20px;
          background: #f5d9d5;
          border-radius: 50%;
          font-weight: 800;
        }

        .messages-list {
          display: grid;
          gap: 16px;
        }

        .messages-card {
          padding: 21px;
          background: #fff;
          border: 1px solid #ebe3d9;
          border-radius: 13px;
          transition: border-color 0.25s, box-shadow 0.25s,
            transform 0.25s;
        }

        .messages-card:hover {
          transform: translateY(-2px);
          border-color: #d3b98f;
          box-shadow: 0 10px 25px rgba(48, 35, 31, 0.07);
        }

        .messages-card-unread {
          background: linear-gradient(110deg, #fffdf8, #fff);
          border-left: 3px solid #c5a16b;
        }

        .messages-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding-bottom: 17px;
          border-bottom: 1px solid #f0eae2;
        }

        .messages-sender {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .messages-avatar {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          color: #ead4ad;
          background: linear-gradient(135deg, #30231f, #5a4033);
          border: 1px solid #c4a36d;
          border-radius: 12px;
          font-family: Georgia, serif;
          font-size: 20px;
        }

        .messages-sender-info {
          min-width: 0;
        }

        .messages-sender-info h3 {
          margin: 0 0 5px;
          color: #392c26;
          font-family: Georgia, serif;
          font-size: 16px;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .messages-sender-info p {
          margin: 0;
          color: #9a8a7d;
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        .messages-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 11px;
          border-radius: 30px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .messages-status > span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .messages-status-unread {
          color: #946e45;
          background: #f8f0e4;
          border: 1px solid #ead8ba;
        }

        .messages-status-unread > span {
          background: #c49b62;
        }

        .messages-status-read {
          color: #477653;
          background: #edf5ed;
          border: 1px solid #d4e7d4;
        }

        .messages-status-read > span {
          background: #5d9b69;
        }

        .messages-status-pending {
          color: #79608e;
          background: #f3eef7;
          border: 1px solid #e1d4ed;
        }

        .messages-status-pending > span {
          background: #9575b0;
        }

        .messages-card-body {
          padding: 19px 0;
        }

        .messages-subject-label {
          color: #a18e7d;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .messages-card-body h4 {
          margin: 7px 0 10px;
          color: #49372e;
          font-family: Georgia, serif;
          font-size: 17px;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .messages-message-text {
          margin: 0;
          color: #807166;
          font-size: 12px;
          line-height: 1.8;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .messages-card-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;
          padding-top: 16px;
          border-top: 1px solid #f0eae2;
        }

        .messages-status-control {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .messages-status-control label {
          color: #a18e7d;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .messages-status-control select {
          min-width: 145px;
          padding: 10px 12px;
          color: #49372e;
          background: #faf7f1;
          border: 1px solid #e8dfd3;
          border-radius: 8px;
          outline: none;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
        }

        .messages-status-control select:focus {
          border-color: #b99560;
        }

        .messages-delete-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 14px;
          color: #a14e48;
          background: #fff5f3;
          border: 1px solid #efd5d0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
          transition: background 0.2s, border-color 0.2s;
        }

        .messages-delete-button:hover {
          background: #fce8e5;
          border-color: #dca9a1;
        }

        .messages-delete-button span {
          font-size: 17px;
        }

        .messages-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 55px 20px;
          text-align: center;
        }

        .messages-state h3 {
          margin: 12px 0 6px;
          color: #49372e;
          font-family: Georgia, serif;
          font-size: 20px;
        }

        .messages-state p {
          margin: 0;
          color: #9a897c;
          font-size: 12px;
          line-height: 1.7;
        }

        .messages-empty-icon {
          display: grid;
          place-items: center;
          width: 55px;
          height: 55px;
          color: #a88960;
          background: #f5eee3;
          border: 1px solid #e6d6bc;
          border-radius: 15px;
          font-size: 25px;
        }

        .messages-loader {
          width: 32px;
          height: 32px;
          border: 3px solid #eee3d3;
          border-top-color: #aa8755;
          border-radius: 50%;
          animation: messagesSpin 0.8s linear infinite;
        }

        @keyframes messagesSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1100px) {
          .messages-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .messages-content {
            padding: 16px;
          }

          .messages-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .messages-total-badge {
            width: 100%;
          }

          .messages-stats-grid {
            gap: 10px;
          }

          .messages-stat-card {
            padding: 15px;
            min-height: 130px;
          }

          .messages-inbox {
            padding: 15px;
          }

          .messages-inbox-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .messages-toolbar {
            grid-template-columns: 1fr;
          }

          .messages-filter {
            min-height: 45px;
          }

          .messages-card {
            padding: 15px;
          }

          .messages-card-header {
            align-items: flex-start;
          }

          .messages-sender {
            gap: 9px;
          }

          .messages-avatar {
            width: 39px;
            height: 39px;
          }

          .messages-sender-info h3 {
            font-size: 14px;
          }

          .messages-sender-info p {
            font-size: 10px;
          }

          .messages-card-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .messages-status-control select,
          .messages-delete-button {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .messages-stat-card::after {
            animation: none;
          }

          .messages-loader {
            animation-duration: 2s;
          }

          .messages-card,
          .messages-stat-card {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Messages;
