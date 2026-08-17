import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, ShieldAlert, BookOpen, User } from 'lucide-react';

const MobileBottomNav = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0f18]/95 backdrop-blur-lg border-t border-white/10 z-50 flex justify-around items-center px-2 pb-safe">
      <NavLink 
        to="/dashboard" 
        className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-forest-light' : 'text-gray-400 hover:text-white'}`}
      >
        <LayoutDashboard size={20} className="mb-1" />
        <span className="text-[10px] font-medium">Home</span>
      </NavLink>
      
      <NavLink 
        to="/advisor" 
        className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-forest-light' : 'text-gray-400 hover:text-white'}`}
      >
        <MessageSquare size={20} className="mb-1" />
        <span className="text-[10px] font-medium">Advisor</span>
      </NavLink>

      <NavLink 
        to="/risk" 
        className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-forest-light' : 'text-gray-400 hover:text-white'}`}
      >
        <ShieldAlert size={20} className="mb-1" />
        <span className="text-[10px] font-medium">Risk</span>
      </NavLink>

      <NavLink 
        to="/decision-history" 
        className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-forest-light' : 'text-gray-400 hover:text-white'}`}
      >
        <BookOpen size={20} className="mb-1" />
        <span className="text-[10px] font-medium">History</span>
      </NavLink>

      <NavLink 
        to="/settings" 
        className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors ${isActive ? 'text-forest-light' : 'text-gray-400 hover:text-white'}`}
      >
        <User size={20} className="mb-1" />
        <span className="text-[10px] font-medium">Profile</span>
      </NavLink>
    </div>
  );
};

export default MobileBottomNav;
