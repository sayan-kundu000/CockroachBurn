import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import {
  Bug, Plus, Layers, User, LogOut, ChevronDown, Radio, Shield, Check, Settings, Sparkles
} from 'lucide-react';

export const Navbar = ({ onOpenCreateTicket, onOpenProjectModal, onOpenBugmardini }) => {
  const { user, logout, quickLoginAs, isAdmin } = useAuth();
    const { projects, activeProject, setActiveProject, wsConnected } = useProject();
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    return (
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
        {/* Left side: Brand + Project Switcher */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold text-lg">
              🐛
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                BugTracker
              </span>
              <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Pro
              </span>
            </div>
          </div>

          {/* Project Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="flex items-center space-x-2 text-sm font-medium bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg px-3 py-1.5 transition text-slate-200"
            >
              <Layers className="w-4 h-4 text-brand-400" />
              <span className="max-w-[140px] truncate">{activeProject?.name || "Select Project"}</span>
              {activeProject?.key && (
                <span className="text-xs bg-slate-700/60 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                  {activeProject.key}
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProjectDropdown && (
              <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Project
                </div>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProject(p);
                      setShowProjectDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-800/80 transition ${activeProject?.id === p.id ? 'text-brand-400 bg-brand-500/10' : 'text-slate-300'
                      }`}
                  >
                    <div className="truncate">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{p.key}</div>
                    </div>
                    {activeProject?.id === p.id && <Check className="w-4 h-4 text-brand-400 shrink-0" />}
                  </button>
                ))}

                <div className="border-t border-slate-800 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowProjectDropdown(false);
                      onOpenProjectModal();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-brand-400 hover:bg-slate-800 flex items-center space-x-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create / Manage Projects</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live sync indicator */}
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-mono text-[11px]">{wsConnected ? 'Live Sync' : 'Connecting...'}</span>
          </div>
        </div>

        {/* Right side: Role switcher + Create Issue + User profile */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Quick Role Tester Pills */}
          <div className="hidden xl:flex items-center bg-slate-800/80 border border-slate-700/60 rounded-lg p-0.5 text-xs">
            <span className="px-2 text-slate-400 text-[11px]">Test Role:</span>
            {['Admin', 'Developer', 'Viewer'].map((role) => (
              <button
                key={role}
                onClick={() => quickLoginAs(role)}
                className={`px-2 py-1 rounded font-medium transition ${user?.role === role
                    ? 'bg-brand-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Bugmardini AI Copilot Trigger */}
          <button
            onClick={onOpenBugmardini}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30 hover:from-purple-600/40 hover:to-pink-600/40 text-purple-200 border border-purple-500/40 shadow-sm transition active:scale-95"
            title="Open Bugmardini AI - The Bug Slayer (with Female Voice)"
          >
            <span className="text-sm">⚔️</span>
            <span className="hidden sm:inline">Bugmardini AI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
          </button>

          {/* Create Ticket Button (Disabled for Viewer role) */}
          <button
            onClick={onOpenCreateTicket}
            disabled={user?.role === 'Viewer'}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold shadow-md transition ${user?.role === 'Viewer'
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/20 active:scale-95'
              }`}
            title={user?.role === 'Viewer' ? 'Viewers cannot create tickets' : 'Create new issue'}
          >
            <Plus className="w-4 h-4" />
            <span>New Issue</span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-800 transition"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-inner"
                style={{ backgroundColor: user?.avatar_color || '#3b82f6' }}
              >
                {user?.username ? user.username.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left text-xs">
                <div className="font-semibold text-slate-200 leading-tight">{user?.full_name || user?.username}</div>
                <div className="text-[10px] text-brand-400 font-medium">{user?.role}</div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden md:block" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-50">
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="text-xs font-semibold text-slate-200">{user?.full_name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{user?.email}</div>
                  <div className="mt-1 inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-500/20 text-brand-400">
                    <Shield className="w-3 h-3" />
                    <span>{user?.role} Role</span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenProjectModal();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Project & Team Settings</span>
                  </button>
                </div>

                <div className="border-t border-slate-800 pt-1">
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  };

