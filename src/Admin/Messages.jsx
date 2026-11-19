import { useEffect, useMemo, useState } from 'react';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import { deleteMessage, listenToMessages, updateMessageStatus } from '../services/adminData';
import '../Admin/AdminData.css';

const messageStatuses = ['All', 'Unread', 'Read', 'Pending'];

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => listenToMessages(
    (nextMessages) => {
      setMessages(nextMessages);
      setLoading(false);
    },
    (listenerError) => {
      setError(`Could not load messages: ${listenerError.message}`);
      setLoading(false);
    },
  ), []);

  const filteredMessages = useMemo(() => {
    const term = search.trim().toLowerCase();
    return messages.filter((message) => {
      const matchesStatus = statusFilter === 'All' || message.status === statusFilter;
      const matchesText = !term || [message.name, message.email, message.subject, message.message].some((value) => String(value || '').toLowerCase().includes(term));
      return matchesStatus && matchesText;
    });
  }, [messages, search, statusFilter]);

  const handleStatusChange = async (messageId, nextStatus) => {
    try {
      await updateMessageStatus(messageId, nextStatus);
    } catch (updateError) {
      setError(`Could not update message state: ${updateError.message}`);
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('Delete this contact message?')) return;
    try {
      await deleteMessage(messageId);
    } catch (deleteError) {
      setError(`Could not delete message: ${deleteError.message}`);
    }
  };

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="admin-panel-content">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Support</p>
              <h2>Contact inbox</h2>
            </div>
          </div>

          <div className="table-toolbar">
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search inbox" aria-label="Search messages" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter messages by status">
              {messageStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>

          {error && <p role="alert">{error}</p>}
          {loading && <p>Loading messages…</p>}

          <div className="admin-card-list">
            {!loading && filteredMessages.length === 0 && <p>No messages match the current filter.</p>}
            {filteredMessages.map((message) => (
              <div key={message.id} className={`admin-card admin-card-list-item ${message.status === 'Unread' ? 'unread' : ''}`}>
                <div className="admin-entity-header">
                  <div>
                    <strong>{message.name}</strong>
                    <p>{message.email}</p>
                  </div>
                  <span className={`admin-pill ${message.status === 'Unread' ? 'warning' : ''}`}>{message.status || 'Unread'}</span>
                </div>

                <h4>{message.subject}</h4>
                <p>{message.message}</p>

                <div className="admin-inline-actions">
                  <select value={message.status || 'Unread'} onChange={(event) => handleStatusChange(message.id, event.target.value)} aria-label={`Update status for ${message.subject}`}>
                    {messageStatuses.filter((status) => status !== 'All').map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                  <button type="button" className="admin-link-button danger" onClick={() => handleDelete(message.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
