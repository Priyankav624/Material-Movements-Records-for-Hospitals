import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ActivityLogs.css';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, LOGIN, LOGOUT
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        
        const response = await axios.get('http://localhost:5000/api/activity-logs', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setLogs(response.data.data || []);
        } else {
          throw new Error(response.data.message || 'Failed to fetch logs');
        }
      } catch (error) {
        console.error('Error:', error);
        setError(error.response?.data?.message || error.message || 'Failed to fetch activity logs');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
  };

  const renderActionIcon = (action) => {
    switch(action) {
      case 'LOGIN': return '🔓';
      case 'LOGOUT': return '🔒';
      default: return '';
    }
  };

  const getFilteredLogs = () => {
    switch(filter) {
      case 'LOGIN':
        return logs.filter(log => log.action === 'LOGIN');
      case 'LOGOUT':
        return logs.filter(log => log.action === 'LOGOUT');
      default:
        return logs;
    }
  };

  return (
    <div className="activity-logs-container">
      <h2>Activity Logs</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="filter-controls">
        <button 
          className={filter === 'ALL' ? 'active' : ''}
          onClick={() => setFilter('ALL')}
        >
          All Activities
        </button>
        <button 
          className={filter === 'LOGIN' ? 'active' : ''}
          onClick={() => setFilter('LOGIN')}
        >
          Login Records
        </button>
        <button 
          className={filter === 'LOGOUT' ? 'active' : ''}
          onClick={() => setFilter('LOGOUT')}
        >
          Logout Records
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading activity logs...</div>
      ) : getFilteredLogs().length === 0 ? (
        <div className="no-logs">
          No {filter.toLowerCase()} activities found
        </div>
      ) : (
        <div className="logs-table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredLogs().map((log) => (
                <tr key={log._id}>
                  <td>{formatDateTime(log.timestamp)}</td>
                  <td className="user-cell">
                    {log.userId?.name || 'System'} 
                    <span className="user-role">{log.userId?.role || 'System'}</span>
                  </td>
                  <td className="action-cell">
                    <span className="action-icon">{renderActionIcon(log.action)}</span>
                    {log.action.replace(/_/g, ' ')}
                  </td>
                  <td>{log.ipAddress || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;