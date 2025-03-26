// import { useEffect, useState } from "react";
// import axios from "axios";

// const TrackRequests = () => {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetchUserRequests();

//     // Auto-refresh requests every 30 seconds
//     const interval = setInterval(fetchUserRequests, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   const fetchUserRequests = async () => {
//     setLoading(true);
//     setError(null); // Reset error state before fetching
//     try {
//       const token = localStorage.getItem("token");
//       const { data } = await axios.get("http://localhost:5000/api/material-requests/my-requests", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setRequests(data.requests);
//     } catch (error) {
//       setError(error.response?.data?.message || "Failed to fetch your requests.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <p>Loading your requests...</p>;
//   if (error) return <p style={{ color: "red" }}>{error}</p>;

//   return (
//     <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
//       <h2 style={{ textAlign: "center", marginBottom: "20px" }}>My Material Requests</h2>
      
//       {requests.length === 0 ? (
//         <p style={{ textAlign: "center", color: "gray" }}>No requests found.</p>
//       ) : (
//         requests.map((req) => (
//           <div key={req._id} style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px", marginBottom: "10px" }}>
//             <p><strong>Material:</strong> {req.materialId?.name} ({req.quantity})</p>
//             <p><strong>Priority:</strong> {req.priority}</p>
//             <p><strong>Status:</strong> 
//               <span style={{ 
//                 color: req.status === "Approved" ? "green" : req.status === "Rejected" ? "red" : "blue",
//                 fontWeight: "bold",
//                 marginLeft: "5px"
//               }}>
//                 {req.status}
//               </span>
//             </p>

//             {req.status === "Rejected" && (
//               <p><strong>Rejection Reason:</strong> <span style={{ color: "red" }}>{req.rejectionReason}</span></p>
//             )}

//             {req.status === "Approved" && (
//               <p><strong>Approved By:</strong> {req.approvedBy?.name}</p>
//             )}

//             <p><small><strong>Requested On:</strong> {new Date(req.createdAt).toLocaleDateString()}</small></p>
//           </div>
//         ))
//       )}
//     </div>
//   );
// };

// export default TrackRequests;
import { useEffect, useState } from "react";
import axios from "axios";
import "./TrackRequest.css"; // Import the CSS file

const TrackRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserRequests();

    // Auto-refresh requests every 30 seconds
    const interval = setInterval(fetchUserRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserRequests = async () => {
    setLoading(true);
    setError(null); // Reset error state before fetching
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/material-requests/my-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(data.requests);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch your requests.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="track-requests-container">
      <h2 className="title">My Material Requests</h2>

      {loading && <p className="loading-text">Loading your requests...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && requests.length === 0 ? (
        <p className="empty-text">No requests found.</p>
      ) : (
        requests.map((req) => (
          <div key={req._id} className="request-card">
            <p><strong>Material:</strong> {req.materialId?.name} ({req.quantity})</p>
            <p><strong>Priority:</strong> {req.priority}</p>
            <p><strong>Status:</strong> 
              <span className={`status ${req.status.toLowerCase()}`}>{req.status}</span>
            </p>

            {req.status === "Rejected" && (
              <p><strong>Rejection Reason:</strong> <span className="rejected">{req.rejectionReason}</span></p>
            )}

            {req.status === "Approved" && (
              <p><strong>Approved By:</strong> {req.approvedBy?.name}</p>
            )}

            <p><small><strong>Requested On:</strong> {new Date(req.createdAt).toLocaleDateString()}</small></p>
          </div>
        ))
      )}
    </div>
  );
};

export default TrackRequests;
