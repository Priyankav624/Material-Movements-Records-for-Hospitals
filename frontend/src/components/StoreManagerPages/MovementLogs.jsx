import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import './MovementLogs.css';

const MovementLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    action: '',
    dateFrom: '',
    dateTo: '',
    material: ''
  });

  useEffect(() => {
    fetchMovementLogs();
  }, [filters]);

  const fetchMovementLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/movement-logs', {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Error fetching movement logs:', error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  

  return (
    <div className="movement-logs-container">
      <h2>Material Movement Logs</h2>
      
      <div className="filters">
        <select name="action" value={filters.action} onChange={handleFilterChange}>
          <option value="">All Actions</option>
          <option value="Requested">Requested</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Issued">Issued</option>
        </select>

        <input 
          type="date" 
          name="dateFrom" 
          value={filters.dateFrom}
          onChange={handleFilterChange}
          placeholder="From Date"
        />

        <input 
          type="date" 
          name="dateTo" 
          value={filters.dateTo}
          onChange={handleFilterChange}
          placeholder="To Date"
        />

        <button onClick={() => setFilters({
          action: '',
          dateFrom: '',
          dateTo: '',
          material: ''
        })}>
          Clear Filters
        </button>
      </div>

      <table className="logs-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Material</th>
            <th>Action</th>
            <th>Performed By</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log._id}>
              <td>{new Date(log.timestamp).toLocaleDateString('en-GB')} {new Date(log.timestamp).toLocaleTimeString()}</td>


              <td>{log.materialId?.name || 'N/A'}</td>
              <td>{log.action}</td>
              <td>{log.performedBy?.name || 'System'}</td>
              <td>{log.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MovementLogs;