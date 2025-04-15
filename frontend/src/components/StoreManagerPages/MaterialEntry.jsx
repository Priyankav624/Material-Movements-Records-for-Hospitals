import { useState } from "react";
import axios from "axios";
import { showSuccess, showError } from "../Notification";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./MaterialEntry.css";

const MaterialEntry = () => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    serialNumber: "",
    quantity: 1,
    expiryDate: "",
    source: "",
    vendorName: "",
    vendorContact: ""
  });

  const [loading, setLoading] = useState(false);
  const categories = ["Reusable", "Consumable", "Hazardous", "Critical"];
  const sources = ["Vendor", "Donation", "Internal Procurement"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Please login first");
      setLoading(false);
      return;
    }

    try {
      // Prepare data for API
      const requestData = {
        ...formData,
        quantity: Number(formData.quantity),
        expiryDate: formData.expiryDate || undefined,
        vendorName: formData.source === "Vendor" ? formData.vendorName : undefined,
        vendorContact: formData.source === "Vendor" ? formData.vendorContact : undefined
      };

      const response = await axios.post(
        "http://localhost:5000/api/materials",
        requestData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      showSuccess(response.data.message || "Material added successfully");
      
      // Reset form
      setFormData({
        name: "",
        category: "",
        serialNumber: "",
        quantity: 1,
        expiryDate: "",
        source: "",
        vendorName: "",
        vendorContact: ""
      });
    } catch (error) {
      console.error("Error adding material:", error);
      showError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Failed to add material"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="entry-container">
      <ToastContainer />
      <h2 className="entry-title">Material Entry</h2>
      <form className="entry-form" onSubmit={handleSubmit}>
        <label>Material Name *</label>
        <input 
          type="text" 
          name="name" 
          placeholder="Material Name" 
          required 
          value={formData.name} 
          onChange={handleChange} 
        />

        <label>Select Category *</label>
        <select 
          name="category" 
          required 
          value={formData.category} 
          onChange={handleChange}
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label>Quantity *</label>
        <input 
          type="number" 
          name="quantity" 
          min="1"
          placeholder="Quantity" 
          required 
          value={formData.quantity} 
          onChange={handleChange} 
        />

        <label>Expiry Date</label>
        <input 
          type="date" 
          name="expiryDate" 
          min={new Date().toISOString().split('T')[0]} // Only allow future dates
          value={formData.expiryDate} 
          onChange={handleChange} 
        />

        <label>Select Source *</label>
        <select 
          name="source" 
          required 
          value={formData.source} 
          onChange={handleChange}
        >
          <option value="">Select Source</option>
          {sources.map((src) => (
            <option key={src} value={src}>{src}</option>
          ))}
        </select>

        {formData.source === "Vendor" && (
          <>
            <label>Vendor Name *</label>
            <input 
              type="text" 
              name="vendorName" 
              placeholder="Vendor Name" 
              required 
              value={formData.vendorName} 
              onChange={handleChange} 
            />

            <label>Vendor Contact *</label>
            <input 
              type="text" 
              name="vendorContact" 
              placeholder="Vendor Contact" 
              required 
              value={formData.vendorContact} 
              onChange={handleChange} 
            />
          </>
        )}

        <button 
          className="submit-btn" 
          type="submit" 
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Material"}
        </button>
      </form>
    </div>
  );
};

export default MaterialEntry;