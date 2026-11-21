import React, { useState, useEffect } from 'react';
import { projectsApi, usersApi } from '../services/api';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { X, Plus, Trash2, Users, Shield, Layers, AlertCircle, Check } from 'lucide-react';

export const ProjectModal = ({ onClose }) => {
  const { user, isAdmin } = useAuth();
  const { projects, activeProject, setActiveProject, fetchProjects, users } = useProject();
  const [tab, setTab] = useState('create'); // 'create' or 'members'

  // Create Project Form
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Team Management
  const [projectDetails, setProjectDetails] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberRole, setMemberRole] = useState('Developer');
  const [addingMember, setAddingMember] = useState(false);

  const loadProjectDetails = async () => {
    if (!activeProject) return;
    try {
      const res = await projectsApi.get(activeProject.id);
      setProjectDetails(res.data);
    } catch (err) {
      console.error('Failed to load project details', err);
    }
  };

  useEffect(() => {
    if (tab === 'members' && activeProject) {
      loadProjectDetails();
    }
  }, [tab, activeProject]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) {
      setError('Name and key are required');
      return;
    }

    try {
      setCreating(true);
      setError('');
      const res = await projectsApi.create({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || null,
      });

      await fetchProjects();
      setActiveProject(res.data);
      setName('');
      setKey('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Failed to create project', err);
      setError(err.response?.data?.detail || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      setAddingMember(true);
      await projectsApi.addMember(activeProject.id, {
        user_id: parseInt(selectedUserId, 10),
        role: memberRole,
      });
      setSelectedUserId('');
      await loadProjectDetails();
      await fetchProjects();
    } catch (err) {
      console.error('Failed to add member', err);
      alert(err.response?.data?.detail || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await projectsApi.removeMember(activeProject.id, userId);
      await loadProjectDetails();
      await fetchProjects();
    } catch (err) {
      console.error('Failed to remove member', err);
      alert(err.response?.data?.detail || 'Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-semibold text-slate-100">Project & Team Settings</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 pt-2">
          <button
            onClick={() => setTab('create')}
            className={`pb-3 text-xs font-semibold border-b-2 mr-6 transition ${
              tab === 'create'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            + Create New Project
          </button>
          <button
            onClick={() => setTab('members')}
            className={`pb-3 text-xs font-semibold border-b-2 transition ${
              tab === 'members'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Team Members ({activeProject?.key})
          </button>
        </div>

        {/* Tab: Create Project */}
        {tab === 'create' && (
          <form onSubmit={handleCreateProject} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. NextGen Web Portal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Project Key (2-6 chars) *
              </label>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="e.g. WEB, API, CORE"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Tickets in this project will be prefixed with this key (e.g. {key || 'PROJ'}-101)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Goals, team scope, and repository references..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-md transition"
              >
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        )}

        {/* Tab: Team Members */}
        {tab === 'members' && (
          <div className="p-6 space-y-5">
            {/* Add Member Form */}
            {(isAdmin || activeProject?.owner_id === user?.id) && (
              <form onSubmit={handleAddMember} className="bg-slate-850/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">Add Member to {activeProject?.name}</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">Select User...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.username}) - Global {u.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Developer">Developer</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addingMember || !selectedUserId}
                    className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow transition flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{addingMember ? 'Adding...' : 'Add Member'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Members List */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Current Members ({projectDetails?.members?.length || 0})
              </span>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {projectDetails?.members?.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
                        style={{ backgroundColor: m.user?.avatar_color || '#3b82f6' }}
                      >
                        {m.user?.username?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{m.user?.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.user?.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-brand-400 border border-brand-500/20">
                        {m.role}
                      </span>
                      {(isAdmin || activeProject?.owner_id === user?.id) && m.user_id !== activeProject?.owner_id && (
                        <button
                          onClick={() => handleRemoveMember(m.user_id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

