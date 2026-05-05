import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, LogIn, User, Menu, X, ChevronDown } from 'lucide-react';

export default function Navbar({ user, onSignIn, onTabChange, activeTab, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { id: 'explore', label: 'Explore' },
    { id: 'convert', label: 'Convert' },
    { id: 'pdf',     label: 'PDF Tools' },
    { id: 'api',     label: 'API' },
    { id: 'docs',    label: 'Docs' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}
      >
        {/* Logo */}
        <div className="navbar-logo" onClick={() => onTabChange('home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/Nexify Tools.png" alt="Nexify Tools Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          <span className="logo-text" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'white', display: 'flex', alignItems: 'center' }}>
            Nexify <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '0.25rem' }}>Tools</span>
          </span>
        </div>

        {/* Center Nav Links */}
        <div className="navbar-links">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => onTabChange(link.id)}
              className={`nav-link ${activeTab === link.id ? 'nav-link-active' : ''}`}
            >
              {link.label}
              {activeTab === link.id && (
                <motion.div layoutId="nav-underline" className="nav-underline" />
              )}
            </button>
          ))}
        </div>

        {/* Right: Auth */}
        <div className="navbar-right">
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                className="user-pill"
                onClick={() => setUserMenuOpen(o => !o)}
              >
                <div className="user-avatar">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name?.split(' ')[0]}</span>
                <ChevronDown size={14} style={{ opacity: 0.5, transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="user-dropdown"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="user-dropdown-header">
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>{user.name}</p>
                      <p style={{ fontSize: '0.75rem', opacity: 0.45, margin: 0 }}>{user.email}</p>
                    </div>
                    <div className="user-dropdown-divider" />
                    <button className="user-dropdown-item" onClick={() => { onTabChange('account'); setUserMenuOpen(false); }}>
                      <User size={14} /> My Account
                    </button>
                    <button className="user-dropdown-item danger" onClick={() => { onLogout(); setUserMenuOpen(false); }}>
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button className="navbar-signin-btn" onClick={onSignIn}>
              <LogIn size={15} /> Sign In
            </button>
          )}

          {/* Mobile menu toggle */}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mobile-menu"
          >
            {navLinks.map(link => (
              <button key={link.id} className="mobile-menu-link" onClick={() => { onTabChange(link.id); setMobileOpen(false); }}>
                {link.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
