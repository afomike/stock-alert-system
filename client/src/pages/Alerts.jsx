import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StockAlert from '../components/StockAlert';
import * as inventoryService from '../services/inventoryService';

export default function Alerts() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  async function load() {
    try {
      const data = await inventoryService.getNotifications();
      setNotifications(data.notifications);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load alerts. Is the API running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMarkRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await inventoryService.markNotificationRead(id);
    } catch {
      load(); // resync on failure
    }
  }

  const visible = notifications.filter((n) => filter === 'ALL' || !n.is_read);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Layout title="Alerts">
      {error && (
        <div className="alert alert-error mb-6">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">Error Loading Alerts</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="inline-flex border border-line rounded-lg overflow-hidden bg-white">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-5 py-2.5 font-medium text-sm transition-all ${filter === 'ALL' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'}`}
          >
            <span className="mr-2">📋</span>
            All Alerts {notifications.length > 0 && `(${notifications.length})`}
          </button>
          <div className="w-px bg-line"></div>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-5 py-2.5 font-medium text-sm transition-all flex items-center gap-2 ${filter === 'UNREAD' ? 'bg-warning text-white' : 'text-ink/60 hover:text-ink'}`}
          >
            <span>🔔</span>
            Unread
            {unreadCount > 0 && (
              <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${filter === 'UNREAD' ? 'bg-white/30' : 'bg-warning/20 text-warning'}`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-3 border-line border-t-slate rounded-full animate-spin mb-4"></div>
          <p className="text-lg text-ink/50 font-medium">Loading alerts…</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">✓</p>
          <p className="font-display text-lg font-bold text-ink/70">All Caught Up!</p>
          <p className="text-sm text-ink/50 mt-1">
            {filter === 'ALL' 
              ? 'No alerts at this time. All products are within safe stock levels.' 
              : 'No unread alerts. Great job managing your inventory!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((n) => (
            <StockAlert key={n.id} notification={n} onMarkRead={handleMarkRead} />
          ))}
        </div>
      )}
    </Layout>
  );
}
