import React, { useState } from 'react';
import { GlassPanel } from '../components/glass/GlassPanel';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { Sparkles, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import ApiService from '../services/api';

interface AddBusinessLocationProps {
  onComplete: () => void;
  onBack: () => void;
}

const REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Eastern",
  "Central",
  "Northern",
  "Volta"
];

const AGENT_TYPES = ["Retailer", "Sub-Agent", "Super-Agent"];

export const AddBusinessLocation: React.FC<AddBusinessLocationProps> = ({ onComplete, onBack }) => {
  const [formData, setFormData] = useState({
    business_name: '',
    region: 'Greater Accra',
    city: '',
    specific_location: '',
    agent_type: 'Retailer',
    starting_cash: 2500,
    starting_float: 5000
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [addedLocation, setAddedLocation] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.startsWith('starting_') ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name.trim()) {
      setErrorMsg("Business Name is required.");
      return;
    }
    if (!formData.city.trim()) {
      setErrorMsg("City is required.");
      return;
    }
    if (!formData.specific_location.trim()) {
      setErrorMsg("Specific Location / Address is required.");
      return;
    }
    if (formData.starting_cash < 0 || formData.starting_float < 0) {
      setErrorMsg("Starting balances cannot be negative.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await ApiService.request<any>('/onboarding/business', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setAddedLocation(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add location. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchAndProceed = async () => {
    if (addedLocation) {
      try {
        await ApiService.request<any>(`/onboarding/active-location/${addedLocation.agent_id}`, {
          method: 'POST'
        });
        // Reload page to clear active caches and refresh all dashboard data to the new location context
        window.location.reload();
      } catch (err) {
        onComplete();
      }
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 select-none text-white my-8">
      {/* Back button */}
      {!addedLocation && (
        <button
          onClick={onBack}
          className="mb-6 flex items-center space-x-2 text-white/70 hover:text-white transition text-xs font-semibold cursor-pointer border-none bg-transparent"
        >
          <span>← Back to Dashboard</span>
        </button>
      )}

      <GlassPanel className="p-6 md:p-8 space-y-6 animate-fadeIn border-white/10 bg-slate-900/65 backdrop-blur-xl">
        {!addedLocation ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-white">Add a new business location</h2>
              <p className="text-xs text-white/60 mt-1">
                Expand your MobiFin workspace without creating another account.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/20 border border-rose-500/30 text-rose-200 rounded-xl p-3.5 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              {/* Business Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Business Name</label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Reginald Mobile Money"
                  className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition"
                  required
                />
              </div>

              {/* Region & City */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Region</label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition cursor-pointer"
                  >
                    {REGIONS.map(r => (
                      <option key={r} value={r} className="bg-slate-900 text-white">{r}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Kumasi"
                    className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition"
                    required
                  />
                </div>
              </div>

              {/* Specific Location / Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Specific Location / Address</label>
                <input
                  type="text"
                  name="specific_location"
                  value={formData.specific_location}
                  onChange={handleInputChange}
                  placeholder="e.g. Adum Market Square, block C"
                  className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition"
                  required
                />
              </div>

              {/* Agent Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Agent Type</label>
                <select
                  name="agent_type"
                  value={formData.agent_type}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition cursor-pointer"
                >
                  {AGENT_TYPES.map(t => (
                    <option key={t} value={t} className="bg-slate-900 text-white">{t}</option>
                  ))}
                </select>
              </div>

              {/* Starting Balances */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Starting Cash (GH₵)</label>
                  <input
                    type="number"
                    name="starting_cash"
                    value={formData.starting_cash}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Starting E-Float (GH₵)</label>
                  <input
                    type="number"
                    name="starting_float"
                    value={formData.starting_float}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition"
                  />
                </div>
              </div>
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full py-3.5 mt-4 font-bold flex items-center justify-center space-x-2 text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 border-none"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Adding Location...</span>
              ) : (
                <>
                  <span>Add Business Location</span>
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </GlassButton>
          </form>
        ) : (
          <div className="space-y-6 text-center animate-fadeIn">
            <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-full w-fit mx-auto border border-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-xl text-white">
                Business location added successfully.
              </h3>
              <p className="text-xs text-white/70">
                Your new branch location has been added to your MobiFin workspace.
              </p>
            </div>

            <GlassCard className="space-y-3 text-xs p-4 bg-white/5 border-white/10 text-white text-left">
              <div className="flex justify-between border-b border-white/10 pb-2 mb-2">
                <span className="text-white/70 font-semibold">Location ID:</span>
                <span className="font-mono text-emerald-450 font-bold uppercase tracking-wider">
                  {`MOB-LOC-${String(addedLocation.agent_id).padStart(4, '0')}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Business Name:</span>
                <span className="font-bold text-white">{addedLocation.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Location:</span>
                <span className="font-bold text-white">{addedLocation.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Agent Type:</span>
                <span className="font-bold text-white">{addedLocation.agent_type}</span>
              </div>
            </GlassCard>

            <GlassButton
              variant="primary"
              onClick={handleSwitchAndProceed}
              className="w-full font-bold py-3.5 flex items-center justify-center space-x-1.5 uppercase tracking-wider text-xs text-white bg-emerald-600 hover:bg-emerald-500 border-none"
            >
              <span>{`Switch to ${addedLocation.city || 'New Location'} →`}</span>
              <ArrowRight className="h-4 w-4" />
            </GlassButton>
          </div>
        )}
      </GlassPanel>
    </div>
  );
};
