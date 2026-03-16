'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Settings, User, Lock, Save, Camera, Mail,
  AlertCircle, Check, Download, Bot, FileJson,
  BarChart3, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (session) fetchSettings();
  }, [session]);

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      setName(data.name || '');
      setBio(data.bio || '');
      setAvatar(data.avatar || '');
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, bio, avatar: avatar || undefined }),
    });
    if (res.ok) toast.success('Profile updated!');
    else toast.error('Failed to update');
    setLoading(false);
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) return;
    setLoading(true);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) { toast.success('Password changed!'); setCurrentPassword(''); setNewPassword(''); }
    else { const d = await res.json(); toast.error(d.error || 'Failed'); }
    setLoading(false);
  };

  const exportData = async (type: string) => {
    window.open(`/api/export?type=${type}`, '_blank');
    toast.success(`Exporting ${type}...`);
  };

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Settings className="w-16 h-16 text-dark-600 mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold mb-3">Sign In Required</h2>
        <Link href="/auth/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold mb-6">Settings</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'security', label: 'Security', icon: Lock },
          { id: 'export', label: 'Export Data', icon: Download },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-nexus-500/20 text-nexus-400 border border-nexus-500/30' : 'text-dark-400 hover:text-white hover:bg-dark-800/50'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-lg font-semibold">Edit Profile</h2>
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">Display Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" maxLength={50} />
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="textarea-field h-24" maxLength={300} />
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">Avatar URL</label>
            <input type="text" value={avatar} onChange={(e) => setAvatar(e.target.value)} className="input-field" placeholder="https://..." />
          </div>
          <button onClick={saveProfile} disabled={loading} className="btn-primary">
            <span className="flex items-center gap-2"><Save className="w-4 h-4" />{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">New Password (min 8 chars)</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" minLength={8} />
          </div>
          <button onClick={changePassword} disabled={loading || !currentPassword || !newPassword} className="btn-primary">
            <span className="flex items-center gap-2"><Shield className="w-4 h-4" />{loading ? 'Changing...' : 'Change Password'}</span>
          </button>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Export Your Data</h2>
          <p className="text-sm text-dark-400">Download your data in JSON format.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { type: 'posts', label: 'My Posts', icon: FileJson, desc: 'All your posts' },
              { type: 'bots', label: 'My Bots', icon: Bot, desc: 'Bot configurations' },
              { type: 'analytics', label: 'Analytics', icon: BarChart3, desc: 'Bot performance data' },
            ].map((item) => (
              <button key={item.type} onClick={() => exportData(item.type)}
                className="p-4 glass-card-hover text-left">
                <item.icon className="w-8 h-8 text-nexus-400 mb-2" />
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-dark-500">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
