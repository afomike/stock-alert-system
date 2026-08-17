import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import { Link } from 'react-router-dom';

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="border-b border-line bg-paper sticky top-0 z-40 ml-0 md:ml-0">
      <div className="px-6 md:px-8 py-4 flex items-center justify-between gap-4">
        {/* Left Section: Title */}
        <div className="flex-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
            {title}
          </h1>
        </div>

        {/* Right Section: User Profile & Actions */}
        <div className="flex items-center gap-4">
          {/* User Info & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg hover:bg-paper-dim transition-colors"
            >
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-ink leading-tight">
                  {user?.name || 'User'}
                </p>
                <p className="font-mono text-xs text-ink/50 uppercase tracking-wide">
                  {user?.role || 'Admin'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber to-brick flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-line overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-line bg-paper-dim">
                  <p className="text-sm font-semibold text-ink">{user?.name}</p>
                  <p className="text-xs text-ink/60">{user?.email}</p>
                </div>
                <div className="px-4 py-2">
                  {user?.role === 'admin' && <Link to="/users" onClick={() => setShowUserMenu(false)} className="block px-3 py-2 text-sm text-ink hover:bg-paper-dim rounded-lg">Manage users</Link>}
                  <Link to="/profile" onClick={() => setShowUserMenu(false)} className="block px-3 py-2 text-sm text-ink hover:bg-paper-dim rounded-lg">My profile</Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-brick hover:bg-brick/10 rounded-lg transition-colors font-medium flex items-center gap-2"
                  >
                    <span>🚪</span>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
