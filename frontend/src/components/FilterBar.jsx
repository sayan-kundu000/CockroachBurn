import React from 'react';
import { useProject } from '../context/ProjectContext';
import { Search, Filter, X, User, AlertCircle, CheckCircle2, Clock, Download } from 'lucide-react';

export const FilterBar = () => {
  const { filters, setFilters, users, tickets, activeProject } = useProject();

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      type: '',
      assignee_id: '',
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.priority || filters.type || filters.assignee_id
  );

  const bugCount = tickets.filter((t) => t.type === 'Bug').length;
  const inProgressCount = tickets.filter((t) => t.status === 'In Progress').length;
  const doneCount = tickets.filter((t) => t.status === 'Done').length;

  return (
    <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 md:px-6 py-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left side: Search and quick filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Keyword search */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search issues (title, key, desc)..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition"
            />
            {filters.search && (
              <button
                onClick={() => setFilters((p) => ({ ...p, search: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
            className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Types</option>
            <option value="Bug">🐛 Bug</option>
            <option value="Task">📋 Task</option>
            <option value="Feature">✨ Feature</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}
            className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Priorities</option>
            <option value="Urgent">🔴 Urgent</option>
            <option value="High">🟠 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={filters.assignee_id}
            onChange={(e) => setFilters((p) => ({ ...p, assignee_id: e.target.value }))}
            className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.username})
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 transition"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Right side: Quick stats badges & Export */}
        <div className="flex items-center space-x-2.5 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700/50">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Bugs: <strong className="text-slate-200">{bugCount}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700/50">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Active: <strong className="text-slate-200">{inProgressCount}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Done: <strong className="text-slate-200">{doneCount}</strong></span>
          </div>

          {activeProject && (
            <a
              href={`/api/tickets/export/${activeProject.id}?format=csv`}
              download
              className="flex items-center space-x-1 bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-white px-2.5 py-1 rounded-md border border-slate-700 transition"
              title="Export project tickets as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

