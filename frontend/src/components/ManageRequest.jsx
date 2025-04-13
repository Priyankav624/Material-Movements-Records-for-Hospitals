import { useEffect, useState } from "react";
import axios from "axios";
import "./ManageRequests.css";

const ManageRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/material-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data.requests);
    } catch (error) {
      setError("Failed to fetch requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    if (status === "Rejected" && !rejectionReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    const confirmAction = window.confirm(`Are you sure you want to ${status.toLowerCase()} this request?`);
    if (!confirmAction) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/material-requests/${id}`,
        { status, rejectionReason: status === "Rejected" ? rejectionReason : undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Request ${status.toLowerCase()} successfully!`);
      fetchRequests();

      if (status === "Rejected") {
        setRejectionReason("");
        setSelectedRequestId(null);
      }
    } catch (error) {
      alert("Failed to update request.");
    }
  };

  if (loading) return <p className="loading-text">Loading requests...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="container">
      <h2 className="title">Manage Material Requests</h2>

      {requests.length === 0 ? (
        <p className="no-requests">No requests available.</p>
      ) : (
        requests.map((req) => (
          <div key={req._id} className="request-card">
            <p className="material-info">
              <strong>{req.materialId?.name} ({req.quantity})</strong>
            </p>
            <p className="request-info">
              <strong>Requested By:</strong> {req.requestedBy?.name} ({req.requestedBy?.role})
            </p>
            <p className={`priority ${req.priority.toLowerCase()}`}>
              <strong>Priority:</strong> {req.priority}
            </p>
            <p className="status">
              <strong>Status:</strong>{" "}
              <span className={req.status.toLowerCase()}>{req.status}</span>
            </p>

            {req.status === "Rejected" && (
              <p className="rejection-reason">
                <strong>Rejection Reason:</strong> {req.rejectionReason}
              </p>
            )}

            {req.status === "Pending" && (
              <div className="actions">
                <button onClick={() => handleAction(req._id, "Approved")} className="approve-btn">
                  Approve
                </button>

                <button onClick={() => setSelectedRequestId(req._id)} className="reject-btn">
                  Reject
                </button>

                {selectedRequestId === req._id && (
                  <div className="rejection-box">
                    <input
                      type="text"
                      placeholder="Rejection reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="rejection-input"
                    />
                    <button onClick={() => handleAction(req._id, "Rejected")} className="confirm-btn">
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ManageRequests;
