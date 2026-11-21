import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { projectsApi, ticketsApi, usersApi } from '../services/api';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    type: '',
    assignee_id: '',
  });

  const wsRef = useRef(null);

  // Load user accessible projects
  const fetchProjects = useCallback(async () => {
    if (!user) return;
    try {
      const res = await projectsApi.list();
      setProjects(res.data);
      if (res.data.length > 0) {
        // If no active project or active project no longer exists, select first
        setActiveProject((prev) => {
          if (!prev || !res.data.find((p) => p.id === prev.id)) {
            return res.data[0];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  }, [user]);

  // Load users list for assignments
  const fetchUsers = useCallback(async () => {
    if (!user) return;
    try {
      const res = await usersApi.list();
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  }, [user]);

  // Load tickets for active project with filters
  const fetchTickets = useCallback(async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const params = { project_id: activeProject.id };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.type) params.type = filters.type;
      if (filters.assignee_id) params.assignee_id = filters.assignee_id;

      const res = await ticketsApi.list(params);
      setTickets(res.data);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoading(false);
    }
  }, [activeProject, filters]);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [fetchProjects, fetchUsers]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // WebSocket real-time subscription for active project
  useEffect(() => {
    if (!activeProject) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws/project/${activeProject.id}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      console.log(`[WS] Connected to project ${activeProject.id}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WS] Received update:', data);

        // Auto-refresh tickets on any ticket changes
        if (
          data.event === 'TICKET_CREATED' ||
          data.event === 'TICKET_UPDATED' ||
          data.event === 'TICKET_MOVED' ||
          data.event === 'TICKET_DELETED' ||
          data.event === 'ATTACHMENT_UPLOADED' ||
          data.event === 'ATTACHMENT_DELETED' ||
          data.event === 'COMMENT_ADDED' ||
          data.event === 'COMMENT_DELETED'
        ) {
          fetchTickets();
        }
      } catch (err) {
        console.error('[WS] Error processing message', err);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      console.log('[WS] Disconnected');
    };

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [activeProject, fetchTickets]);

  // Optimistic status update for smooth Kanban drag-and-drop
  const moveTicketStatus = async (ticketId, newStatus, newOrderIndex) => {
    // Optimistically update tickets in state
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: newStatus, order_index: newOrderIndex }
          : t
      )
    );

    try {
      await ticketsApi.updateStatus(ticketId, newStatus, newOrderIndex);
    } catch (err) {
      console.error("Failed to update ticket status on server", err);
      // Revert on error
      fetchTickets();
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        fetchProjects,
        tickets,
        setTickets,
        fetchTickets,
        users,
        filters,
        setFilters,
        loading,
        wsConnected,
        moveTicketStatus,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);

