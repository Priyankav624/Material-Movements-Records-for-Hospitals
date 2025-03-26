// import React, { useEffect, useState } from "react";
// import axios from "axios";

// const RequestMaterial = () => {
//   const [materials, setMaterials] = useState([]);
//   const [selectedMaterial, setSelectedMaterial] = useState("");
//   const [priority, setPriority] = useState("Medium");
//   const [quantity, setQuantity] = useState(1);
//   const [reason, setReason] = useState("");

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       alert("No token found! Please login.");
//       return;
//     }

//     axios
//       .get("http://localhost:5000/api/materials", {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       .then((res) => setMaterials(res.data.materials))
//       .catch((error) => {
//         console.error("Error fetching materials:", error.response?.data || error.message);
//         setMaterials([]);
//       });
//   }, []);

//   const handleRequestMaterial = async () => {
//     if (!selectedMaterial || !quantity || !reason) {
//       alert("All fields are required!");
//       return;
//     }

//     const token = localStorage.getItem("token");

//     try {
//       const response = await axios.post(
//         "http://localhost:5000/api/material-requests/request",
//         { materialId: selectedMaterial, quantity, reason, priority },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       alert(response.data.message || "Request submitted successfully!");
      
//       setSelectedMaterial("");
//       setQuantity(1);
//       setReason("");
//       setPriority("Medium");
//     } catch (error) {
//       console.error("Error requesting material:", error.response?.data || error.message);
//       alert("Failed to submit request.");
//     }
//   };

//   return (
//     <div>
//       <h2>Request Material</h2>
//       <label>Select Material:</label>
//       <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)}>
//         <option value="">-- Select --</option>
//         {materials.map((material) => (
//           <option key={material._id} value={material._id}>
//             {material.name} ({material.quantity} available)
//           </option>
//         ))}
//       </select>

//       <label>Quantity:</label>
//       <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />

//       <label>Reason:</label>
//       <textarea value={reason} onChange={(e) => setReason(e.target.value)} />

//       <label>Priority:</label>
//       <select value={priority} onChange={(e) => setPriority(e.target.value)}>
//         <option value="High">High</option>
//         <option value="Medium">Medium</option>
//         <option value="Low">Low</option>
//       </select>

//       <button onClick={handleRequestMaterial}>Request Material</button>
//     </div>
//   );
// };

// export default RequestMaterial;

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./RequestMaterial.css"; // Import the new CSS

const RequestMaterial = () => {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No token found! Please login.");
      return;
    }

    axios
      .get("http://localhost:5000/api/materials", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMaterials(res.data.materials))
      .catch((error) => {
        console.error("Error fetching materials:", error.response?.data || error.message);
        setMaterials([]);
      });
  }, []);

  const handleRequestMaterial = async () => {
    if (!selectedMaterial || !quantity || !reason.trim()) {
      alert("All fields are required!");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/material-requests/request",
        { materialId: selectedMaterial, quantity, reason, priority },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message || "Request submitted successfully!");
      
      setSelectedMaterial("");
      setQuantity(1);
      setReason("");
      setPriority("Medium");
    } catch (error) {
      console.error("Error requesting material:", error.response?.data || error.message);
      alert("Failed to submit request.");
    }
  };

  return (
    <div className="request-material-container">
      <h2 className="title">Request Material</h2>
      <div className="form-container">
        <label>Select Material:</label>
        <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)}>
          <option value="">-- Select --</option>
          {materials.map((material) => (
            <option key={material._id} value={material._id}>
              {material.name} ({material.quantity} available)
            </option>
          ))}
        </select>

        <label>Quantity:</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Enter quantity"
        />

        <label>Reason:</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for request"
        />

        <label>Priority:</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <button onClick={handleRequestMaterial}>Request Material</button>
      </div>
    </div>
  );
};

export default RequestMaterial;
