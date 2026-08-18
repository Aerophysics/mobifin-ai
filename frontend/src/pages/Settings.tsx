import React, { useState } from 'react';
import { User, Shield, Bell, Check } from 'lucide-react';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [success, setSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn pb-8">
      {/* Page Header */}
      <div>
        <h3 className="text-xl font-bold text-[var(--mf-text-primary)] tracking-tight">System Settings</h3>
        <p className="text-xs text-[var(--mf-text-secondary)] mt-1">Manage your account profile, access controls, and notifications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 lg:gap-0 lg:space-y-1 pb-3 lg:pb-0 border-b border-[var(--mf-border)] lg:border-none">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-shrink-0 flex items-center space-x-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-left transition border-none cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[var(--mf-accent)] text-white'
                : 'text-[var(--mf-text-secondary)] hover:bg-white/5 hover:text-[var(--mf-text-primary)] bg-transparent'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile settings</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-shrink-0 flex items-center space-x-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-left transition border-none cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[var(--mf-accent)] text-white'
                : 'text-[var(--mf-text-secondary)] hover:bg-white/5 hover:text-[var(--mf-text-primary)] bg-transparent'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Security & Roles</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-shrink-0 flex items-center space-x-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl text-left transition border-none cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-[var(--mf-accent)] text-white'
                : 'text-[var(--mf-text-secondary)] hover:bg-white/5 hover:text-[var(--mf-text-primary)] bg-transparent'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </button>
        </div>

        {/* Configurations Form */}
        <GlassPanel className="lg:col-span-3 p-6 space-y-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--mf-text-primary)] border-b border-[var(--mf-border)] pb-2.5">Profile Configuration</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--mf-text-secondary)] uppercase tracking-widest block mb-1">Display Name</label>
                  <input
                    type="text"
                    defaultValue="Kwame's Money Centre"
                    className="w-full text-xs bg-white/5 border border-[var(--mf-border)] rounded-xl p-3 focus:outline-none focus:border-[var(--mf-accent)] text-[var(--mf-text-primary)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--mf-text-secondary)] uppercase tracking-widest block mb-1">Primary Region</label>
                  <input
                    type="text"
                    defaultValue="Greater Accra"
                    className="w-full text-xs bg-white/5 border border-[var(--mf-border)] rounded-xl p-3 focus:outline-none focus:border-[var(--mf-accent)] text-[var(--mf-text-primary)]"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--mf-text-secondary)] uppercase tracking-widest block mb-1">Email Address</label>
                <input
                  type="email"
                  defaultValue="kwame@mobifin.ai"
                  className="w-full text-xs bg-white/5 border border-[var(--mf-border)] rounded-xl p-3 focus:outline-none focus:border-[var(--mf-accent)] text-[var(--mf-text-primary)]"
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <GlassButton
                  type="submit"
                  variant="primary"
                  className="px-4 py-2 font-bold text-xs uppercase tracking-wider"
                >
                  Save Profile
                </GlassButton>
                {success && (
                  <span className="text-xs text-emerald-500 font-semibold flex items-center">
                    <Check className="h-4 w-4 mr-1" /> Profile saved successfully
                  </span>
                )}
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--mf-text-primary)] border-b border-[var(--mf-border)] pb-2.5">RBAC System Information</h4>
              <p className="text-xs text-[var(--mf-text-secondary)] leading-normal">
                Your role boundaries are dictated by the API scopes issued at login. 
                Switching modes in the header simulates separate login events using pre-generated cryptographic tokens.
              </p>
              <div className="bg-white/5 border border-[var(--mf-border)] p-4 rounded-xl space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-[var(--mf-text-secondary)]">Active Role Boundary</span>
                  <span className="font-mono bg-white/10 text-[var(--mf-text-primary)] px-2 py-0.5 rounded uppercase font-bold text-[10px]">Role-Controlled</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[var(--mf-text-secondary)]">Key Privilege Gating</span>
                  <span className="font-semibold text-emerald-500">Enabled</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--mf-text-primary)] border-b border-[var(--mf-border)] pb-2.5">Alert Configurations</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs p-1">
                  <div>
                    <span className="font-semibold text-[var(--mf-text-primary)] block">Liquidity Shortfall Alerts</span>
                    <span className="text-[10px] text-[var(--mf-text-secondary)]">Trigger warnings when expected e-float demand exceeds holdings.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--mf-accent)]" />
                </div>
                <div className="flex items-center justify-between text-xs p-1">
                  <div>
                    <span className="font-semibold text-[var(--mf-text-primary)] block">Anomaly Detection Flags</span>
                    <span className="text-[10px] text-[var(--mf-text-secondary)]">Notify agents of unusual transaction values or frequencies.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--mf-accent)]" />
                </div>
              </div>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
};

export default Settings;
