import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { showSuccess, showError } from "../Notification";
import { ToastContainer } from 'react-toastify';
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
    } catch (error) {
      console.error("Error fetching materials:", error);
      setError("Failed to load materials. Please try again.");
      showError(error.response?.data?.message || "Failed to fetch materials");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/materials/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess("Material deleted successfully");
      fetchMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
      showError(error.response?.data?.message || "Failed to delete material");
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchTerm === "" || 
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (material.serialNumber && material.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "All" || material.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || material.category === categoryFilter;
    const isNotDeleted = material.status !== "Deleted";

    return matchesSearch && matchesStatus && matchesCategory && isNotDeleted;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setCategoryFilter("All");
  };

  if (loading) return <div className="loading">Loading materials...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="inventory">
      <ToastContainer />
      <h2>Inventory Management</h2>

      <div className="filters">
        <div className="search">
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
            <button 
              onClick={resetFilters}
              className="reset-btn"
            >
              Reset
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
                <td>
                  {material.expiryDate 
                    ? new Date(material.expiryDate).toLocaleDateString() 
                    : "N/A"}
                </td>
                <td className="actions">
                  <button 
                    onClick={() => navigate(`/update-material/${material._id}`)}
                    className="edit"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(material._id)}
                    className="delete"
                  >
                    Delete
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