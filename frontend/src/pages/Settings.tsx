import React, { useState } from 'react';
import { User, Shield, Bell, Settings as SettingsIcon, Check } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [success, setSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      {/* Page Header */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">System Settings</h3>
        <p className="text-xs text-slate-500 mt-1">Manage your account profile, access controls, and notifications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Tabs */}
        <div className="md:col-span-1 flex flex-col space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile settings</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition ${
              activeTab === 'security'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Security & Roles</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition ${
              activeTab === 'notifications'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </button>
        </div>

        {/* Configurations Form */}
        <div className="md:col-span-3 premium-card bg-white space-y-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">Profile Configuration</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Display Name</label>
                  <input
                    type="text"
                    defaultValue="Kwame's Money Centre"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Primary Region</label>
                  <input
                    type="text"
                    defaultValue="Greater Accra"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-teal-500"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
                <input
                  type="email"
                  defaultValue="kwame@mobifin.ai"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg text-xs transition"
                >
                  Save Profile
                </button>
                {success && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center">
                    <Check className="h-4 w-4 mr-1" /> Profile saved successfully
                  </span>
                )}
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">RBAC System Information</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Your role boundaries are dictated by the API scopes issued at login. 
                Switching modes in the header simulates separate login events using pre-generated cryptographic tokens.
              </p>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Active Role Boundary</span>
                  <span className="font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded uppercase font-bold text-[10px]">Role-Controlled</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-600">Key Privilege Gating</span>
                  <span className="font-semibold text-teal-600">Enabled</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">Alert Configurations</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs p-1">
                  <div>
                    <span className="font-semibold text-slate-700 block">Liquidity Shortfall Alerts</span>
                    <span className="text-[10px] text-slate-400">Trigger warnings when expected e-float demand exceeds holdings.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-teal-600" />
                </div>
                <div className="flex items-center justify-between text-xs p-1">
                  <div>
                    <span className="font-semibold text-slate-700 block">Anomaly Detection Flags</span>
                    <span className="text-[10px] text-slate-400">Notify agents of unusual transaction values or frequencies.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-teal-600" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
