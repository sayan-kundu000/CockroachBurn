import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { Navbar } from '../components/Navbar';
import { FilterBar } from '../components/FilterBar';
import { KanbanBoard } from '../components/KanbanBoard';
import { TicketModal } from '../components/TicketModal';
import { CreateTicketModal } from '../components/CreateTicketModal';
import { ProjectModal } from '../components/ProjectModal';
import { BugmardiniModal } from '../components/BugmardiniModal';
import { Layers, Plus, Loader2 } from 'lucide-react';

export const BoardPage = () => {
  const { activeProject, loading, projects } = useProject();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showBugmardini, setShowBugmardini] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        onOpenCreateTicket={() => setShowCreateModal(true)}
        onOpenProjectModal={() => setShowProjectModal(true)}
        onOpenBugmardini={() => setShowBugmardini(true)}
      />

      {projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">No Projects Found</h2>
          <p className="text-sm text-slate-400 max-w-sm mb-6">
            Create your first software development project to track bugs, tasks, and features.
          </p>
          <button
            onClick={() => setShowProjectModal(true)}
            className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-2 rounded-xl text-sm shadow-lg shadow-brand-600/30 transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Project</span>
          </button>
        </div>
      ) : (
        <>
          <FilterBar />

          <main className="flex-1 flex flex-col overflow-hidden">
            {loading ? (
              <div className="flex-1 flex items-center justify-center space-x-2 text-slate-400 text-sm">
                <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                <span>Loading board...</span>
              </div>
            ) : (
              <KanbanBoard onSelectTicket={(t) => setSelectedTicket(t)} />
            )}
          </main>
        </>
      )}

      {/* Ticket Details / Edit Modal */}
      {selectedTicket && (
        <TicketModal
          ticketId={selectedTicket.id}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Project & Team Settings Modal */}
      {showProjectModal && (
        <ProjectModal onClose={() => setShowProjectModal(false)} />
      )}

      {/* Standalone Bugmardini AI Copilot Modal */}
      {showBugmardini && (
        <BugmardiniModal
          ticket={null}
          onClose={() => setShowBugmardini(false)}
        />
      )}
    </div>
  );
};

