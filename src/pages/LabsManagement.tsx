import React, { useEffect, useState } from 'react';
import { Building2, Plus, Search, Shield, Database, ShieldCheck, UserPlus, Key, RefreshCw, Loader2, CheckCircle2, Edit2, Trash2, Eye } from 'lucide-react';
import { api } from '../services/api';
import { Button, Input, Card, Modal, Badge, ConfirmationModal } from '../components/UI';

export default function LabsManagement() {
  const [labs, setLabs] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ type: '', id: '', title: '', message: '' });
  
  const [editingLabId, setEditingLabId] = useState<string | null>(null);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [viewingLab, setViewingLab] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const [labForm, setLabForm] = useState({
    name: '',
    dbUri: '',
    status: 'active'
  });

  const [adminForm, setAdminForm] = useState({
    username: '',
    password: '',
    name: '',
    labId: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [labsData, adminsData] = await Promise.all([
        api.get('/api/super/labs'),
        api.get('/api/super/admins')
      ]);
      setLabs(labsData);
      setAdmins(adminsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLabId) {
        await api.put(`/api/super/labs/${editingLabId}`, labForm);
      } else {
        await api.post('/api/super/labs', labForm);
      }
      setIsLabModalOpen(false);
      setEditingLabId(null);
      setLabForm({ name: '', dbUri: '', status: 'active' });
      fetchData();
    } catch (err) {
      alert('Failed to save lab');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAdminId) {
        await api.put(`/api/super/admins/${editingAdminId}`, adminForm);
      } else {
        await api.post('/api/super/admins', adminForm);
      }
      setIsAdminModalOpen(false);
      setEditingAdminId(null);
      setAdminForm({ username: '', password: '', name: '', labId: '' });
      fetchData();
    } catch (err) {
      alert('Failed to save admin');
    }
  };

  const handleSyncTests = async (labId: string) => {
    if (!confirm('This will copy the entire master test directory (500+ tests) to this lab. Continue?')) return;
    
    setSyncingId(labId);
    try {
      const res = await api.post(`/api/super/sync-tests/${labId}`, {});
      alert(`Successfully synchronized ${res.count} clinical tests to this laboratory.`);
    } catch (err: any) {
      alert(err.message || 'Synchronization failed. The lab may already have a directory.');
    } finally {
      setSyncingId(null);
    }
  };

  const openDeleteConfirm = (type: 'lab' | 'admin', id: string, name: string) => {
    setConfirmConfig({
      type,
      id,
      title: `Delete ${type === 'lab' ? 'Laboratory' : 'Administrator'}`,
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`
    });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (confirmConfig.type === 'lab') {
        await api.delete(`/api/super/labs/${confirmConfig.id}`);
      } else {
        await api.delete(`/api/super/admins/${confirmConfig.id}`);
      }
      setIsConfirmOpen(false);
      fetchData();
    } catch (err) {
      alert('Deletion failed');
    }
  };

  const openEditLab = (lab: any) => {
    setEditingLabId(lab._id);
    setLabForm({
      name: lab.name,
      dbUri: lab.dbUri || '',
      status: lab.status
    });
    setIsLabModalOpen(true);
  };

  const openEditAdmin = (admin: any) => {
    setEditingAdminId(admin._id);
    setAdminForm({
      username: admin.username,
      password: '', // Don't show password
      name: admin.name,
      labId: admin.labId?._id || admin.labId || ''
    });
    setIsAdminModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Platform Administration</h1>
          <p className="text-zinc-500">Manage laboratory instances and administrative access controls.</p>
        </div>
        <div className="flex gap-3">
           <Button onClick={() => {
             setEditingLabId(null);
             setLabForm({ name: '', dbUri: '', status: 'active' });
             setIsLabModalOpen(true);
           }} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Register New Lab
          </Button>
          <Button variant="outline" onClick={() => {
            setEditingAdminId(null);
            setAdminForm({ username: '', password: '', name: '', labId: '' });
            setIsAdminModalOpen(true);
          }} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Lab Admin
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Labs List */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Building2 className="h-5 w-5 text-zinc-400" />
            <h2 className="font-bold text-zinc-900">Registered Laboratories</h2>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-zinc-500">Loading instances...</p>
            ) : labs.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">No labs registered yet.</p>
            ) : labs.map(lab => (
              <Card key={lab._id} className="p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900">{lab.name}</h3>
                    <div className="flex items-center gap-2">
                      <Database className="h-3 w-3 text-zinc-400" />
                      <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[150px]">
                        {lab.dbUri ? lab.dbUri.replace(/:([^@]+)@/, ':****@') : 'Shared Master Database'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={lab.status === 'active' ? 'success' : 'neutral'}>
                    {lab.status.toUpperCase()}
                  </Badge>
                  
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setViewingLab(lab)} className="p-1 px-2 text-zinc-400 hover:text-zinc-900"><Eye className="h-4 w-4"/></button>
                    <button onClick={() => openEditLab(lab)} className="p-1 px-2 text-zinc-400 hover:text-zinc-900"><Edit2 className="h-4 w-4"/></button>
                    <button onClick={() => openDeleteConfirm('lab', lab._id, lab.name)} className="p-1 px-2 text-zinc-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 text-[10px] font-bold px-2 flex gap-1.5"
                    disabled={syncingId === lab._id}
                    onClick={() => handleSyncTests(lab._id)}
                  >
                    {syncingId === lab._id ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        SYNCING...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3" />
                        SYNC TESTS
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Admins List */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck className="h-5 w-5 text-zinc-400" />
            <h2 className="font-bold text-zinc-900">Laboratory Administrators</h2>
          </div>

          <div className="space-y-3">
            {loading ? (
               <p className="text-sm text-zinc-500">Loading authorities...</p>
            ) : admins.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">No lab admins assigned yet.</p>
            ) : admins.map(admin => (
              <Card key={admin._id} className="p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900">{admin.name}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-zinc-100 px-1.5 py-0.5 rounded font-mono text-[10px]">{admin.username}</span>
                      <span className="text-zinc-400">→</span>
                      <span className="text-zinc-600 font-medium">{admin.labId?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditAdmin(admin)} className="p-1 px-2 text-zinc-400 hover:text-zinc-900"><Edit2 className="h-4 w-4"/></button>
                    <button onClick={() => openDeleteConfirm('admin', admin._id, admin.name)} className="p-1 px-2 text-zinc-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                  </div>
                   <Badge className="bg-zinc-900 text-white border-none">ADMIN</Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Lab Creation/Edit Modal */}
      <Modal 
        isOpen={isLabModalOpen} 
        onClose={() => setIsLabModalOpen(false)} 
        title={editingLabId ? "Edit Laboratory Instance" : "Register New Laboratory Instance"}
      >
        <form onSubmit={handleCreateLab} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">Laboratory Name</label>
            <Input required value={labForm.name} onChange={e => setLabForm({...labForm, name: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
              <Database className="h-3 w-3" /> Dedicated MongoDB URI (Optional)
            </label>
            <Input 
              placeholder="mongodb+srv://..." 
              value={labForm.dbUri} 
              onChange={e => setLabForm({...labForm, dbUri: e.target.value})} 
            />
            <p className="text-[10px] text-zinc-400 italic font-medium">Leave blank to use the shared platform infrastructure.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">Operational Status</label>
            <select 
              className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm"
              value={labForm.status}
              onChange={e => setLabForm({...labForm, status: e.target.value})}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full">
              {editingLabId ? "Update Laboratory Registry" : "Initialize Laboratory Registry"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Admin Creation/Edit Modal */}
      <Modal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
        title={editingAdminId ? "Edit Laboratory Administrator" : "Provision Laboratory Administrator"}
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">Full Legal Name</label>
            <Input required value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">Login ID</label>
              <Input required value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                <Key className="h-3 w-3" /> Secure Password {editingAdminId && '(Leave blank to keep)'}
              </label>
              <Input required={!editingAdminId} type="password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">Assign to Laboratory</label>
            <select 
              className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm"
              required
              value={adminForm.labId}
              onChange={e => setAdminForm({...adminForm, labId: e.target.value})}
            >
              <option value="">Select Lab Instance...</option>
              {labs.map(l => (
                <option key={l._id} value={l._id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full">
              {editingAdminId ? "Update Administrative Authority" : "Grant Administrative Authority"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lab View Detail Modal */}
      <Modal isOpen={!!viewingLab} onClose={() => setViewingLab(null)} title="Laboratory Instance Details">
        {viewingLab && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Instance Name</p>
                <p className="font-bold text-zinc-900">{viewingLab.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Global UID</p>
                <p className="font-mono text-xs text-zinc-600">{viewingLab._id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Created Date</p>
                <p className="text-sm text-zinc-600">{new Date(viewingLab.createdAt).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</p>
                <Badge variant={viewingLab.status === 'active' ? 'success' : 'neutral'}>{viewingLab.status.toUpperCase()}</Badge>
              </div>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
               <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Database Resource</p>
               <p className="text-[11px] font-mono break-all text-zinc-700">{viewingLab.dbUri || 'Shared Platform Cluster'}</p>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setViewingLab(null)}>Close View</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
    </div>
  );
}
