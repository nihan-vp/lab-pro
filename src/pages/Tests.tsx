import React, { useEffect, useState } from 'react';
import { Plus, Search, Beaker, Trash2, Edit2 } from 'lucide-react';
import { api } from '../services/api';
import { Button, Input, Card, Modal, Badge, ConfirmationModal } from '../components/UI';
import { Test } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function Tests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Haematology',
    price: '',
    normalRange: '',
    unit: ''
  });

  const fetchTests = async () => {
    try {
      const data = await api.get('/api/tests');
      setTests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTest) {
        await api.put(`/api/tests/${editingTest.id}`, { ...formData, price: parseFloat(formData.price) });
      } else {
        await api.post('/api/tests', { ...formData, price: parseFloat(formData.price) });
      }
      setIsModalOpen(false);
      setEditingTest(null);
      setFormData({ name: '', code: '', category: 'Haematology', price: '', normalRange: '', unit: '' });
      fetchTests();
    } catch (err) {
      alert(`Failed to ${editingTest ? 'update' : 'add'} test`);
    }
  };

  const handleDelete = async () => {
    if (!testToDelete) return;
    try {
      await api.delete(`/api/tests/${testToDelete}`);
      setIsConfirmOpen(false);
      setTestToDelete(null);
      fetchTests();
    } catch (err) {
      alert('Failed to delete test');
    }
  };

  const handleEdit = (test: Test) => {
    setEditingTest(test);
    setFormData({
      name: test.name,
      code: test.code,
      category: test.category,
      price: test.price.toString(),
      normalRange: test.normalRange,
      unit: test.unit
    });
    setIsModalOpen(true);
  };

  const filteredTests = tests.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.code.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Laboratory Tests</h1>
          <p className="text-zinc-500">Add and manage medical test directory.</p>
        </div>
        {user?.role === 'admin' && (
          <Button onClick={() => {
            setEditingTest(null);
            setFormData({ name: '', code: '', category: 'Haematology', price: '', normalRange: '', unit: '' });
            setIsModalOpen(true);
          }} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Test
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input 
            className="pl-10" 
            placeholder="Search by test name, code or category..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-8 text-center text-zinc-500">Loading tests...</div>
        ) : filteredTests.length === 0 ? (
          <div className="col-span-full py-8 text-center text-zinc-500">No tests found.</div>
        ) : filteredTests.map((test) => (
          <Card key={test.id} className="group relative flex flex-col p-6 transition-all hover:bg-zinc-50">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                <Beaker className="h-5 w-5" />
              </div>
              <Badge>{test.category}</Badge>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-zinc-900">{test.name}</h3>
              <p className="text-sm font-mono text-zinc-500 uppercase">{test.code}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="font-semibold text-zinc-400 uppercase">Normal Range</p>
                  <p className="text-zinc-900">{test.normalRange}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-zinc-400 uppercase">Unit</p>
                  <p className="text-zinc-900">{test.unit}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4">
              <span className="text-lg font-bold text-zinc-900">${test.price.toFixed(2)}</span>
              {user?.role === 'admin' && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleEdit(test)}
                    className="text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setTestToDelete(test.id);
                      setIsConfirmOpen(true);
                    }}
                    className="text-sm font-medium text-zinc-400 hover:text-red-900 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTest ? "Edit Laboratory Test" : "Add New Laboratory Test"}>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Test Name</label>
            <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Test Code</label>
            <Input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Category</label>
            <Input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Price ($)</label>
            <Input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Unit</label>
            <Input required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Normal Range</label>
            <Input required value={formData.normalRange} onChange={e => setFormData({...formData, normalRange: e.target.value})} />
          </div>
          <div className="col-span-2 pt-4">
            <Button type="submit" className="w-full">{editingTest ? "Update Laboratory Test" : "Create Laboratory Test"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Test Definition"
        message="Are you sure you want to delete this test? This might affect existing bookings that include this test."
      />
    </div>
  );
}
