import { useEffect, useState } from "react";
import axios from "axios";
import { showError } from "../Notification";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./MaterialDetails.css";

const MaterialList = () => {
  const [allMaterials, setAllMaterials] = useState([]); // Store all materials
  const [displayedMaterials, setDisplayedMaterials] = useState([]); // Materials to display
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const statusOptions = ["All", "Available", "Issued", "Low Stock", "Expired"];
  const categoryOptions = ["All", "Reusable", "Consumable", "Hazardous", "Critical"];

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    // Apply filters whenever filters or search term changes
    applyFilters();
  }, [allMaterials, statusFilter, categoryFilter, searchTerm]);

  const fetchMaterials = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/materials", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        const materialsData = Array.isArray(res.data) ? res.data : 
                            (res.data.materials || []);
        
        // Filter out deleted items but include all statuses
        const filtered = materialsData.filter(material => 
          material.status !== "Deleted"
        );
        
        setAllMaterials(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching materials:", err);
        showError("Unable to fetch materials. Please try again later.");
        setError("Unable to fetch materials. Please try again later.");
        setLoading(false);
      });
  };

  const applyFilters = () => {
    const filtered = allMaterials.filter(material => {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = material.name?.toLowerCase().includes(searchLower);
      const serialMatch = material.serialNumber?.toLowerCase().includes(searchLower);
      
      return (
        (searchTerm === "" || nameMatch || serialMatch) &&
        (statusFilter === "All" || material.status === statusFilter) &&
        (categoryFilter === "All" || material.category === categoryFilter)
      );
    });

    setDisplayedMaterials(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayedMaterials.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(displayedMaterials.length / itemsPerPage);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setCategoryFilter("All");
  };

  console.log('Total items:', displayedMaterials.length);
  console.log('Total pages:', totalPages);
  console.log('Current page:', currentPage);

  if (error) return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  if (loading) return <p style={{ textAlign: "center" }}>Loading materials...</p>;

  return (
    <div className="materials-container">
      <ToastContainer />
      <div className="material-list-header">
        <h2 className="title">Material Inventory ({displayedMaterials.length} items)</h2>
        
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
              onChange={(e) => setStatusFilter(e.target.value)}
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
              onChange={(e) => setCategoryFilter(e.target.value)}
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
                    {material.status === "Issued" && " (0 in stock)"}
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

          {/* Pagination Controls - Only show if more than one page */}
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
                Page {currentPage} of {totalPages} ({displayedMaterials.length} items total)
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