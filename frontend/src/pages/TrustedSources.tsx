import React, { useEffect, useState } from 'react';
import { 
  Users, UserPlus, Phone, MapPin, Building, ToggleLeft, ToggleRight,
  Edit3, Trash2, ArrowRight, Sparkles, Check, CheckCircle2, X
} from 'lucide-react';
import ApiService from '../services/api';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GlassBadge } from '../components/glass/GlassBadge';

interface TrustedSourcesProps {
  setActivePage?: (page: string) => void;
}

interface TrustedSource {
  source_id: number;
  user_id: number;
  agent_id?: number | null;
  name: string;
  phone: string;
  location: string;
  type: string;
  notes?: string | null;
  status: string;
}

const SOURCE_TYPES = [
  'Trusted Individual',
  'Another Mobile Money Agent',
  'Super Agent',
  'Financial Institution',
  'Other'
];

export const TrustedSources: React.FC<TrustedSourcesProps> = ({ setActivePage }) => {
  const [sources, setSources] = useState<TrustedSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Modal / Form state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [editingSource, setEditingSource] = useState<TrustedSource | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    type: 'Trusted Individual',
    notes: '',
    agent_id: null as number | null
  });
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const res = await ApiService.getTrustedSources();
      setSources(res);
    } catch (e) {
      console.error('Failed to load trusted sources', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSource(null);
    setFormData({
      name: '',
      phone: '',
      location: '',
      type: 'Trusted Individual',
      notes: '',
      agent_id: null
    });
    setErrorMsg(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (src: TrustedSource) => {
    setEditingSource(src);
    setFormData({
      name: src.name,
      phone: src.phone,
      location: src.location,
      type: src.type,
      notes: src.notes || '',
      agent_id: src.agent_id || null
    });
    setErrorMsg(null);
    setIsOpen(true);
  };

  const handleToggleStatus = async (src: TrustedSource) => {
    try {
      const newStatus = src.status === 'active' ? 'inactive' : 'active';
      await ApiService.toggleTrustedSourceStatus(src.source_id, newStatus);
      setSuccessMsg(`Status updated successfully for ${src.name}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchSources();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Failed to update status.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!formData.name.trim()) {
      setErrorMsg('Name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Phone Number is required.');
      return;
    }
    if (!formData.location.trim()) {
      setErrorMsg('Location is required.');
      return;
    }

    try {
      if (editingSource) {
        await ApiService.updateTrustedSource(editingSource.source_id, formData);
        setSuccessMsg(`${formData.name} updated successfully.`);
      } else {
        await ApiService.createTrustedSource(formData);
        setSuccessMsg(`${formData.name} saved to your liquidity network.`);
      }
      setIsOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchSources();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Failed to save trusted source.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12 select-none text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-extrabold text-[var(--mf-text-primary)] tracking-tight">Liquidity Network</h3>
          <p className="text-xs text-[var(--mf-text-secondary)] mt-1">Manage private, trusted relationships to source physical cash or float when balances get tight.</p>
        </div>
        <GlassButton 
          variant="primary" 
          onClick={handleOpenAdd}
          className="px-4 py-2 font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 border-none flex items-center space-x-1.5"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Trusted Source</span>
        </GlassButton>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3.5 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="h-4.5 w-4.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : sources.length === 0 ? (
        <GlassPanel className="p-8 text-center space-y-3">
          <Users className="h-12 w-12 mx-auto text-white/30" />
          <h4 className="font-extrabold text-sm text-[var(--mf-text-primary)]">Your Liquidity Network is Empty</h4>
          <p className="text-xs text-[var(--mf-text-secondary)] max-w-md mx-auto leading-relaxed">
            Register your trusted partners, other agents, or super-agents. MobiFin will recall them to help bridge any projected liquidity shortfalls.
          </p>
          <GlassButton 
            variant="primary" 
            onClick={handleOpenAdd}
            className="px-4 py-2 font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 border-none mx-auto mt-2"
          >
            + Register First Partner
          </GlassButton>
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sources.map(src => {
            const isActive = src.status === 'active';
            return (
              <GlassCard 
                key={src.source_id} 
                className={`p-5 flex flex-col justify-between space-y-4 border-white/10 ${
                  isActive ? 'bg-white/5' : 'bg-white/2 opacity-60'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{src.name}</h4>
                      <div className="flex items-center space-x-1.5 mt-1.5 text-white/50 text-[10px] uppercase font-bold tracking-wider">
                        <Building className="h-3 w-3 text-sky-400" />
                        <span>{src.type}</span>
                      </div>
                    </div>
                    <GlassBadge variant={isActive ? 'success' : 'neutral'}>
                      {isActive ? 'Active Relationship' : 'Inactive'}
                    </GlassBadge>
                  </div>

                  <div className="space-y-1.5 text-xs text-white/80 pt-1">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3.5 w-3.5 text-white/40" />
                      <span className="font-mono">{src.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3.5 w-3.5 text-white/40" />
                      <span>{src.location}</span>
                    </div>
                  </div>

                  {src.notes && (
                    <p className="text-[11px] text-[var(--mf-text-secondary)] leading-relaxed italic bg-white/3 p-2 rounded-lg border border-white/5">
                      "{src.notes}"
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-3.5">
                  <div className="flex items-center space-x-1.5 text-xs">
                    <button
                      onClick={() => handleToggleStatus(src)}
                      className="flex items-center space-x-1 text-white hover:text-sky-300 transition cursor-pointer border-none bg-transparent"
                    >
                      {isActive ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-emerald-400" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Deactivate</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-white/40" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Activate</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex space-x-3.5">
                    <button
                      onClick={() => handleOpenEdit(src)}
                      className="text-[10px] text-sky-400 hover:text-sky-300 font-bold uppercase tracking-wider transition border-none bg-transparent cursor-pointer flex items-center space-x-1"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-scaleIn text-white">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white transition border-none bg-transparent cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <h4 className="font-extrabold text-base text-white">
                {editingSource ? 'Edit Trusted Source' : 'Register Trusted Source'}
              </h4>
              <p className="text-[11px] text-white/50 mt-0.5">
                Saved relationships will only be used operationally to help you rebalance holdings.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 bg-rose-500/20 border border-rose-500/30 text-rose-200 rounded-xl p-3 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Kwame Mensah"
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +233 24 111 2222"
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Location / City</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Accra Central"
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Relationship Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full text-xs bg-slate-900 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white"
                >
                  {SOURCE_TYPES.map(t => (
                    <option key={t} value={t} className="bg-slate-900 text-white">{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. Prefers morning transactions, charges standard float commission rate."
                  rows={2}
                  className="w-full text-xs bg-slate-950/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-emerald-450 text-white placeholder-white/30 resize-none"
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <GlassButton
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 font-bold text-xs uppercase tracking-wider border-white/10 hover:bg-white/5"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  type="submit"
                  variant="primary"
                  className="flex-1 py-2.5 font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 border-none"
                >
                  Save Source
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
