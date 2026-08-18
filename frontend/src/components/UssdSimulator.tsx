import React, { useEffect, useState } from 'react';
import { Smartphone, Send, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import ApiService from '../services/api';
import { GlassPanel } from './glass/GlassPanel';
import { GlassButton } from './glass/GlassButton';

export const UssdSimulator: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [inputVal, setInputVal] = useState<string>('');
  const [activeReq, setActiveReq] = useState<any | null>(null);
  const [simulatedScreen, setSimulatedScreen] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [screenState, setScreenState] = useState<'prompt' | 'success' | 'declined' | 'idle'>('idle');

  useEffect(() => {
    fetchRequests();
    
    // Add custom window event listener to update on new referrals
    const handleUpdate = () => {
      fetchRequests();
    };
    window.addEventListener('ussd_update', handleUpdate);
    return () => {
      window.removeEventListener('ussd_update', handleUpdate);
    };
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await ApiService.ussdGetPendingRequests();
      setRequests(res);
      if (res.length > 0) {
        const req = res[0];
        setActiveReq(req);
        setSimulatedScreen(
          `MobiFin / Forms Capital\n\n` +
          `Forms Capital is requesting permission to access your eligible financial history for credit assessment.\n\n` +
          `Requested amount:\n` +
          `GH₵${req.requested_amount?.toLocaleString()}\n\n` +
          `1. Approve\n` +
          `2. Decline`
        );
        setScreenState('prompt');
        setIsMinimized(false); // Automatically expand on new request!
      } else {
        setActiveReq(null);
        setSimulatedScreen('No pending USSD consent requests.\n\nSubmit a customer referral as an Agent to trigger a consent request.');
        setScreenState('idle');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReq) return;
    
    const choice = parseInt(inputVal.trim());
    if (choice !== 1 && choice !== 2) {
      alert('Please enter 1 to Approve or 2 to Decline.');
      return;
    }

    try {
      setLoading(true);
      const res = await ApiService.ussdConsentRespond(activeReq.referral_id, choice);
      if (choice === 1) {
        setSimulatedScreen('Consent granted successfully.\n\nForms Capital now has access to alternative financial profile.');
        setScreenState('success');
      } else {
        setSimulatedScreen('Consent declined.\n\nNo financial records shared.');
        setScreenState('declined');
      }
      setInputVal('');
      
      // Dispatch event to update the page components of status changes
      setTimeout(() => {
        window.dispatchEvent(new Event('ussd_update'));
      }, 500);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!activeReq) return;
    try {
      setLoading(true);
      await ApiService.ussdConsentRevoke(activeReq.referral_id);
      setSimulatedScreen('Consent revoked.\n\nForms Capital access blocked.');
      setScreenState('idle');
      setTimeout(() => {
        fetchRequests();
      }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 select-none max-w-xs w-72 animate-fadeIn font-mono">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-emerald-650 hover:bg-emerald-500 text-white rounded-full p-3.5 shadow-2xl flex items-center space-x-2 border border-white/10 transition"
        >
          <Smartphone className="h-5 w-5 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider">USSD Consent Simulator</span>
          {requests.length > 0 && (
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping absolute top-0.5 right-0.5" />
          )}
        </button>
      ) : (
        <GlassPanel className="p-4 border border-white/20 shadow-2xl space-y-3 relative bg-slate-950/95 backdrop-blur-lg">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <div className="flex items-center space-x-1.5">
              <Smartphone className="h-4.5 w-4.5 text-emerald-400" />
              <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest">DEMO USSD SIMULATION</span>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={fetchRequests} 
                className="text-white/40 hover:text-white transition border-none bg-transparent"
                title="Refresh requests"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setIsMinimized(true)}
                className="text-white/40 hover:text-white transition border-none bg-transparent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10px] text-emerald-400 min-h-[140px] whitespace-pre-wrap leading-relaxed select-text font-mono">
            {simulatedScreen}
          </div>

          {screenState === 'prompt' && activeReq && (
            <form onSubmit={handleResponseSubmit} className="flex space-x-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter 1 or 2"
                className="flex-1 text-[11px] bg-slate-900 border border-white/10 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-white placeholder-white/20 font-mono"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 border-none text-white rounded-lg px-3 flex items-center justify-center transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}

          {screenState === 'success' && (
            <div className="flex space-x-2">
              <GlassButton 
                onClick={handleRevoke}
                className="w-full py-1.5 font-bold text-[9px] border-rose-500/20 text-rose-300 hover:bg-rose-500/10 uppercase tracking-wider"
              >
                Revoke Consent
              </GlassButton>
            </div>
          )}

          {screenState === 'idle' && (
            <p className="text-[8.5px] text-white/40 italic leading-normal text-center">
              Awaiting next referral from agent dashboard.
            </p>
          )}
        </GlassPanel>
      )}
    </div>
  );
};
export default UssdSimulator;
