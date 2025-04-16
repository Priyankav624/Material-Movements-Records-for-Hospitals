import React, { useEffect, useState } from "react";
import axios from "axios";
import "./RequestMaterial.css"; 

const RequestMaterial = () => {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [department, setDepartment] = useState("Emergency");

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
      .then((res) => {
        const filteredMaterials = res.data.materials.filter(
          (material) => material.quantity > 0 && material.status !== "Expired"
        );
        setMaterials(filteredMaterials);
      })
      .catch((error) => {
        console.error("Error fetching materials:", error.response?.data || error.message);
        setMaterials([]);
      });
  }, []);

  const handleRequestMaterial = async () => {
    if (!selectedMaterial || !quantity || !reason.trim() || !department) {
      alert("All fields are required!");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/material-requests/request",
        { 
          materialId: selectedMaterial, 
          quantity, 
          reason, 
          priority,
          department 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message || "Request submitted successfully!");
      
      setSelectedMaterial("");
      setQuantity(1);
      setReason("");
      setPriority("Medium");
      setDepartment("Emergency");
    } catch (error) {
      console.error("Error requesting material:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Failed to submit request.");
    }
  };

  return (
    <div className="request-material-container">
      <h2 className="title">Request Material</h2>
      <div className="form-container">
        <label>Select Material:</label>
        <select 
          value={selectedMaterial} 
          onChange={(e) => setSelectedMaterial(e.target.value)}
          required
        >
          <option value="">-- Select --</option>
          {materials.map((material) => (
            <option key={material._id} value={material._id}>
              {material.name} ({material.quantity} available) - {material.category}
            </option>
          ))}
        </select>

        <label>Department:</label>
        <select 
          value={department} 
          onChange={(e) => setDepartment(e.target.value)}
          required
        >
          <option value="Emergency">Emergency</option>
          <option value="Pediatrics">Pediatrics</option>
          <option value="Surgery">Surgery</option>
          <option value="ICU">ICU</option>
          <option value="Radiology">Radiology</option>
          <option value="Pharmacy">Pharmacy</option>
          <option value="Laboratory">Laboratory</option>
        </select>

        <label>Quantity:</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, e.target.value))}
          placeholder="Enter quantity"
          required
        />

        <label>Reason:</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for request"
          required
        />

        <label>Priority:</label>
        <select 
          value={priority} 
          onChange={(e) => setPriority(e.target.value)}
          required
        >
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