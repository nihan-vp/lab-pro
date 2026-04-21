import React, { useEffect, useState } from 'react';
import { UserPlus, Shield, UserCog, Mail } from 'lucide-react';
import { api } from '../services/api';
import { Button, Input, Card, Modal, Badge, ConfirmationModal } from '../components/UI';

export default function StaffManagement() {
  const [staff, setStaff] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: ''
  });

  const fetchStaff = async () => {
    try {
      const data = await api.get('/api/staff');
      setStaff(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await api.put(`/api/staff/${editingStaff.id}`, formData);
      } else {
        await api.post('/api/staff', formData);
      }
      setIsModalOpen(false);
      setEditingStaff(null);
      setFormData({ name: '', username: '', password: '' });
      fetchStaff();
    } catch (err) {
      alert(`Failed to ${editingStaff ? 'update' : 'add'} staff member`);
    }
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;
    try {
      await api.delete(`/api/staff/${staffToDelete}`);
      setIsConfirmOpen(false);
      setStaffToDelete(null);
      fetchStaff();
    } catch (err) {
      alert('Failed to revoke access');
    }
  };

  const handleEdit = (member: any) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      username: member.username,
      password: '' // Keep empty unless changing
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Staff Management</h1>
          <p className="text-zinc-500">Manage lab assistants and their access levels.</p>
        </div>
        <Button onClick={() => {
          setEditingStaff(null);
          setFormData({ name: '', username: '', password: '' });
          setIsModalOpen(true);
        }} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-8 text-center text-zinc-500">Loading staff directory...</div>
        ) : staff.length === 0 ? (
          <div className="col-span-full py-12 text-center p-8 border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50">
            <UserCog className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-400">No Staff Assigned</h3>
            <p className="text-zinc-500 max-w-xs mx-auto text-sm">Create staff accounts to allow your team to manage patients and enter results.</p>
          </div>
        ) : staff.map((member) => (
          <Card key={member.id} className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 font-bold text-lg">
                {member.name?.[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-zinc-900">{member.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                  <Shield className="h-3 w-3" />
                  <span className="capitalize">{member.role}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-100">
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Mail className="h-4 w-4 text-zinc-400" />
                <span className="font-medium">@{member.username}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={() => handleEdit(member)} className="flex-1 text-xs px-2">Edit Account</Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStaffToDelete(member.id);
                  setIsConfirmOpen(true);
                }}
                className="flex-1 text-xs px-2 border-red-100 text-red-600 hover:bg-red-50"
              >
                Revoke Access
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStaff ? "Edit Staff Account" : "Create Staff Account"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Full Name</label>
            <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Username</label>
            <Input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="johndoe" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{editingStaff ? "New Password (leave blank to keep current)" : "Access Password"}</label>
            <Input required={!editingStaff} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full">{editingStaff ? "Update Account" : "Initialize Account"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Revoke Staff Access"
        message="Are you sure you want to revoke access for this staff member? They will be immediately signed out and unable to log back in."
      />
    </div>
  );
}
