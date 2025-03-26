import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const MaterialInventory = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = () => {
    axios
      .get("http://localhost:5000/api/materials", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        console.log("API Response:", res.data);

        if (Array.isArray(res.data)) {
          setMaterials(res.data);
        } else if (res.data.materials && Array.isArray(res.data.materials)) {
          setMaterials(res.data.materials);
        } else {
          console.error("Unexpected API response format:", res.data);
          setMaterials([]);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching materials:", err);
        setError("Failed to load materials");
        setMaterials([]);
        setLoading(false);
      });
  };

  // ✅ Delete Material
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      axios
        .put(`http://localhost:5000/api/materials/${id}`, { status: "Deleted" }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then(() => {
          alert("Material deleted successfully!");
          fetchMaterials(); // ✅ Refresh inventory
        })
        .catch((err) => {
          console.error("Error deleting material:", err);
          alert("Failed to delete material.");
        });
    }
  };
  

  return (
    <div style={{ padding: "20px" }}>
      <h2>Inventory Management</h2>

      {loading && <p>Loading materials...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <table border="1" style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Expiry Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(materials) && materials.length > 0 ? (
              materials.map((mat) => (
                <tr key={mat._id}>
                  <td>{mat.name}</td>
                  <td>{mat.category}</td>
                  <td>{mat.quantity}</td>
                  <td>{mat.expiryDate ? new Date(mat.expiryDate).toDateString() : "N/A"}</td>
                  <td>
                    {/* ✅ Edit Button */}
                    <button
                      onClick={() => navigate(`/update-material/${mat._id}`)}
                      style={{ marginRight: "10px", background: "blue", color: "white" }}
                    >
                      Edit
                    </button>

                    {/* ✅ Delete Button */}
                    <button
                      onClick={() => handleDelete(mat._id)}
                      style={{ background: "red", color: "white" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>No materials found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MaterialInventory;
