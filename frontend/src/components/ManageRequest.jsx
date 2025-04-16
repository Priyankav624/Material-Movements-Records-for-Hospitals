import React, { useEffect, useState } from "react";
import axios from "axios";
import { showSuccess, showError } from "./Notification";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./ManageRequests.css";

const ManageRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/material-requests",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setError("Failed to load requests. Please try again.");
      showError(error.response?.data?.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      if (status === "Rejected" && !rejectionReason.trim()) {
        showError("Please provide a rejection reason");
        return;
      }

      if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) {
        return;
      }

      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/material-requests/${id}`,
        { 
          status, 
          ...(status === "Rejected" && { rejectionReason }) 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showSuccess(response.data.message);
        await fetchRequests();
        setRejectionReason("");
        setSelectedRequestId(null);
      } else {
        showError(response.data.message || "Action failed");
      }
    } catch (error) {
      console.error("Request action failed:", error);
      showError(
        error.response?.data?.message || 
        "Failed to process request. Please try again."
      );
      
      if (error.response?.status === 400) {
        fetchRequests(); // Refresh if stock issue
      }
    }
  };

  const filteredRequests = statusFilter === "All"
    ? requests
    : requests.filter(req => req.status === statusFilter);

  if (loading) return <div className="loading">Loading requests...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="manage-requests">
      <ToastContainer />
      <h2>Manage Material Requests</h2>

      <div className="filter-section">
        <label htmlFor="statusFilter">Filter by Status: </label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {filteredRequests.length === 0 ? (
        <p className="no-requests">No {statusFilter.toLowerCase()} requests available</p>
      ) : (
        <div className="requests-list">
          {filteredRequests.map(request => (
            <div key={request._id} className={`request-card ${request.status.toLowerCase()}`}>
              <div className="request-header">
                <h3>
                  {request.materialId?.name || "Material Not Found"}
                  {request.materialId?.category && (
                    <span className="category">({request.materialId.category})</span>
                  )}
                </h3>
                <span className={`status ${request.status.toLowerCase()}`}>
                  {request.status}
                </span>
              </div>

              <div className="request-details">
                <p>
                  <strong>Quantity:</strong> {request.quantity}
                  {request.materialId?.quantity !== undefined && (
                    <span className="stock">
                      (Stock: {request.materialId.quantity})
                    </span>
                  )}
                </p>
                <p>
                  <strong>Requested By:</strong> {request.requestedBy?.name} ({request.requestedBy?.role})
                </p>
                <p>
                  <strong>Priority:</strong> 
                  <span className={`priority ${request.priority.toLowerCase()}`}>
                    {request.priority}
                  </span>
                </p>
                {request.reason && (
                  <p className="reason">
                    <strong>Reason:</strong> {request.reason}
                  </p>
                )}
              </div>

              {request.status === "Pending" && (
                <div className="request-actions">
                  <button
                    onClick={() => handleAction(request._id, "Approved")}
                    className="approve"
                    disabled={request.materialId?.quantity < request.quantity}
                    title={
                      request.materialId?.quantity < request.quantity 
                        ? "Insufficient stock to approve" 
                        : ""
                    }
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setSelectedRequestId(request._id)}
                    className="reject"
                  >
                    Reject
                  </button>

                  {selectedRequestId === request._id && (
                    <div className="rejection-form">
                      <input
                        type="text"
                        placeholder="Enter rejection reason..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        required
                      />
                      <button
                        onClick={() => handleAction(request._id, "Rejected")}
                        className="confirm-reject"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  )}
                </div>
              )}

              {request.status === "Rejected" && request.rejectionReason && (
                <div className="rejection-reason">
                  <strong>Rejection Reason:</strong> {request.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageRequests;
