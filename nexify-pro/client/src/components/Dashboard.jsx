import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Key, Shield, User, LogOut, Clock, 
  ChevronRight, BarChart3, Cloud, Filter, 
  LayoutDashboard, Settings, FileText, Zap, LucideFileText
} from 'lucide-react';
import Profile from './Profile';

const API_BASE = 'http://localhost:5000/api';

export default function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' or 'keys'
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/user/dashboard`, { withCredentials: true });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <Activity className="spin" size={32} color="#6366f1"/>
    </div>
  );

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 3fr', gap: '2rem', minHeight: '600px' }}>
      
      {/* Sidebar Navigation */}
      <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
           <h4 style={{ margin: 0, fontSize: '0.8rem', opacity: 0.4, letterSpacing: '0.1rem', textTransform: 'uppercase' }}>Console</h4>
        </div>
        
        <NavItem active={activeSubTab === 'overview'} icon={LayoutDashboard} label="Overview" onClick={() => setActiveSubTab('overview')} />
        <NavItem active={activeSubTab === 'keys'} icon={Key} label="API / Keys" onClick={() => setActiveSubTab('keys')} />
        
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={onLogout} className="btn" style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', color: '#f87171', border: 'none', padding: '0.75rem 1rem' }}>
            <LogOut size={18}/> Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {activeSubTab === 'overview' ? (
          <>
            {/* Header / Metrics */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <MetricCard 
                icon={Zap} 
                label="Total Operations" 
                value={stats?.totalConversions || 0} 
                color="#6366f1" 
                desc="Active across all tools"
              />
              <MetricCard 
                icon={Key} 
                label="API Keys" 
                value={stats?.activeKeys || 0} 
                color="#f59e0b" 
                desc="Programmatic access"
              />
              <MetricCard 
                icon={BarChart3} 
                label="Active Streak" 
                value={`${stats?.activityStreak || 0} Days`} 
                color="#22c55e" 
                desc="Consistent productivity"
              />
            </div>

            {/* Recent Activity Table */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Clock size={20} color="#6366f1"/> Recent Activity
                </h3>
              </div>
              
              <div style={{ overflow: 'hidden', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ textAlign: 'left', padding: '1rem' }}>Action</th>
                      <th style={{ textAlign: 'left', padding: '1rem' }}>Resource</th>
                      <th style={{ textAlign: 'left', padding: '1rem' }}>Status</th>
                      <th style={{ textAlign: 'right', padding: '1rem' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.history?.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', opacity: 0.4 }}>No activity found yet. Start converting!</td>
                      </tr>
                    )}
                    {stats?.history?.map((log, i) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                             <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }}/>
                             {log.action_type}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', opacity: 0.6, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.filename}</td>
                        <td style={{ padding: '1rem' }}>
                           <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>
                             {log.status}
                           </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', opacity: 0.4, fontSize: '0.8rem' }}>
                           {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <Profile user={user} onLogout={onLogout} />
        )}

      </motion.div>
    </div>
  );
}

function NavItem({ active, icon: Icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.8rem 1rem',
        borderRadius: '8px',
        border: 'none',
        background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: active ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
        cursor: 'pointer',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.2s',
        textAlign: 'left'
      }}
    >
      <Icon size={18} />
      <span style={{ flex: 1 }}>{label}</span>
      {active && <ChevronRight size={14} />}
    </button>
  );
}

function MetricCard({ icon: Icon, label, value, color, desc }) {
  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05 }}>
        <Icon size={80} color={color}/>
      </div>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `rgba(${color === '#6366f1' ? '99,102,241' : color === '#f59e0b' ? '245,158,11' : '34,197,94'}, 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color}/>
      </div>
      <div>
        <h4 style={{ margin: 0, opacity: 0.5, fontSize: '0.8rem', fontWeight: 500 }}>{label}</h4>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.2rem 0' }}>{value}</div>
        <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.3 }}>{desc}</p>
      </div>
    </div>
  );
}
