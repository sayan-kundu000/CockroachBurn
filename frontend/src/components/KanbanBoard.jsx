import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import {
  Bug, CheckSquare, Sparkles, MessageSquare, Paperclip, Clock,
  ArrowUp, ArrowDown, AlertOctagon, HelpCircle, GripVertical
} from 'lucide-react';

const COLUMNS = [
  { id: 'Backlog', label: 'Backlog', color: 'border-slate-700/60', badgeColor: 'bg-slate-800 text-slate-300' },
  { id: 'To Do', label: 'To Do', color: 'border-blue-500/30', badgeColor: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  { id: 'In Progress', label: 'In Progress', color: 'border-amber-500/30', badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  { id: 'In Review', label: 'In Review', color: 'border-purple-500/30', badgeColor: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  { id: 'Done', label: 'Done', color: 'border-emerald-500/30', badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
];

export const KanbanBoard = ({ onSelectTicket }) => {
  const { tickets, moveTicketStatus } = useProject();
  const { isViewer } = useAuth();

  const handleDragEnd = (result) => {
    if (isViewer) return;
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const ticketId = parseInt(draggableId, 10);
    const targetStatus = destination.droppableId;

    // Get all tickets currently in target column sorted by order_index
    const colTickets = tickets
      .filter((t) => t.status === targetStatus && t.id !== ticketId)
      .sort((a, b) => a.order_index - b.order_index);

    let newOrderIndex = 1000.0;
    if (colTickets.length === 0) {
      newOrderIndex = 1000.0;
    } else if (destination.index === 0) {
      newOrderIndex = colTickets[0].order_index - 500.0;
    } else if (destination.index >= colTickets.length) {
      newOrderIndex = colTickets[colTickets.length - 1].order_index + 1000.0;
    } else {
      const prevOrder = colTickets[destination.index - 1].order_index;
      const nextOrder = colTickets[destination.index].order_index;
      newOrderIndex = (prevOrder + nextOrder) / 2;
    }

    moveTicketStatus(ticketId, targetStatus, newOrderIndex);
  };

  const renderTypeIcon = (type) => {
    switch (type) {
      case 'Bug':
        return <Bug className="w-3.5 h-3.5 text-rose-400" />;
      case 'Feature':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <CheckSquare className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const renderPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded">
            <AlertOctagon className="w-3 h-3 text-rose-400" />
            <span>Urgent</span>
          </span>
        );
      case 'High':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
            <ArrowUp className="w-3 h-3 text-amber-400" />
            <span>High</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-medium text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded">
            <span>Medium</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 text-[10px] font-medium text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            <ArrowDown className="w-3 h-3 text-slate-400" />
            <span>Low</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 md:p-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex items-start space-x-4 min-w-[1200px]">
          {COLUMNS.map((col) => {
            const columnTickets = tickets
              .filter((t) => t.status === col.id)
              .sort((a, b) => a.order_index - b.order_index);

            return (
              <div
                key={col.id}
                className="w-72 md:w-80 flex-shrink-0 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col max-h-[calc(100vh-160px)]"
              >
                {/* Column Header */}
                <div className={`p-3.5 border-b ${col.color} flex items-center justify-between`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-slate-200">{col.label}</span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                      {columnTickets.length}
                    </span>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={col.id} isDropDisabled={isViewer}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2.5 overflow-y-auto space-y-2.5 transition-colors rounded-b-2xl min-h-[150px] ${
                        snapshot.isDraggingOver ? 'bg-brand-500/5 ring-1 ring-brand-500/20' : ''
                      }`}
                    >
                      {columnTickets.map((ticket, index) => (
                        <Draggable
                          key={ticket.id.toString()}
                          draggableId={ticket.id.toString()}
                          index={index}
                          isDragDisabled={isViewer}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              onClick={() => onSelectTicket(ticket)}
                              className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                dragSnapshot.isDragging
                                  ? 'bg-slate-800 border-brand-500/60 shadow-2xl scale-[1.02] ring-2 ring-brand-500/30'
                                  : 'bg-slate-850/90 hover:bg-slate-800/90 border-slate-800/90 hover:border-slate-700 shadow-sm'
                              }`}
                            >
                              {/* Drag handle */}
                              {!isViewer && (
                                <div
                                  {...dragProvided.dragHandleProps}
                                  className="absolute top-3 right-2.5 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition"
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                              )}

                              {/* Card Header: Key + Priority */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center space-x-1.5">
                                  {renderTypeIcon(ticket.type)}
                                  <span className="text-xs font-mono font-medium text-slate-400 group-hover:text-brand-400 transition">
                                    {ticket.key}
                                  </span>
                                </div>
                                <div className="pr-4">{renderPriorityBadge(ticket.priority)}</div>
                              </div>

                              {/* Card Title */}
                              <h4 className="text-sm font-medium text-slate-200 line-clamp-2 leading-snug mb-3">
                                {ticket.title}
                              </h4>

                              {/* Card Footer: Metadata + Assignee */}
                              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                                <div className="flex items-center space-x-2.5">
                                  {ticket.estimated_hours && (
                                    <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-400">
                                      <Clock className="w-3 h-3" />
                                      <span>{ticket.estimated_hours}h</span>
                                    </div>
                                  )}
                                  {ticket.attachments && ticket.attachments.length > 0 && (
                                    <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                                      <Paperclip className="w-3 h-3" />
                                      <span>{ticket.attachments.length}</span>
                                    </div>
                                  )}
                                  {ticket.comments_count > 0 && (
                                    <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                                      <MessageSquare className="w-3 h-3" />
                                      <span>{ticket.comments_count}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Assignee Avatar */}
                                {ticket.assignee ? (
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
                                    style={{ backgroundColor: ticket.assignee.avatar_color || '#3b82f6' }}
                                    title={`Assigned to ${ticket.assignee.full_name}`}
                                  >
                                    {ticket.assignee.username.slice(0, 2).toUpperCase()}
                                  </div>
                                ) : (
                                  <div
                                    className="w-6 h-6 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-[10px] text-slate-500"
                                    title="Unassigned"
                                  >
                                    ?
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

