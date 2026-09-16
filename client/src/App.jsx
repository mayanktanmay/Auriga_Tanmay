import { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, ArrowRight, Check, ChevronDown, CircleDollarSign, HandCoins, Plus, Receipt, Sparkles, Trash2, Upload, Users, X } from 'lucide-react';

const api = axios.create({ baseURL: '/api' });
const currency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function Setup({ onCreated }) {
  const [form, setForm] = useState({ name: '', targetAmount: '', organizer: '' });
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/pools', form);
      onCreated(data);
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      setError(backendMessage || (import.meta.env.DEV ? `API request failed: ${err.message}` : 'Could not create your pool.'));
    }
  };
  return <main className="setup-shell">
    <div className="setup-copy"><span className="eyebrow"><Sparkles size={14} /> GROUP EXPENSES, WITHOUT THE FUSS</span><h1>Keep the group<br /><em>in balance.</em></h1><p>One clear place for shared costs, contributions, and the final settle-up.</p><div className="setup-note"><span>01</span><span>Start a pool. Add your people. Let FairShare do the math.</span></div></div>
    <form className="setup-card" onSubmit={submit}><div className="brand-mark"><CircleDollarSign size={20} /><span>FairShare</span></div><div><h2>Create a pool</h2><p>Set up the shared expense you want to track.</p></div>
      <label>Pool name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Weekend in Goa" /></label>
      <label>Target amount<div className="input-prefix"><span>₹</span><input required type="number" min="0.01" step="0.01" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="0.00" /></div></label>
      <label>Organizer<input required value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} placeholder="Your name" /></label>
      {error && <div className="error-message">{error}</div>}<button className="button button-primary" type="submit">Create pool <ArrowRight size={17} /></button>
    </form>
  </main>;
}

function StatCard({ label, value, detail, tone = '' }) { return <div className={`stat-card ${tone}`}><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>; }

function ImportContributions({ poolId, onImported }) {
  const [text, setText] = useState('');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const { data } = await api.post(`/pools/${poolId}/import`, { text });
      setReport(data.report);
      setText('');
      onImported();
    } catch (err) {
      setReport(err.response?.data?.report || null);
      setError(err.response?.data?.message || 'Could not import contributions.');
    }
  };
  return <section className="panel import-panel"><div className="panel-heading"><div><span className="section-kicker"><Upload size={14} /> PAST CONTRIBUTIONS</span><h2>Import messy records</h2><p>Paste one <strong>name, amount</strong> per line. Rupees, commas, duplicates, and small name variations are cleaned automatically.</p></div></div><form className="import-form" onSubmit={submit}><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={'Rahul, ₹1,000\nrahul, 1000\nAman, Rs. 750\nNeha, not available'} rows="5" />{error && <div className="error-message">{error}</div>}<div className="import-footer"><span>Example: `Tanmay, 1,250.50`</span><button className="button button-primary small" type="submit">Clean and import <ArrowRight size={14} /></button></div></form>{report && <div className="import-report"><div className="report-heading"><strong>Import report</strong><span>{report.importedAmount ? `${currency(report.importedAmount)} added` : 'No new amount added'}</span></div><div className="report-stats"><span><b>{report.importedRows}</b> imported</span><span><b>{report.duplicateRows}</b> duplicates removed</span><span><b>{report.mergedNames.length}</b> names merged</span><span className={report.rejectedRows ? 'report-warning' : ''}><b>{report.rejectedRows}</b> rejected</span></div>{report.mergedNames.length > 0 && <div className="report-detail"><strong>Merged names</strong>{report.mergedNames.map((merge, index) => <span key={`${merge.from}-${index}`}>{merge.from} → {merge.to}</span>)}</div>}{report.rejected.length > 0 && <div className="report-detail report-rejected"><strong><AlertTriangle size={13} /> Rejected rows</strong>{report.rejected.map((row) => <span key={`${row.line}-${row.raw}`}>Line {row.line}: {row.reason}</span>)}</div>}</div>}</section>;
}

function MemberRow({ member, equalShare, onPayment, onEdit, onDelete }) {
  const [paid, setPaid] = useState(member.paid);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(member.name);
  useEffect(() => setPaid(member.paid), [member.paid]);
  const savePayment = () => { if (Number(paid) >= 0) onPayment(member.id, paid); };
  const saveName = () => { if (name.trim()) { onEdit(member.id, name); setEditing(false); } };
  return <div className="member-row"><div className="member-identity"><div className="avatar">{member.name.charAt(0).toUpperCase()}</div>{editing ? <input className="edit-name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveName()} autoFocus /> : <div><strong>{member.name}</strong><span>{member.balance >= 0 ? 'Should receive' : 'Needs to pay'} {currency(Math.abs(member.balance))}</span></div>}</div><div className="member-payment"><div className="paid-input"><span>₹</span><input type="number" min="0" step="0.01" value={paid} onChange={(e) => setPaid(e.target.value)} onBlur={savePayment} aria-label={`${member.name} paid`} /></div><span className={`balance ${member.balance >= 0 ? 'positive' : 'negative'}`}>{member.balance >= 0 ? '+' : '-'}{currency(Math.abs(member.balance))}</span><div className="row-actions">{editing ? <button onClick={saveName} title="Save name"><Check size={16} /></button> : <button onClick={() => setEditing(true)} title="Edit name">Edit</button>}<button onClick={() => onDelete(member.id)} title="Delete member"><Trash2 size={16} /></button></div></div></div>;
}

function Dashboard({ pool, setPool }) {
  const [summary, setSummary] = useState(null); const [settlements, setSettlements] = useState([]); const [newMember, setNewMember] = useState(''); const [selectedMember, setSelectedMember] = useState(''); const [importOpen, setImportOpen] = useState(false); const [error, setError] = useState('');
  const refresh = async () => { const [{ data: nextSummary }, { data: nextSettlements }] = await Promise.all([api.get(`/pools/${pool._id}/summary`), api.get(`/pools/${pool._id}/settlement`)]); setSummary(nextSummary); setSettlements(nextSettlements.settlements); };
  useEffect(() => { refresh().catch(() => setError('Could not load the pool.')); }, [pool._id]);
  const action = async (request) => { try { setError(''); await request(); await refresh(); } catch (err) { setError(err.response?.data?.message || 'Something went wrong.'); } };
  const addMember = (event) => { event.preventDefault(); if (!newMember.trim()) return; action(() => api.post(`/pools/${pool._id}/members`, { name: newMember })).then(() => setNewMember('')); };
  const generate = () => action(async () => { const { data } = await api.post(`/pools/${pool._id}/settlement`); setSettlements(data.settlements); });
  const selected = summary?.members.find((member) => member.id === selectedMember);
  if (!summary) return <div className="loading">Loading your pool...</div>;
  return <div className="app-shell"><header className="topbar"><div className="brand-mark"><CircleDollarSign size={20} /><span>FairShare</span></div><div className="pool-context"><span>POOL</span><strong>{pool.name}</strong><i /> <span>ORGANIZED BY {pool.organizer.toUpperCase()}</span></div><button className="icon-button" onClick={() => setPool(null)} title="Close pool"><X size={19} /></button></header><main className="dashboard"><section className="hero-row"><div><span className="eyebrow">YOUR SHARED EXPENSE</span><h1>{pool.name}</h1><p>Keep every contribution visible, then settle up in a few fair moves.</p></div><div className="hero-actions"><button className="button button-secondary import-button" onClick={() => setImportOpen(!importOpen)}><Upload size={15} /> {importOpen ? 'Close import' : 'Import past contributions'}</button><div className="progress-ring" style={{ '--progress': Math.min(summary.collectionPercentage, 100) }}><strong>{Math.min(summary.collectionPercentage, 100).toFixed(0)}<small>%</small></strong><span>collected</span></div></div></section>
    {error && <div className="error-message">{error}</div>}<section className="stats-grid"><StatCard label="Target amount" value={currency(summary.targetAmount)} detail="Total to collect" /><StatCard label="Total collected" value={currency(summary.totalCollected)} detail={`${summary.collectionPercentage.toFixed(1)}% of target`} tone="green" /><StatCard label="Remaining" value={currency(summary.remainingAmount)} detail="Still to collect" tone="orange" /><StatCard label="Equal share" value={currency(summary.equalShare)} detail="Per person" tone="blue" /></section>{importOpen && <ImportContributions poolId={pool._id} onImported={() => refresh().catch(() => setError('Import saved, but the summary could not be refreshed.'))} />}
    <div className="content-grid"><section className="panel members-panel"><div className="panel-heading"><div><span className="section-kicker"><Users size={14} /> PEOPLE</span><h2>Contributions</h2></div><span className="count-badge">{summary.members.length} {summary.members.length === 1 ? 'member' : 'members'}</span></div><div className="member-list">{summary.members.map((member) => <MemberRow key={member.id} member={member} equalShare={summary.equalShare} onPayment={(id, paid) => action(() => api.put(`/pools/${pool._id}/members/${id}/payment`, { paid }))} onEdit={(id, name) => action(() => api.put(`/pools/${pool._id}/members/${id}`, { name }))} onDelete={(id) => action(() => api.delete(`/pools/${pool._id}/members/${id}`))} />)}</div><form className="add-member" onSubmit={addMember}><input value={newMember} onChange={(e) => setNewMember(e.target.value)} placeholder="Add someone to the pool" /><button className="button button-secondary" type="submit"><Plus size={17} /> Add member</button></form></section>
    <aside className="side-column"><section className="panel owe-panel"><div className="section-kicker"><HandCoins size={14} /> QUICK CHECK</div><h2>How much do I owe?</h2><p>See a member's exact position against the equal share.</p><div className="select-wrap"><select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)}><option value="">Choose a member</option>{summary.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><ChevronDown size={17} /></div>{selected ? <div className={`owe-result ${selected.balance <= 0 ? 'owes' : 'receives'}`}><span>{selected.balance <= 0 ? `${selected.name} owes` : `${selected.name} should receive`}</span><strong>{currency(Math.abs(selected.balance))}</strong></div> : <div className="empty-result">Select a name to see the balance</div>}</section><section className="panel settle-panel"><div className="settle-title"><div className="section-kicker"><Receipt size={14} /> SETTLE UP</div><button className="button button-primary small" onClick={generate}>Generate settlement</button></div><h2>Suggested payments</h2><p>Minimum transfers to bring everyone even.</p>{settlements.length ? <div className="settlement-list">{settlements.map((item) => <div className={`settlement-item ${item.completed ? 'done' : ''}`} key={item._id}><div><strong>{item.from}</strong><ArrowRight size={15} /><strong>{item.to}</strong><span>{currency(item.amount)}</span></div><button onClick={() => action(() => api.patch(`/pools/${pool._id}/settlement/${item._id}`, { completed: !item.completed }))}>{item.completed ? <><Check size={14} /> Done</> : 'Mark paid'}</button></div>)}</div> : <div className="empty-settlement"><span>✦</span><p>Generate a settlement once everyone has added their contribution.</p></div>}</section></aside></div></main></div>;
}

export default function App() { const [pool, setPool] = useState(null); return pool ? <Dashboard pool={pool} setPool={setPool} /> : <Setup onCreated={setPool} />; }
