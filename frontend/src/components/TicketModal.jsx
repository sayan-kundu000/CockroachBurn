import React, { useState, useEffect } from 'react';
import { ticketsApi, commentsApi, attachmentsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { BugmardiniModal } from './BugmardiniModal';
import {
  X, Trash2, Paperclip, MessageSquare, Send, Reply, Image,
  Clock, User, Check, AlertCircle, ExternalLink, Download, Sparkles
} from 'lucide-react';

export const TicketModal = ({ ticketId, onClose }) => {
  const { user, isAdmin } = useAuth();
  const { users, fetchTickets } = useProject();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Bug');
  const [status, setStatus] = useState('To Do');
  const [priority, setPriority] = useState('Medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');

  // Comment state
  const [commentContent, setCommentContent] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Attachment upload state
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showBugmardini, setShowBugmardini] = useState(false);

  const canEdit = user?.role !== 'Viewer';
  const canDelete =
    isAdmin ||
    ticket?.reporter_id === user?.id ||
    ticket?.project?.owner_id === user?.id;

  const loadTicket = async () => {
    try {
      setLoading(true);
      const res = await ticketsApi.get(ticketId);
      const data = res.data;
      setTicket(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setType(data.type);
      setStatus(data.status);
      setPriority(data.priority);
      setAssigneeId(data.assignee_id ? data.assignee_id.toString() : '');
      setEstimatedHours(data.estimated_hours ? data.estimated_hours.toString() : '');
    } catch (err) {
      console.error('Failed to load ticket details', err);
      setError('Could not load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const handleSave = async () => {
    if (!canEdit) return;
    try {
      setSaving(true);
      setError('');
      await ticketsApi.update(ticket.id, {
        title,
        description,
        type,
        status,
        priority,
        assignee_id: assigneeId ? parseInt(assigneeId, 10) : 0,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
      });
      await loadTicket();
      fetchTickets();
    } catch (err) {
      console.error('Failed to update ticket', err);
      setError(err.response?.data?.detail || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!canDelete) return;
    if (!window.confirm(`Are you sure you want to delete ${ticket.key}?`)) return;

    try {
      await ticketsApi.delete(ticket.id);
      fetchTickets();
      onClose();
    } catch (err) {
      console.error('Failed to delete ticket', err);
      setError(err.response?.data?.detail || 'Failed to delete ticket');
    }
  };

  // Add Comment
  const handleAddComment = async (parentId = null) => {
    const text = parentId ? replyContent : commentContent;
    if (!text.trim()) return;

    try {
      setSubmittingComment(true);
      await commentsApi.create(ticket.id, {
        content: text.trim(),
        parent_id: parentId,
      });
      if (parentId) {
        setReplyingToId(null);
        setReplyContent('');
      } else {
        setCommentContent('');
      }
      await loadTicket();
      fetchTickets();
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    try {
      await commentsApi.delete(commentId);
      await loadTicket();
      fetchTickets();
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  // Attachment upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      await attachmentsApi.upload(ticket.id, formData);
      await loadTicket();
      fetchTickets();
    } catch (err) {
      console.error('Failed to upload attachment', err);
      alert('Upload failed: ' + (err.response?.data?.detail || 'Error uploading file'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Delete this attachment?')) return;
    try {
      await attachmentsApi.delete(attachmentId);
      await loadTicket();
      fetchTickets();
    } catch (err) {
      console.error('Failed to delete attachment', err);
    }
  };

  if (!ticketId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded">
              {ticket?.key || '...'}
            </span>
            <span className="text-xs text-slate-400">
              Reported by <strong className="text-slate-200">{ticket?.reporter?.full_name}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Ask Bugmardini AI Button */}
            <button
              onClick={() => setShowBugmardini(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30 hover:from-purple-600/40 hover:to-pink-600/40 text-purple-200 border border-purple-500/40 shadow-sm transition active:scale-95"
              title="Consult Bugmardini AI (Simple & Detailed Explanations + Female Voice)"
            >
              <span className="text-sm">⚔️</span>
              <span className="hidden sm:inline">Ask Bugmardini AI</span>
            </button>

            {canDelete && (
              <button
                onClick={handleDeleteTicket}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Delete Issue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading issue details...</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Title & Metadata Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 2 Cols: Title & Description */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Issue Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 transition disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Provide reproduction steps, expected vs actual behavior..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition disabled:opacity-70 leading-relaxed font-sans"
                  />
                </div>

                {/* Attachments Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Bug Screenshots & Attachments ({ticket?.attachments?.length || 0})</span>
                    </label>

                    {canEdit && (
                      <label className="cursor-pointer text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center space-x-1 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20 transition">
                        <span>{uploading ? 'Uploading...' : '+ Upload File'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {ticket?.attachments?.length === 0 ? (
                    <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500">
                      No screenshots or files attached yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {ticket?.attachments?.map((att) => {
                        const isImg = att.content_type.startsWith('image/');
                        return (
                          <div
                            key={att.id}
                            className="group relative bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 flex flex-col justify-between overflow-hidden"
                          >
                            {isImg ? (
                              <div
                                onClick={() => setPreviewImage(att.file_path)}
                                className="h-24 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer mb-2"
                              >
                                <img
                                  src={att.file_path}
                                  alt={att.original_name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                />
                              </div>
                            ) : (
                              <div className="h-24 bg-slate-900 rounded-lg flex items-center justify-center text-slate-400 mb-2">
                                <Paperclip className="w-8 h-8 opacity-40" />
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-slate-300">
                              <span className="truncate max-w-[120px] font-mono text-[10px]">
                                {att.original_name}
                              </span>
                              <div className="flex items-center space-x-1">
                                <a
                                  href={att.file_path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-brand-400 p-1"
                                  title="Open in new tab"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                {(isAdmin || att.uploaded_by_id === user?.id) && (
                                  <button
                                    onClick={() => handleDeleteAttachment(att.id)}
                                    className="text-slate-400 hover:text-rose-400 p-1"
                                    title="Delete file"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Fields & Controls */}
              <div className="space-y-4 bg-slate-850/60 border border-slate-800 rounded-xl p-4 h-fit">
                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="Urgent">🔴 Urgent</option>
                    <option value="High">🟠 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Issue Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="Bug">🐛 Bug</option>
                    <option value="Task">📋 Task</option>
                    <option value="Feature">✨ Feature</option>
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.username})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estimated Hours */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g. 4.5"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {/* Save Button */}
                {canEdit && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 rounded-lg text-xs shadow-md transition flex items-center justify-center space-x-1.5 mt-2 active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Threaded Comments Section */}
            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-brand-400" />
                <span>Discussion ({ticket?.comments?.length || 0})</span>
              </h3>

              {/* Add Main Comment Input */}
              {canEdit && (
                <div className="flex items-start space-x-3 mb-6">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow"
                    style={{ backgroundColor: user?.avatar_color || '#3b82f6' }}
                  >
                    {user?.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      rows={2}
                      placeholder="Write a comment or update..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleAddComment(null)}
                        disabled={submittingComment || !commentContent.trim()}
                        className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow transition flex items-center space-x-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Comment</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {ticket?.comments?.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    {/* Top Level Comment */}
                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: comment.author?.avatar_color || '#3b82f6' }}
                          >
                            {comment.author?.username?.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-slate-200">
                            {comment.author?.full_name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {canEdit && (
                            <button
                              onClick={() => setReplyingToId(comment.id)}
                              className="text-[11px] text-slate-400 hover:text-brand-400 flex items-center space-x-1 transition"
                            >
                              <Reply className="w-3 h-3" />
                              <span>Reply</span>
                            </button>
                          )}
                          {(isAdmin || comment.author_id === user?.id) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-slate-500 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pl-8">
                        {comment.content}
                      </p>
                    </div>

                    {/* Threaded Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-8 space-y-2.5 border-l-2 border-slate-800 pl-4">
                        {comment.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                                  style={{ backgroundColor: reply.author?.avatar_color || '#3b82f6' }}
                                >
                                  {reply.author?.username?.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="text-xs font-semibold text-slate-200">
                                  {reply.author?.full_name}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              {(isAdmin || reply.author_id === user?.id) && (
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="text-slate-500 hover:text-rose-400 transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed pl-7">
                              {reply.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Reply Input */}
                    {replyingToId === comment.id && (
                      <div className="ml-8 pl-4 space-y-2">
                        <textarea
                          rows={2}
                          autoFocus
                          placeholder={`Replying to ${comment.author?.full_name}...`}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setReplyingToId(null);
                              setReplyContent('');
                            }}
                            className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAddComment(comment.id)}
                            disabled={submittingComment || !replyContent.trim()}
                            className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-3 py-1 rounded-lg text-xs"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bugmardini AI Assistant Modal */}
      {showBugmardini && (
        <BugmardiniModal
          ticket={ticket}
          onClose={() => setShowBugmardini(false)}
        />
      )}

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImage} alt="Attachment Full Preview" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

