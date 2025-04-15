import { useEffect, useState } from "react";
import axios from "axios";
import { showError } from "../Notification";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./MaterialDetails.css";

const MaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Available");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const statusOptions = ["All", "Available", "Issued", "Low Stock", "Expired"];
  const categoryOptions = ["All", "Reusable", "Consumable", "Hazardous", "Critical"];

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/materials", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        const materialsData = res.data.materials || res.data;
        setMaterials(Array.isArray(materialsData) ? materialsData : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching materials:", err);
        showError("Unable to fetch materials. Please try again later.");
        setError("Unable to fetch materials. Please try again later.");
        setLoading(false);
      });
  };

  const filteredMaterials = materials.filter(material => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = material.name?.toLowerCase().includes(searchLower);
    const serialMatch = material.serialNumber?.toLowerCase().includes(searchLower);
    
    return (
      (searchTerm === "" || nameMatch || serialMatch) &&
      (statusFilter === "All" || material.status === statusFilter) &&
      (categoryFilter === "All" || material.category === categoryFilter) &&
      material.status !== "Deleted" &&
      material.quantity > 0
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const currentItems = filteredMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("Available");
    setCategoryFilter("All");
    setCurrentPage(1);
  };

  if (error) return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  if (loading) return <p style={{ textAlign: "center" }}>Loading materials...</p>;

  return (
    <div className="materials-container">
      <ToastContainer />
      <div className="material-list-header">
        <h2 className="title">Available Materials</h2>
        
        <div className="material-filters">
          <div className="filter-group search-group">
            <input
              type="text"
              placeholder="Search by name or serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
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
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
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
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              {categoryOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {currentItems.length === 0 ? (
        <p className="no-results">
          No materials available matching your criteria.
        </p>
      ) : (
        <>
          <div className="materials-grid">
            {currentItems.map((material) => (
              <div 
                key={material._id} 
                className={`material-card status-${material.status.toLowerCase().replace(' ', '-')}`}
              >
                <h3>{material.name || "Unnamed Material"}</h3>
                <p><strong>Status:</strong> 
                  <span className={`status-badge ${material.status.toLowerCase().replace(' ', '-')}`}>
                    {material.status}
                  </span>
                </p>
                <p><strong>Category:</strong> {material.category || "N/A"}</p>
                <p><strong>Quantity:</strong> {material.quantity || 0}</p>
                <p><strong>Expiry Date:</strong> 
                  {material.expiryDate ? new Date(material.expiryDate).toLocaleDateString() : "N/A"}
                </p>
                {material.serialNumber && <p><strong>Serial Number:</strong> {material.serialNumber}</p>}
                
                {material.vendorDetails && material.source === "Vendor" && (
                  <>
                    <p><strong>Vendor Name:</strong> {material.vendorDetails.name || "N/A"}</p>
                    <p><strong>Vendor Contact:</strong> {material.vendorDetails.contact || "N/A"}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MaterialList;