import { useEffect, useState } from "react";
import axios from "axios";
import "./MaterialDetails.css"

const MaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
    .get("http://localhost:5000/api/materials", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    .then((res) => {
      console.log("Materials List API Response:", res.data.materials);
  
      const nonZeroMaterials = res.data.materials.filter(
        (material) => material.quantity > 0
      );
  
      setMaterials(nonZeroMaterials);
    })
    .catch((err) => {
      console.error("Error fetching materials:", err);
      setError("Unable to fetch materials. Please try again later.");
    })
    .finally(() => setLoading(false));
  
  }, []);

  if (error) return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  if (loading) return <p style={{ textAlign: "center" }}>Loading materials...</p>;
  if (!materials.length) return <p style={{ textAlign: "center", fontSize: "18px", color: "gray" }}>No materials available.</p>;

  return (
    <div className="materials-container">
      <h2 className="title">Available Materials</h2>
      <div className="materials-grid">
      {materials.filter(m => m.quantity > 0).map((material) => (

          <div key={material._id} className="material-card">
            <h3>{material.name || "Unnamed Material"}</h3>
            <p><strong>Serial Number:</strong> {material.serialNumber || "N/A"}</p>
            <p><strong>Category:</strong> {material.category || "N/A"}</p>
            <p><strong>Quantity:</strong> {material.quantity || 0}</p>
            <p><strong>Status:</strong> {material.status || "Active"}</p>
            <p><strong>Added By:</strong> {material.addedBy || "Unknown"}</p>
            <p><strong>Created At:</strong> {material.createdAt ? new Date(material.createdAt).toLocaleString() : "N/A"}</p>
            <p><strong>Updated At:</strong> {material.updatedAt ? new Date(material.updatedAt).toLocaleString() : "N/A"}</p>
    
            {material.vendorDetails && material.source === "Vendor" && (
              <>
                <p><strong>Vendor Name:</strong> {material.vendorDetails.name || "N/A"}</p>
                <p><strong>Vendor Contact:</strong> {material.vendorDetails.contact || "N/A"}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaterialList;
