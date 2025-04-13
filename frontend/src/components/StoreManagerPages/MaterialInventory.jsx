import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./MaterialInventory.css"; 

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

        if (Array.isArray(res.data) && res.data.length > 0) {
          setMaterials(res.data);
        } else if (res.data.materials && Array.isArray(res.data.materials) && res.data.materials.length > 0) {
          setMaterials(res.data.materials);
        } else {
          setMaterials([]); // ✅ Explicitly setting empty array
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching materials:", err);
        setError("Unable to retrieve materials. Please try again later.");
        setMaterials([]);
        setLoading(false);
      });
  };

  const handleDelete = async (id) => {
    if (!localStorage.getItem("token")) {
      alert("Unauthorized: Please log in.");
      return;
    }
  
    if (window.confirm("Are you sure you want to delete this material?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.delete(`http://localhost:5000/api/materials/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        alert("Material deleted successfully!");
        fetchMaterials(); // Refresh list
      } catch (error) {
        console.error("Error deleting material:", error);
        if (error.response?.status === 403) {
          alert("You do not have permission to delete materials.");
        } else {
          alert("Failed to delete material. Please try again.");
        }
      }
    }
  };  

  return (
    <div className="inventory-container">
    <h2 className="inventory-title">Inventory Management</h2>

    {loading && <p className="loading-message">Loading materials...</p>}
    {error && <p className="error-message">{error}</p>}

    {!loading && !error && (
      <table className="inventory-table">
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
         materials.filter((mat) => mat.quantity > 0).map((mat) => (
              <tr key={mat._id}>
                <td>{mat.name}</td>
                <td>{mat.category}</td>
                <td>{mat.quantity}</td>
                <td>
                  {mat.expiryDate
                    ? new Date(mat.expiryDate).toDateString()
                    : "N/A"}
                </td>
                <td>
                  {/* ✅ Edit Button */}
                  <button
                    onClick={() => navigate(`/update-material/${mat._id}`)}
                    className="action-btn edit-btn"
                  >
                    Edit
                  </button>

                  {/* ✅ Delete Button */}
                  <button
                    onClick={() => handleDelete(mat._id)}
                    className="action-btn delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No materials found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    )}
  </div>
);
};


export default MaterialInventory;
