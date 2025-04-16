// MaterialInventory.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer } from 'react-toastify';
import { showSuccess, showError } from "../Notification";
import 'react-toastify/dist/ReactToastify.css';
import "./MaterialInventory.css";

const MaterialInventory = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const statusOptions = ["All", "Available", "Issued", "Low Stock", "Expired"];
  const categoryOptions = ["All", "Reusable", "Consumable", "Hazardous", "Critical"];

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/materials", {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: searchTerm }
      });
      const materialsData = response.data.materials || response.data || [];
      setMaterials(materialsData);
      showSuccess({
        title: "Inventory Loaded",
        message: `Successfully loaded ${materialsData.length} materials`,
        autoClose: 2000
      });
    } catch (error) {
      console.error("Error fetching materials:", error);
      setError("Failed to load materials. Please try again.");
      showError({
        title: "Load Failed",
        message: "Could not fetch materials. Please check your connection.",
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const materialToDelete = materials.find(m => m._id === id);
    if (!materialToDelete) return;
    
    if (!window.confirm(`Are you sure you want to delete "${materialToDelete.name}"? This action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/materials/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess({
        title: "Material Deleted",
        message: `"${materialToDelete.name}" has been successfully removed from inventory`,
        autoClose: 2500
      });
      fetchMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
      showError({
        title: "Deletion Failed",
        message: error.response?.data?.message ||
          `Cannot delete "${materialToDelete.name}" as it may be referenced in existing transactions.`,
        autoClose: 4000
      });
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchTerm === "" ||
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.serialNumber && material.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));
  
    const matchesStatus = statusFilter === "All" || 
      (statusFilter === "Expired" 
        ? (material.status === "Expired" || 
           (material.batches && material.batches.some(b => 
             b.expiryDate && new Date(b.expiryDate) <= new Date() && b.status !== "depleted")))
        : material.status === statusFilter);
    
    const matchesCategory = categoryFilter === "All" || material.category === categoryFilter;
    const isNotDeleted = material.status !== "Deleted";
  
    return matchesSearch && matchesStatus && matchesCategory && isNotDeleted;
  });

  if (loading) return <div className="loading">Loading materials...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="inventory">
      <ToastContainer 
        position="top-right"
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <h2>Inventory Management</h2>

      <div className="filters">
        <div className="search">
          <input
            type="text"
            placeholder="Search by name or serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchMaterials()}
          />
        
          <button 
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("All");
              setCategoryFilter("All");
              fetchMaterials();
            }} 
            className="reset-btn"
          >
            <i className="fas fa-sync-alt"></i> Reset
          </button>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categoryOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredMaterials.length === 0 ? (
        <p className="no-materials">No materials found matching your criteria</p>
      ) : (
        <table className="materials-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Expiry Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map(material => (
              <tr key={material._id} className={`material-row ${material.status.toLowerCase().replace(' ', '-')}`}>
                <td>{material.name}</td>
                <td>{material.category}</td>
                <td>{material.quantity}</td>
                <td>
                  <span className={`status ${material.status.toLowerCase().replace(' ', '-')}`}>
                    {material.status}
                  </span>
                </td>
                <td>{material.expiryDate ? new Date(material.expiryDate).toLocaleDateString() : "N/A"}</td>
                <td className="actions">
                  <button 
                    onClick={() => {
                      showSuccess({
                        title: "Editing Material",
                        message: `Opening "${material.name}" for editing`,
                        autoClose: 1500
                      });
                      navigate(`/update-material/${material._id}`);
                    }} 
                    className="edit"
                  >
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(material._id)} 
                    className="delete"
                  >
                    <i className="fas fa-trash-alt"></i> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MaterialInventory;