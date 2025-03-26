import { useState } from "react";
import axios from "axios";
import "./MaterialEntry.css"

const MaterialEntry = () => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    serialNumber: "",
    quantity: "",
    expiryDate: "",
    source: "",
    vendorName: "",
    vendorContact: ""
  });

  const categories = ["Reusable", "Consumable", "Hazardous", "Critical"];
  const sources = ["Vendor", "Donation", "Internal Procurement"];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.post("http://localhost:5000/api/materials", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Material Added Successfully");

      setFormData({
        name: "",
        category: "",
        serialNumber: "",
        quantity: "",
        expiryDate: "",
        source: "",
        vendorName: "",
        vendorContact: ""
      });
    } catch (error) {
      console.error("Error adding material:", error.response);
      alert(error.response?.data?.message || "Error adding material");
    }
  };

  return (
    <div className="entry-container">
      <h2 className="entry-title">Material Entry</h2>
      <form className="entry-form" onSubmit={handleSubmit}>
        <label>Material Name</label>
        <input type="text" name="name" placeholder="Material Name" required value={formData.name} onChange={handleChange} />
        <label>Select Category</label>
        <select name="category" required value={formData.category} onChange={handleChange}>
          <option value="">Select Category</option>
          {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <label>Quantity</label>
        <input type="number" name="quantity" placeholder="Quantity" required value={formData.quantity} onChange={handleChange} />
        <label>Expire date</label>
        <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} />
        <label>Select source</label>
        <select name="source" required value={formData.source} onChange={handleChange}>
          <option value="">Select Source</option>
          {sources.map((src) => <option key={src} value={src}>{src}</option>)}
        </select>
        {formData.source === "Vendor" && (
          <>
            <input type="text" name="vendorName" placeholder="Vendor Name" required value={formData.vendorName} onChange={handleChange} />
            <input type="text" name="vendorContact" placeholder="Vendor Contact" required value={formData.vendorContact} onChange={handleChange} />
          </>
        )}

        <button  className="submit-btn" type="submit">Add Material</button>
      </form>
    </div>
  );
};

export default MaterialEntry;


