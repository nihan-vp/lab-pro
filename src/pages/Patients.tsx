import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { api } from '../services/api';
import { Button, Input, Card, Modal, ConfirmationModal } from '../components/UI';
import { Patient } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    mobile: '',
    address: '',
    referredDoctor: ''
  });

  const fetchPatients = async () => {
    try {
      const data = await api.get('/api/patients');
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPatient) {
        await api.put(`/api/patients/${editingPatient.id}`, { ...formData, age: parseInt(formData.age) });
      } else {
        await api.post('/api/patients', { ...formData, age: parseInt(formData.age) });
      }
      setIsModalOpen(false);
      setEditingPatient(null);
      setFormData({ name: '', age: '', gender: 'Male', mobile: '', address: '', referredDoctor: '' });
      fetchPatients();
    } catch (err) {
      alert(`Failed to ${editingPatient ? 'update' : 'add'} patient`);
    }
  };

  const handleDelete = async () => {
    if (!patientToDelete) return;
    try {
      await api.delete(`/api/patients/${patientToDelete}`);
      setIsConfirmOpen(false);
      setPatientToDelete(null);
      fetchPatients();
    } catch (err) {
      alert('Failed to delete patient');
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      age: patient.age.toString(),
      gender: patient.gender,
      mobile: patient.mobile,
      address: patient.address || '',
      referredDoctor: patient.referredDoctor || ''
    });
    setIsModalOpen(true);
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.patientId.toLowerCase().includes(search.toLowerCase()) ||
    p.mobile.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Patients</h1>
          <p className="text-zinc-500">Manage and register patient records.</p>
        </div>
        <Button onClick={() => {
          setEditingPatient(null);
          setFormData({ name: '', age: '', gender: 'Male', mobile: '', address: '', referredDoctor: '' });
          setIsModalOpen(true);
        }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Patient
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input 
            className="pl-10" 
            placeholder="Search by name, ID or mobile..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-zinc-50 border-bottom border-zinc-100 italic">
            <tr>
              <th className="px-6 py-3 font-semibold text-zinc-600">Patient ID</th>
              <th className="px-6 py-3 font-semibold text-zinc-600">Name</th>
              <th className="px-6 py-3 font-semibold text-zinc-600">Age/Gender</th>
              <th className="px-6 py-3 font-semibold text-zinc-600">Mobile</th>
              <th className="px-6 py-3 font-semibold text-zinc-600">Created At</th>
              <th className="px-6 py-3 font-semibold text-zinc-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">Loading patients...</td></tr>
            ) : filteredPatients.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No patients found.</td></tr>
            ) : filteredPatients.map((patient) => (
              <tr key={patient.id} className="hover:bg-zinc-50 group">
                <td className="px-6 py-4 font-mono font-medium text-zinc-900">{patient.patientId}</td>
                <td className="px-6 py-4 font-medium text-zinc-900">{patient.name}</td>
                <td className="px-6 py-4 text-zinc-500">{patient.age} / {patient.gender}</td>
                <td className="px-6 py-4 text-zinc-500">{patient.mobile}</td>
                <td className="px-6 py-4 text-xs text-zinc-400">{new Date(patient.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleEdit(patient)}
                      className="text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => {
                          setPatientToDelete(patient.id);
                          setIsConfirmOpen(true);
                        }}
                        className="text-zinc-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPatient ? "Edit Patient Record" : "Register New Patient"}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Full Name</label>
            <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Age</label>
            <Input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Gender</label>
            <select 
              className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm"
              value={formData.gender}
              onChange={e => setFormData({...formData, gender: e.target.value})}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Mobile</label>
            <Input required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Referred Doctor</label>
            <Input value={formData.referredDoctor} onChange={e => setFormData({...formData, referredDoctor: e.target.value})} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Address</label>
            <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div className="col-span-2 pt-4">
            <Button type="submit" className="w-full">{editingPatient ? "Update Patient" : "Register Patient"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Patient Record"
        message="Are you sure you want to permanently delete this patient record? This action cannot be undone."
      />
    </div>
  );
}
