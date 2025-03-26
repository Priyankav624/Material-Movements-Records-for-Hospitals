import { useEffect, useState } from "react";
import axios from "axios";

const MaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/materials", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      .then((res) => {
        console.log("Materials List API Response:", res.data.materials);
        setMaterials(res.data.materials);
      })
      .catch(() => setError("Failed to fetch materials"));
  }, []);

  if (error) return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  if (!materials.length) return <p style={{ textAlign: "center" }}>Loading materials...</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>All Materials</h2>
      <div style={styles.list}>
        {materials.map((material) => (
          <div key={material._id} style={styles.card}>
            <h3>{material.name}</h3>
            <p><strong>Serial Number:</strong> {material.serialNumber || "N/A"}</p>
            <p><strong>Category:</strong> {material.category}</p>
            <p><strong>Quantity:</strong> {material.quantity}</p>
            <p><strong>Status:</strong> {material.status || "Active"}</p>
            <p><strong>Added By:</strong> {material.addedBy || "Unknown"}</p>
            <p><strong>Created At:</strong> {new Date(material.createdAt).toLocaleString()}</p>
            <p><strong>Updated At:</strong> {new Date(material.updatedAt).toLocaleString()}</p>
            
            {/* ✅ Vendor Details */}
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

const styles = {
  container: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: "24px",
    marginBottom: "10px",
    color: "#333",
  },
  list: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    width: "90%",
  },
  card: {
    background: "#f9f9f9",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    lineHeight: "1.6",
  },
};

export default MaterialList;
