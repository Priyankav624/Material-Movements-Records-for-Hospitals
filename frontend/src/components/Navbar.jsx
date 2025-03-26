import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem("name") || "User";
  const userRole = localStorage.getItem("role");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Role-based Navigation Links
  const roleBasedOptions = {
    "Admin": [
      { name: "Dashboard", path: "/adminHome" },
      { name: "Create Users", path: "/createusers" },
      { name: "Approve Requests", path: "/manage-requests" }
    ],
    "Store Manager": [
      { name: "Dashboard", path: "/storeHome" },
      { name: "Add Material", path: "/material-entry" },
      { name: "Manage Inventory", path: "/inventory" },
      { name: "View Materials", path: "/materials" },
      { name: "Approve Requests", path: "/manage-requests" }
    ],
    "Doctor": [
      { name: "Dashboard", path: "/doctorHome" },
      { name: "Request Materials", path: "/request-material" },
      { name: "Track Requests", path: "/track-requests" } 
    ],
    "Staff": [
      { name: "Dashboard", path: "/staffHome" },
      { name: "Request Materials", path: "/request-material" },
      { name: "Track Requests", path: "/track-requests" } 
    ]
  };

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 20px",
      background: "#282c34",
      color: "white"
    }}>
      {/* Menu Button */}
      <div style={{ position: "relative" }}>
        <button 
          onClick={() => setMenuOpen(!menuOpen)} 
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "19px",
            cursor: "pointer"
          }}
        >
          ☰
        </button>
        
        {menuOpen && (
          <div style={{
            position: "absolute",
            left: 0,
            top: "30px",
            background: "white",
            color: "black",
            boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
            borderRadius: "4px",
            minWidth: "180px",
            zIndex: 1000
          }}>
            {roleBasedOptions[userRole]?.map((item, index) => (
              <div 
                key={index} 
                onClick={() => { navigate(item.path); setMenuOpen(false); }} 
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  borderBottom: index !== roleBasedOptions[userRole].length - 1 ? "1px solid #ddd" : "none"
                }}
              >
                {item.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Welcome Message */}
      <div style={{ fontSize: "28px" }}>Welcome, {userName}</div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout} 
        style={{ 
          width: "100px",
          background: "grey", 
          color: "white", 
          padding: "6px 12px", 
          border: "none", 
          cursor: "pointer" 
        }}
      >
        Logout
      </button>

    </nav>
  );
};

export default Navbar;
