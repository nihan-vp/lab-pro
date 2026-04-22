import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Beaker, Trash2, Edit2, Upload, Download, FileSpreadsheet, Tag, Settings2, X, Check } from 'lucide-react';
import { api } from '../services/api';
import { Button, Input, Card, Modal, Badge, ConfirmationModal } from '../components/UI';
import { Test, Category } from '../types';
import { useAuth } from '../hooks/useAuth';
import Papa from 'papaparse';
import { cn } from '../utils/cn';

export default function Tests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCategoryConfirmOpen, setIsCategoryConfirmOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Category management states
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' });

  const [formData, setFormData] = useState({
    test_particulars: '',
    lab_test_id: '',
    categoryId: '',
    part_heading: 'Haematology',
    price: '',
    units: '',
    status: 'active',
    is_check: '0'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csvContent = "test_particulars,lab_test_id,part_heading,category,price,units,status,is_check\nComplete Blood Count,CBC,Haematology,Blood Tests,25.00,g/dL,active,0\nGlucose Fasting,GLU01,Biochemistry,Sugar Tests,15.50,mg/dL,active,0";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "test_import_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const importData = results.data;
          const res = await api.post('/api/tests/bulk-import', importData);
          alert(`Successfully imported ${res.count} tests.`);
          fetchTests();
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
          alert('Bulk import failed. Please check your CSV format.');
        }
      }
    });
  };

  const fetchTests = async () => {
    try {
      const testsData = await api.get('/api/tests');
      setTests(testsData);
      const categoriesData = await api.get('/api/categories');
      setCategories(categoriesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get('/api/categories');
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTest) {
        await api.put(`/api/tests/${editingTest.id}`, { ...formData, price: parseFloat(formData.price || '0') });
      } else {
        await api.post('/api/tests', { ...formData, price: parseFloat(formData.price || '0') });
      }
      setIsModalOpen(false);
      setEditingTest(null);
      setFormData({ 
        test_particulars: '', lab_test_id: '', categoryId: '', part_heading: 'Haematology', price: '', units: '', 
        status: 'active', is_check: '0'
      });
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
      test_particulars: test.test_particulars,
      lab_test_id: test.lab_test_id,
      categoryId: test.categoryId || '',
      part_heading: test.part_heading,
      price: test.price.toString(),
      units: test.units,
      status: test.status || 'active',
      is_check: test.is_check || '0'
    });
    setIsModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategoryId) {
        await api.put(`/api/categories/${editingCategoryId}`, categoryFormData);
      } else {
        await api.post('/api/categories', categoryFormData);
      }
      setCategoryFormData({ name: '', description: '' });
      setIsAddingCategory(false);
      setEditingCategoryId(null);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to save category');
    }
  };

  const handleCategoryDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await api.delete(`/api/categories/${categoryToDelete}`);
      setCategoryToDelete(null);
      setIsCategoryConfirmOpen(false);
      fetchTests(); // Refresh both tests and categories to ensure consistency
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const filteredTests = tests.filter(t => {
    const matchesSearch = (t.test_particulars || '').toLowerCase().includes(search.toLowerCase()) || 
                          (t.lab_test_id || '').toLowerCase().includes(search.toLowerCase()) ||
                          (t.part_heading || '').toLowerCase().includes(search.toLowerCase()) ||
                          (t.categoryName || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Laboratory Tests</h1>
          <p className="text-zinc-500">Add and manage medical test directory.</p>
        </div>
        {user?.role === 'admin' && (
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Tag className="h-4 w-4" />
              Categories
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={handleCsvImport} 
            />
            <Button 
              variant="outline" 
              onClick={downloadTemplate} 
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Template
            </Button>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()} 
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={() => {
              setEditingTest(null);
              setFormData({ 
                test_particulars: '', lab_test_id: '', categoryId: '', part_heading: 'Haematology', price: '', units: '', 
                status: 'active', is_check: '0'
              });
              setIsModalOpen(true);
            }} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Test
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input 
            className="pl-10" 
            placeholder="Search by test name, code or heading..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Tag className="h-4 w-4 text-zinc-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 sm:flex-none h-11 px-4 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
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
              <div className="flex flex-col items-end gap-1">
                <Badge variant="neutral" className="text-[10px] bg-zinc-100 text-zinc-600 border-none px-2 py-0.5">
                  {test.categoryName}
                </Badge>
                <Badge>{test.part_heading}</Badge>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-zinc-900">{test.test_particulars}</h3>
              <p className="text-sm font-mono text-zinc-500 uppercase">{test.lab_test_id}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="font-semibold text-zinc-400 uppercase">Unit</p>
                  <p className="text-zinc-900">{test.units}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-zinc-400 uppercase">Status</p>
                  <Badge variant={test.status === 'active' ? 'success' : 'neutral'} className="text-[10px] px-1.5 py-0">
                    {test.status?.toUpperCase()}
                  </Badge>
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
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Test Particulars</label>
            <Input required value={formData.test_particulars} onChange={e => setFormData({...formData, test_particulars: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Lab Test ID</label>
            <Input required value={formData.lab_test_id} onChange={e => setFormData({...formData, lab_test_id: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Category</label>
            <select
              required
              value={formData.categoryId}
              onChange={e => setFormData({...formData, categoryId: e.target.value})}
              className="w-full h-11 px-4 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-zinc-900"
            >
              <option value="" disabled>Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Part Heading</label>
            <Input required value={formData.part_heading} onChange={e => setFormData({...formData, part_heading: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Units</label>
            <Input required value={formData.units} onChange={e => setFormData({...formData, units: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Price ($)</label>
            <Input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          </div>
          
          <div className="col-span-2 pt-4">
            <Button type="submit" className="w-full">{editingTest ? "Update Laboratory Test" : "Create Laboratory Test"}</Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isCategoryModalOpen} 
        onClose={() => {
          setIsCategoryModalOpen(false);
          setIsAddingCategory(false);
          setEditingCategoryId(null);
          setCategoryFormData({ name: '', description: '' });
        }} 
        title="Category Management"
      >
        <div className="space-y-6">
          {(isAddingCategory || editingCategoryId) ? (
            <form onSubmit={handleCategorySubmit} className="space-y-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center justify-between">
                {editingCategoryId ? 'Edit Category' : 'New Category'}
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddingCategory(false);
                    setEditingCategoryId(null);
                    setCategoryFormData({ name: '', description: '' });
                  }}
                  className="text-zinc-400 hover:text-zinc-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </h3>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-zinc-500">Name</label>
                <Input 
                  required 
                  value={categoryFormData.name} 
                  onChange={e => setCategoryFormData({...categoryFormData, name: e.target.value})} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-zinc-500">Description</label>
                <Input 
                  value={categoryFormData.description} 
                  onChange={e => setCategoryFormData({...categoryFormData, description: e.target.value})} 
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1">
                  {editingCategoryId ? 'Update' : 'Create'} Category
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setEditingCategoryId(null);
                    setCategoryFormData({ name: '', description: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button 
              variant="outline" 
              className="w-full border-dashed border-2 py-6 gap-2"
              onClick={() => setIsAddingCategory(true)}
            >
              <Plus className="h-4 w-4" />
              Add New Category
            </Button>
          )}

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {categories.length === 0 ? (
              <p className="text-center py-8 text-zinc-500 text-sm italic">No categories created yet.</p>
            ) : categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white group hover:border-zinc-900 transition-all">
                <div>
                  <p className="font-bold text-zinc-900">{cat.name}</p>
                  {cat.description && <p className="text-xs text-zinc-500">{cat.description}</p>}
                </div>
                <div className="flex gap-2 transition-opacity duration-200">
                  <button 
                    onClick={() => {
                      setEditingCategoryId(cat.id);
                      setCategoryFormData({ name: cat.name, description: cat.description || '' });
                      setIsAddingCategory(true);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setCategoryToDelete(cat.id);
                      setIsCategoryConfirmOpen(true);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Test Definition"
        message="Are you sure you want to delete this test? This might affect existing bookings that include this test."
      />

      <ConfirmationModal
        isOpen={isCategoryConfirmOpen}
        onClose={() => setIsCategoryConfirmOpen(false)}
        onConfirm={handleCategoryDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? Any tests currently assigned to this category will be moved to 'Uncategorized'. This action cannot be undone."
      />
    </div>
  );
}
