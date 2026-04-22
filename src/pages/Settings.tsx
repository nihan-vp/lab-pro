import React, { useState } from 'react';
import { Save, Building2, MapPin, Phone, Mail, FileText, Hash, FileSpreadsheet, Download, Upload } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { api } from '../services/api';
import { Button, Input, Card } from '../components/UI';
import Papa from 'papaparse';
import { useRef } from 'react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csvContent = "test_particulars,lab_test_id,part_heading,price,units,male_value,male_max_value,female_value,female_max_value,clinic_id,user_id,status,is_check\nComplete Blood Count,CBC,Haematology,25.00,g/dL,11.0,15.0,12.0,16.0,CL101,USR202,active,0\nGlucose Fasting,GLU01,Biochemistry,15.50,mg/dL,70,100,70,105,CL101,USR202,active,0";
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
          setLoading(true);
          const res = await api.post('/api/tests/bulk-import', results.data);
          alert(`Successfully imported ${res.count} tests.`);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
          alert('Bulk import failed. Please check your CSV format.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

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

        <Card className="p-8">
          <div className="flex items-center gap-2 mb-8 border-b border-zinc-100 pb-4">
             <FileSpreadsheet className="h-5 w-5 text-zinc-400" />
             <h2 className="text-lg font-bold text-zinc-900">Data Management</h2>
          </div>
          
          <div className="space-y-6">
            <div className="rounded-lg border border-zinc-100 p-6 bg-zinc-50/50">
              <h3 className="text-sm font-bold text-zinc-900 mb-2">Bulk Import Laboratory Tests</h3>
              <p className="text-sm text-zinc-500 mb-6">Import a directory of laboratory tests using a CSV file. Ensure your file matches the required template structure.</p>
              
              <div className="flex flex-wrap gap-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv" 
                  onChange={handleCsvImport} 
                />
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={downloadTemplate} 
                  className="flex items-center gap-2 bg-white"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
                <Button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload & Import CSV
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-amber-600 font-medium"> Note: Large imports may take a few moments to process. Do not refresh the page during the import.</p>
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
