import React, { useState } from 'react';
import { Save, Building2, MapPin, Phone, Mail, FileText, Hash } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { api } from '../services/api';
import { Button, Input, Card } from '../components/UI';

export default function Settings() {
  const { settings, refreshSettings } = useSettings();
  const [formData, setFormData] = useState(settings || {
    labName: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    reportFooter: '',
    billPrefix: '',
    reportPrefix: ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/settings', formData);
      await refreshSettings();
      alert('Settings updated successfully');
    } catch (err) {
      alert('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Lab Settings</h1>
        <p className="text-zinc-500">Global configurations for your laboratory operations.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-8">
          <div className="flex items-center gap-2 mb-8 border-b border-zinc-100 pb-4">
             <Building2 className="h-5 w-5 text-zinc-400" />
             <h2 className="text-lg font-bold text-zinc-900">General Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Laboratory Name</label>
              <Input value={formData.labName} onChange={e => setFormData({...formData, labName: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400"><Mail className="inline h-3 w-3 mr-1" /> Email Address</label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400"><Phone className="inline h-3 w-3 mr-1" /> Contact Number</label>
              <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400"><MapPin className="inline h-3 w-3 mr-1" /> Physical Address</label>
              <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
          </div>
        </Card>

        <Card className="p-8">
          <div className="flex items-center gap-2 mb-8 border-b border-zinc-100 pb-4">
             <Hash className="h-5 w-5 text-zinc-400" />
             <h2 className="text-lg font-bold text-zinc-900">Regional & Prefix Settings</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Bill Number Prefix</label>
              <Input value={formData.billPrefix} onChange={e => setFormData({...formData, billPrefix: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Report Number Prefix</label>
              <Input value={formData.reportPrefix} onChange={e => setFormData({...formData, reportPrefix: e.target.value})} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400"><FileText className="inline h-3 w-3 mr-1" /> Report Footer Disclaimer</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm"
                value={formData.reportFooter} 
                onChange={e => setFormData({...formData, reportFooter: e.target.value})}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="h-12 px-8 flex gap-2" disabled={loading}>
            <Save className="h-4 w-4" />
            {loading ? 'Saving Changes...' : 'Save Global Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
