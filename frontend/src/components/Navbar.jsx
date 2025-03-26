import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem("name") || User;
  const userRole = localStorage.getItem("role"); 
  const [menuOpen, setMenuOpen] = useState(false); 

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/"); // Ensure user is logged in
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Define role-based options
  const roleBasedOptions = {
    "Admin": [
      { name: "View Reports", path: "/admin-reports" }
    ],
    "Store Manager": [
      { name: "Add Material", path: "/material-entry" }, 
      { name: "View Materials", path: "/materials" },
      { name: "Inventory", path: "/inventory" },
    ],
    "Doctor": [
      { name: "Request Materials", path: "/doctor-request" },
      { name: "View Reports", path: "/doctor-reports" }
    ],
    "Staff": [
      { name: "Issue Materials", path: "/staff-issue" },
      { name: "Track Requests", path: "/staff-track" }
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
      

      <div style={{ position: "relative" }}>
        <button 
          onClick={() => setMenuOpen(!menuOpen)} 
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "18px",
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
      <div style={{ fontSize: "18px" }}>Welcome, {userName}</div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout} 
        style={{ 
          background: "red", 
          color: "white", 
          padding: "8px 12px", 
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
