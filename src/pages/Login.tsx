import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button, Input, Card } from '../components/UI';
import { api } from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await api.post('/api/auth/login', { username, password });
      login(data.token, data.user);
      if (data.user.role === 'superadmin') {
        navigate('/super/labs');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50">
            <FlaskConical className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">BioLab Pro</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to manage your laboratory</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Username</label>
            <Input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Enter username"
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Password</label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter password"
              required 
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <Button type="submit" className="w-full h-10" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 border-t border-zinc-100 pt-6 text-center">
          <p className="text-xs text-zinc-400">
            Forgot password? Please contact your administrator.
          </p>
        </div>
      </Card>
    </div>
  );
}
