import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./UpdateMaterial.css";

const UpdateMaterial = () => {
  
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState({
    name: "",
    category: "",
    quantity: "",
    expiryDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categoryOptions = ["Reusable", "Consumable", "Hazardous", "Critical"];

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/materials/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        const materialData = res.data;

        console.log("Fetched Material Data:", materialData); // Debugging log

        // ✅ Fix category selection by ignoring case
        const selectedCategory =
          categoryOptions.find(
            (cat) => cat.toLowerCase() === materialData.category.toLowerCase()
          ) || categoryOptions[0]; // Default if no match

        // ✅ Format expiry date for <input type="date">
        const formattedExpiryDate = materialData.expiryDate
          ? materialData.expiryDate.split("T")[0]
          : "";

        setMaterial({
          name: materialData.name,
          category: selectedCategory,
          quantity: materialData.quantity,
          expiryDate: formattedExpiryDate,
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching material:", err);
        setError("Failed to load material");
        setLoading(false);
      });
  }, [id]);

  // ✅ Update Material
  const handleSubmit = (e) => {
    e.preventDefault();
  
    const token = localStorage.getItem("token");
    console.log("Token being sent:", token); // Debugging log
  
    axios
      .put(`http://localhost:5000/api/materials/${id}`, material, {
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` // ✅ Ensure token is sent
        },
      })
      .then(() => {
        alert("Material updated successfully!");
        navigate("/inventory");
      })
      .catch((err) => {
        console.error("Error updating material:", err.response);
        alert(err.response?.data?.message || "Failed to update material.");
      });
  };  

  return (
    <div className="update-material-container">
      <h2>Edit Material</h2>

      {loading && <p className="loading-message">Loading...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <form className="update-material-form" onSubmit={handleSubmit}>
          <label>Name:</label>
          <input
            type="text"
            value={material.name}
            onChange={(e) => setMaterial({ ...material, name: e.target.value })}
            required
          />

          <label>Category:</label>
          <select
            value={material.category} // ✅ Fixed category selection
            onChange={(e) =>
              setMaterial({ ...material, category: e.target.value })
            }
            required
          >
            {categoryOptions.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>

          <label>Quantity:</label>
          <input
            type="number"
            value={material.quantity}
            onChange={(e) =>
              setMaterial({ ...material, quantity: e.target.value })
            }
            required
          />

          <label>Expiry Date:</label>
          <input
            type="date"
            value={material.expiryDate}
            onChange={(e) =>
              setMaterial({ ...material, expiryDate: e.target.value })
            }
          />

          <button type="submit">Update</button>
        </form>
      )}
    </div>
  );
};

export default UpdateMaterial;