'use client';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const styles = {
  container: { maxWidth: 1200, margin: '0 auto', padding: 20 },
  header: { background: '#1a73e8', color: 'white', padding: '20px 30px', marginBottom: 20, borderRadius: 8 },
  card: { background: 'white', borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 },
  stat: { textAlign: 'center', padding: 20 },
  statNumber: { fontSize: 36, fontWeight: 'bold', color: '#1a73e8' },
  statLabel: { color: '#666', marginTop: 4 },
  btn: { padding: '8px 16px', borderRadius: 4, border: 'none', cursor: 'pointer', marginRight: 8, fontSize: 14 },
  btnPrimary: { background: '#1a73e8', color: 'white' },
  btnSuccess: { background: '#34a853', color: 'white' },
  btnDanger: { background: '#ea4335', color: 'white' },
  input: { padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd', width: '100%', marginBottom: 8, fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #eee', fontWeight: 600 },
  td: { padding: '10px 12px', borderBottom: '1px solid #eee' },
  badge: { padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  tabs: { display: 'flex', gap: 0, marginBottom: 20 },
  tab: { padding: '10px 20px', cursor: 'pointer', borderBottom: '2px solid transparent', background: 'none', border: 'none', fontSize: 15 },
  tabActive: { borderBottom: '2px solid #1a73e8', color: '#1a73e8', fontWeight: 600 },
  loginForm: { maxWidth: 400, margin: '100px auto', padding: 30 },
};

function StatusBadge({ status }) {
  const colors = {
    CREATED: '#2196f3', MATCHING: '#ff9800', DISPATCHED: '#9c27b0',
    ACCEPTED: '#4caf50', IN_PROGRESS: '#ff5722', COMPLETED: '#388e3c',
    CANCELLED: '#757575', FAILED: '#f44336',
    PENDING: '#ff9800', PENDING_MANUAL: '#e91e63', VERIFIED: '#4caf50', REJECTED: '#f44336',
  };
  return (
    <span style={{ ...styles.badge, background: colors[status] || '#999', color: 'white' }}>
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [pendingHelpers, setPendingHelpers] = useState([]);
  const [activeTasks, setActiveTasks] = useState([]);
  const [skills, setSkills] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: 'admin@helpinminutes.com', password: 'admin123' });
  const [error, setError] = useState('');

  const api = async (path, options = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message);
    }
    return res.json();
  };

  const login = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      });
      setToken(data.accessToken);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token, activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'dashboard') {
        const data = await api('/admin/dashboard');
        setDashboard(data);
      } else if (activeTab === 'helpers') {
        const data = await api('/admin/helpers/pending');
        setPendingHelpers(data.items || []);
      } else if (activeTab === 'tasks') {
        const data = await api('/admin/tasks/active');
        setActiveTasks(data.items || []);
      } else if (activeTab === 'skills') {
        const data = await api('/admin/skills');
        setSkills(data);
      }
    } catch (err) {
      console.error('Load error:', err);
    }
  };

  const approveHelper = async (helperId, action) => {
    try {
      await api(`/admin/helpers/${helperId}/kyc`, {
        method: 'POST',
        body: JSON.stringify({ action, reason: action === 'reject' ? 'Documents unclear' : '' }),
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!token) {
    return (
      <div style={styles.loginForm}>
        <div style={styles.card}>
          <h2 style={{ textAlign: 'center', color: '#1a73e8' }}>🚀 helpInMinutes</h2>
          <h3 style={{ textAlign: 'center', color: '#666' }}>Admin Login</h3>
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          <form onSubmit={login}>
            <input style={styles.input} type="email" placeholder="Email" value={loginForm.email}
              onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
            <input style={styles.input} type="password" placeholder="Password" value={loginForm.password}
              onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
            <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary, width: '100%', padding: 12, marginTop: 8 }}>
              Login
            </button>
          </form>
          <p style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 16 }}>
            Default: admin@helpinminutes.com / admin123
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>🚀 helpInMinutes Admin</h1>
          <button style={{ ...styles.btn, background: 'rgba(255,255,255,0.2)', color: 'white' }}
            onClick={() => setToken(null)}>Logout</button>
        </div>
      </div>

      <div style={styles.container}>
        <div style={styles.tabs}>
          {['dashboard', 'helpers', 'tasks', 'skills'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && dashboard && (
          <div>
            <div style={styles.grid}>
              <div style={{ ...styles.card, ...styles.stat }}>
                <div style={styles.statNumber}>{dashboard.totalBuyers}</div>
                <div style={styles.statLabel}>Total Buyers</div>
              </div>
              <div style={{ ...styles.card, ...styles.stat }}>
                <div style={styles.statNumber}>
                  {dashboard.helpers?.reduce((sum, h) => sum + parseInt(h.count), 0) || 0}
                </div>
                <div style={styles.statLabel}>Total Helpers</div>
              </div>
              <div style={{ ...styles.card, ...styles.stat }}>
                <div style={styles.statNumber}>
                  {dashboard.tasks?.reduce((sum, t) => sum + parseInt(t.count), 0) || 0}
                </div>
                <div style={styles.statLabel}>Total Tasks</div>
              </div>
              <div style={{ ...styles.card, ...styles.stat }}>
                <div style={styles.statNumber}>₹{dashboard.payments?.totalRevenue || 0}</div>
                <div style={styles.statLabel}>Revenue</div>
              </div>
            </div>

            <div style={styles.card}>
              <h3>Task Status Breakdown</h3>
              {dashboard.tasks?.map(t => (
                <div key={t.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <StatusBadge status={t.status} />
                  <span>{t.count}</span>
                </div>
              ))}
            </div>

            <div style={styles.card}>
              <h3>Helper KYC Status</h3>
              {dashboard.helpers?.map(h => (
                <div key={h.kyc_status} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <StatusBadge status={h.kyc_status} />
                  <span>{h.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'helpers' && (
          <div style={styles.card}>
            <h3>Pending KYC Approvals</h3>
            {pendingHelpers.length === 0 ? (
              <p style={{ color: '#999' }}>No pending approvals</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingHelpers.map(h => (
                    <tr key={h.id}>
                      <td style={styles.td}>{h.name}</td>
                      <td style={styles.td}>{h.email}</td>
                      <td style={styles.td}>{h.phone}</td>
                      <td style={styles.td}><StatusBadge status={h.kyc_status} /></td>
                      <td style={styles.td}>
                        <button style={{ ...styles.btn, ...styles.btnSuccess }} onClick={() => approveHelper(h.id, 'approve')}>
                          Approve
                        </button>
                        <button style={{ ...styles.btn, ...styles.btnDanger }} onClick={() => approveHelper(h.id, 'reject')}>
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div style={styles.card}>
            <h3>Active Tasks</h3>
            {activeTasks.length === 0 ? (
              <p style={{ color: '#999' }}>No active tasks</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Buyer</th>
                    <th style={styles.th}>Helper</th>
                    <th style={styles.th}>Skill</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTasks.map(t => (
                    <tr key={t.id}>
                      <td style={styles.td}>{t.title}</td>
                      <td style={styles.td}>{t.buyer_name}</td>
                      <td style={styles.td}>{t.helper_name || '-'}</td>
                      <td style={styles.td}>{t.sub_skill_name || '-'}</td>
                      <td style={styles.td}><StatusBadge status={t.status} /></td>
                      <td style={styles.td}>{new Date(t.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'skills' && skills && (
          <div style={styles.card}>
            <h3>Skill Taxonomy ({skills.categories?.length} categories, {skills.skills?.length} skills, {skills.subSkills?.length} sub-skills)</h3>
            {skills.categories?.map(cat => (
              <div key={cat.id} style={{ marginBottom: 16 }}>
                <h4 style={{ color: '#1a73e8' }}>📁 {cat.name}</h4>
                {skills.skills?.filter(s => s.category_id === cat.id).map(skill => (
                  <div key={skill.id} style={{ marginLeft: 20, marginBottom: 8 }}>
                    <strong>🔧 {skill.name}</strong>
                    <div style={{ marginLeft: 20 }}>
                      {skills.subSkills?.filter(ss => ss.skill_id === skill.id).map(ss => (
                        <div key={ss.id} style={{ padding: '2px 0', color: '#555' }}>
                          • {ss.name} {ss.avg_base_rate > 0 && <span style={{ color: '#999' }}>(₹{ss.avg_base_rate})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
