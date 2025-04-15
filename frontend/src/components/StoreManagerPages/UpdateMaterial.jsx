import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { showError } from "../Notification";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./UpdateMaterial.css";

const UpdateMaterial = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState({
    name: "",
    category: "",
    quantity: "",
    expiryDate: "",
    source: "",
    vendorDetails: { name: "", contact: "" }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categoryOptions = ["Reusable", "Consumable", "Hazardous", "Critical"];
  const sourceOptions = ["Vendor", "Donation", "Internal Procurement"];

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/materials/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const materialData = response.data.material || response.data;
        console.log("Fetched Material Data:", materialData);

        // Safely set the material data with fallbacks
        setMaterial({
          name: materialData.name || "",
          category: materialData.category || categoryOptions[0],
          quantity: materialData.quantity || "",
          expiryDate: materialData.expiryDate 
            ? new Date(materialData.expiryDate).toISOString().split('T')[0]
            : "",
          source: materialData.source || sourceOptions[0],
          vendorDetails: materialData.vendorDetails || { name: "", contact: "" }
        });
      } catch (err) {
        console.error("Error fetching material:", err);
        setError("Failed to load material. Please try again.");
        showError(err.response?.data?.message || "Failed to fetch material");
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.put(
        `http://localhost:5000/api/materials/${id}`,
        material,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      navigate("/inventory");
    } catch (error) {
      console.error("Error updating material:", error);
      showError(
        error.response?.data?.message || 
        "Failed to update material. Please try again."
      );
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMaterial(prev => ({ ...prev, [name]: value }));
  };

  const handleVendorChange = (e) => {
    const { name, value } = e.target;
    setMaterial(prev => ({
      ...prev,
      vendorDetails: {
        ...prev.vendorDetails,
        [name]: value
      }
    }));
  };

  if (loading) return <div className="loading">Loading material...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="update-container">
      <ToastContainer />
      <h2>Update Material</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={material.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Category:</label>
          <select
            name="category"
            value={material.category}
            onChange={handleChange}
            required
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Quantity:</label>
          <input
            type="number"
            name="quantity"
            min="0"
            value={material.quantity}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Expiry Date:</label>
          <input
            type="date"
            name="expiryDate"
            value={material.expiryDate}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Source:</label>
          <select
            name="source"
            value={material.source}
            onChange={handleChange}
            required
          >
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>

        {material.source === "Vendor" && (
          <>
            <div className="form-group">
              <label>Vendor Name:</label>
              <input
                type="text"
                name="name"
                value={material.vendorDetails.name}
                onChange={handleVendorChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Vendor Contact:</label>
              <input
                type="text"
                name="contact"
                value={material.vendorDetails.contact}
                onChange={handleVendorChange}
                required
              />
            </div>
          </>
        )}

        <button type="submit" className="submit-btn">
          Update Material
        </button>
      </form>
    </div>
  );
};

export default UpdateMaterial;