import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';
import { Menu, X, ChevronDown, LogOut, User, Bookmark, Shield, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on ESC
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [menuOpen]);

  const handleLogout = () => { logout(); setMenuOpen(false); navigate('/'); };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  const overlayLinkClass = ({ isActive }) =>
    `nav-overlay-link${isActive ? ' active' : ''}`;

  return (
    <>
      <nav className="bg-[var(--bg)] border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-[var(--primary)]">
              <span className="text-2xl">❓</span>
              <span className="hidden sm:inline">FAQ Portal</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/faqs" className={navLinkClass}>Browse</NavLink>
              <NavLink to="/leaderboard" className={navLinkClass}>Leaderboard</NavLink>
              {user && (
                <>
                  <NavLink to="/submit" className={navLinkClass}>Submit FAQ</NavLink>
                  <NavLink to="/feed" className={navLinkClass}>Feed</NavLink>
                </>
              )}
              {(user?.role === 'moderator' || user?.role === 'admin') && (
                <NavLink to="/mod" className={navLinkClass}>Mod Queue</NavLink>
              )}
              {user?.role === 'admin' && (
                <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1.5">

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="p-2 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Notification bell */}
              {user && <NotificationBell />}

              {/* User menu (desktop) */}
              {user ? (
                <div className="hidden md:block relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-[var(--surface)] transition-colors"
                  >
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <ChevronDown size={14} className="text-[var(--text-muted)]" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-[var(--border)]">
                        <p className="font-semibold text-sm truncate">{user.name}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                      </div>
                      {[
                        [User,       `/profile/${user.id}`,     'Profile'],
                        [Bookmark,   '/saved',                 'Saved FAQs'],
                        [User,       '/profile/edit',           'Edit Profile'],
                        ...(user.role === 'moderator' || user.role === 'admin' ? [[Shield, '/mod', 'Mod Queue']] : []),
                        ...(user.role === 'admin' ? [[LayoutDashboard, '/admin', 'Admin']] : []),
                      ].map(([Icon, to, label]) => (
                        <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface)]">
                          <Icon size={16} /> {label}
                        </Link>
                      ))}
                      <div className="border-t border-[var(--border)] py-1">
                        <button onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left">
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login" className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">Login</Link>
                  <Link to="/register"
                    className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity">
                    Sign up
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle menu"
                className="md:hidden p-2 rounded-md hover:bg-[var(--surface)] transition-colors"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      {menuOpen && (
        <div className="nav-overlay" onClick={(e) => { if (e.target === e.currentTarget) setMenuOpen(false); }}>
          <nav className="nav-overlay-inner" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-lg text-[var(--primary)]">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="p-1 rounded hover:bg-[var(--surface)]">
                <X size={20} />
              </button>
            </div>

            {/* User info */}
            {user && (
              <div className="flex items-center gap-3 px-2 mb-4 pb-4 border-b border-[var(--border)]">
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff&size=40`}
                  alt="" className="w-10 h-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Nav links */}
            <NavLink to="/faqs" onClick={() => setMenuOpen(false)} className={overlayLinkClass}>Browse FAQs</NavLink>
            <NavLink to="/leaderboard" onClick={() => setMenuOpen(false)} className={overlayLinkClass}>Leaderboard</NavLink>

            {user ? (
              <>
                <NavLink to="/submit" onClick={() => setMenuOpen(false)} className={overlayLinkClass}>Submit FAQ</NavLink>
                <NavLink to="/feed" onClick={() => setMenuOpen(false)} className={overlayLinkClass}>Activity Feed</NavLink>
                <NavLink to="/saved" onClick={() => setMenuOpen(false)} className={overlayLinkClass}>Saved FAQs</NavLink>
                <NavLink to={`/profile/${user.id}`} onClick={() => setMenuOpen(false)} className={overlayLinkClass}>Profile</NavLink>
                <NavLink to="/profile/edit" onClick={() => setMenuOpen(false)} className={overlayLinkClass}>Edit Profile</NavLink>
                {(user.role === 'moderator' || user.role === 'admin') && (
                  <NavLink to="/mod" onClick={() => setMenuOpen(false)} className={overlayLinkClass}>Mod Queue</NavLink>
                )}
                {user.role === 'admin' && (
                  <NavLink to="/admin" onClick={() => setMenuOpen(false)} className={overlayLinkClass}>Admin Dashboard</NavLink>
                )}
                <div className="mt-2 pt-2 border-t border-[var(--border)]">
                  <button onClick={handleLogout}
                    className="nav-overlay-link text-red-500 w-full text-left">
                    <span className="inline-flex items-center gap-2"><LogOut size={16} /> Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setMenuOpen(false)} className={overlayLinkClass}>Login</NavLink>
                <NavLink to="/register" onClick={() => setMenuOpen(false)} className={`${overlayLinkClass} bg-[var(--primary)] text-white font-semibold mt-2`}>Sign up</NavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
};

export default Navbar;