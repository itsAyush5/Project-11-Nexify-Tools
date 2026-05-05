import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Key, User, LogOut, Clock,
  ChevronRight, BarChart3, Zap,
  LayoutDashboard
} from 'lucide-react';
import Profile from './Profile';

const API_BASE = 'http://localhost:5000/api';

export default function Dashboard({ user, onLogout }) {
  const [stats, setStats]           = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [loading, setLoading]       = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/user/dashboard`, { withCredentials: true });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDashboardData(); }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
      <Activity className="spin" size={32} color="#6366f1" />
    </div>
  );

  return (
    /* Use explicit inline grid, NOT the .grid CSS class (which is for format buttons) */
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.75rem', alignItems: 'start', minHeight: '600px' }}>

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="card"
        style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'sticky', top: 'calc(var(--navbar-h) + 1.5rem)' }}
      >
        {/* Console label */}
        <p style={{ margin: '0 0 0.75rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
          Console
        </p>

        <NavItem active={activeSubTab === 'overview'} icon={LayoutDashboard} label="Overview"    onClick={() => setActiveSubTab('overview')} />
        <NavItem active={activeSubTab === 'profile'}  icon={User}            label="Profile"     onClick={() => setActiveSubTab('profile')} />

        {/* Divider + logout */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.7rem',
              padding: '0.75rem', borderRadius: '8px', border: 'none',
              background: 'transparent', color: '#f87171',
              fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait">
          {activeSubTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              {/* Metric cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                <MetricCard icon={Zap}       label="Total Operations"  value={stats?.totalConversions ?? 0}      color="#6366f1" desc="Across all tools" />
                <MetricCard icon={Key}       label="API Keys Active"   value={stats?.activeKeys ?? 0}            color="#f59e0b" desc="Programmatic access" />
                <MetricCard icon={BarChart3} label="Activity Streak"   value={`${stats?.activityStreak ?? 0}d`} color="#22c55e" desc="Days in a row" />
              </div>

              {/* Recent Activity */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem', fontWeight: 700 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={15} color="#6366f1" />
                    </div>
                    Recent Activity
                  </h3>
                </div>

                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {['Action', 'File', 'Status', 'Time'].map(h => (
                          <th key={h} style={{ textAlign: h === 'Time' ? 'right' : 'left', padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(!stats?.history || stats.history.length === 0) && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.25)', fontSize: '0.875rem' }}>
                            No activity yet — start converting files to see history here.
                          </td>
                        </tr>
                      )}
                      {stats?.history?.map((log, i) => (
                        <tr
                          key={log.id}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', flexShrink: 0, display: 'inline-block' }} />
                              {log.action_type}
                            </span>
                          </td>
                          <td style={{ padding: '0.9rem 1rem', color: 'rgba(255,255,255,0.5)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.filename}</td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '99px', background: 'rgba(34,197,94,0.08)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.15)', fontWeight: 600 }}>
                              {log.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>
                            {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeSubTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Profile user={user} onLogout={onLogout} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ── Sub-components ── */

function NavItem({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '0.7rem',
        padding: '0.72rem 0.9rem', borderRadius: '8px', border: 'none',
        background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
        color: active ? '#a5b4fc' : 'rgba(255,255,255,0.45)',
        fontFamily: 'inherit', fontWeight: active ? 600 : 400, fontSize: '0.875rem',
        cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; } }}
    >
      <Icon size={17} />
      <span style={{ flex: 1 }}>{label}</span>
      {active && <ChevronRight size={14} />}
    </button>
  );
}

function MetricCard({ icon: Icon, label, value, color, desc }) {
  const rgbMap = {
    '#6366f1': '99,102,241',
    '#f59e0b': '245,158,11',
    '#22c55e': '34,197,94',
  };
  const rgb = rgbMap[color] || '99,102,241';

  return (
    <div
      className="card"
      style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}
    >
      {/* Ghost icon */}
      <div style={{ position: 'absolute', right: -8, top: -8, opacity: 0.04 }}>
        <Icon size={90} color={color} />
      </div>

      <div style={{
        width: 38, height: 38, borderRadius: '10px',
        background: `rgba(${rgb}, 0.1)`, border: `1px solid rgba(${rgb}, 0.18)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={19} color={color} />
      </div>

      <div>
        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.02em' }}>{label}</p>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0.2rem 0', fontFamily: 'Poppins, sans-serif' }}>{value}</div>
        <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>{desc}</p>
      </div>
    </div>
  );
}
