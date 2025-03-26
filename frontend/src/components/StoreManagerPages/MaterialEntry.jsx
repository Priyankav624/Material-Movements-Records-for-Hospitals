import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const MaterialEntry = () => {
  const navigate = useNavigate();
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
      navigate("/inventory");
    } catch (error) {
      console.error("Error adding material:", error.response);
      alert(error.response?.data?.message || "Error adding material");
    }
  };

  return (
    <div>
      <h2>Material Entry</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Material Name" required onChange={handleChange} />
        <select name="category" required onChange={handleChange}>
          <option value="">Select Category</option>
          {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <input type="number" name="quantity" placeholder="Quantity" required onChange={handleChange} />
        <input type="date" name="expiryDate" onChange={handleChange} />
        <select name="source" required onChange={handleChange}>
          <option value="">Select Source</option>
          {sources.map((src) => <option key={src} value={src}>{src}</option>)}
        </select>

        {/* 🔹 Show Vendor Fields Only if Source is Vendor */}
        {formData.source === "Vendor" && (
          <>
            <input type="text" name="vendorName" placeholder="Vendor Name" required onChange={handleChange} />
            <input type="text" name="vendorContact" placeholder="Vendor Contact" required onChange={handleChange} />
          </>
        )}

        <button type="submit">Add Material</button>
      </form>
    </div>
  );
};

export default MaterialEntry;
