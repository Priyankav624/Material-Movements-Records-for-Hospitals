import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

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
        const selectedCategory = categoryOptions.find(
          (cat) => cat.toLowerCase() === materialData.category.toLowerCase()
        ) || categoryOptions[0]; // Default if no match

        // ✅ Format expiry date for <input type="date">
        const formattedExpiryDate = materialData.expiryDate ? materialData.expiryDate.split("T")[0] : "";

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

    axios
      .put(`http://localhost:5000/api/materials/${id}`, material, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(() => {
        alert("Material updated successfully!");
        navigate("/inventory");
      })
      .catch((err) => {
        console.error("Error updating material:", err);
        alert("Failed to update material.");
      });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Edit Material</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <form onSubmit={handleSubmit}>
          <label>Name:</label>
          <input
            type="text"
            value={material.name}
            onChange={(e) => setMaterial({ ...material, name: e.target.value })}
            required
          />
          <br />

          <label>Category:</label>
          <select
            value={material.category} // ✅ Fixed category selection
            onChange={(e) => setMaterial({ ...material, category: e.target.value })}
            required
          >
            {categoryOptions.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
          <br />

          <label>Quantity:</label>
          <input
            type="number"
            value={material.quantity}
            onChange={(e) => setMaterial({ ...material, quantity: e.target.value })}
            required
          />
          <br />

          <label>Expiry Date:</label>
          <input
            type="date"
            value={material.expiryDate}
            onChange={(e) => setMaterial({ ...material, expiryDate: e.target.value })}
          />
          <br />

          <button type="submit" style={{ background: "green", color: "white" }}>
            Update
          </button>
        </form>
      )}
    </div>
  );
};

export default UpdateMaterial;
