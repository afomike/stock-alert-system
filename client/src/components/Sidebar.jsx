import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'DB', end: true },
  { to: '/inventory', label: 'Inventory', icon: 'IN' },
  { to: '/suppliers', label: 'Suppliers', icon: 'SU' },
  { to: '/reports', label: 'Reports', icon: 'RP' },
  { to: '/alerts', label: 'Alerts', icon: 'AL' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-gradient-to-b from-ink via-ink-soft to-ink text-paper flex flex-col h-screen fixed inset-y-0 left-0 z-50 border-r border-white/5">
      <div className="px-6 py-8 border-b border-white/10 space-y-1">
        <div className="flex items-center gap-2 mb-2"><div className="w-10 h-10 bg-amber/20 rounded-lg flex items-center justify-center"><span className="font-mono text-xs text-amber">SW</span></div><p className="font-display text-lg font-bold tracking-tight">STOCKWATCH</p></div>
        <p className="font-mono text-xs text-paper/50 uppercase tracking-widest">Inventory System</p>
      </div>
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${isActive ? 'bg-amber/20 text-paper shadow-lg border-l-2 border-amber font-semibold' : 'text-paper/70 hover:text-paper hover:bg-white/5 border-l-2 border-transparent'}`}><span className="font-mono text-[10px] w-5 text-center">{item.icon}</span><span>{item.label}</span></NavLink>)}
      </nav>
      <div className="px-6 py-6 border-t border-white/10 space-y-3"><div><p className="font-mono text-xs uppercase tracking-widest text-paper/50 mb-1">System Status</p><div className="flex items-center gap-2 text-xs text-paper/70"><span className="w-2 h-2 bg-success rounded-full animate-pulse"></span><span>All Systems Operational</span></div></div><p className="font-mono text-xs text-paper/30">v1.0.0</p></div>
    </aside>
  );
}
