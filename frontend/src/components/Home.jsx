import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showNavbar = ["/"].includes(location.pathname);

  return (
    <div>
      {showNavbar && (
        <nav style={{
          margin : "0",
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          background: "grey", 
          color: "white", 
          padding: "10px 20px"
        }}>
          <h2 
            style={{ cursor: "pointer", margin: 0 }} 
            onClick={() => navigate("/")}
          >
            Hospital Management 
          </h2>
          <div>
            <button 
              onClick={() => navigate("/login")} 
              style={{ margin: "0 10px", background: "white", color: "#007bff", border: "none", padding: "5px 10px", cursor: "pointer" }}
            >
              Login
            </button>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <h1>Welcome to Material Movement Record System</h1>
        <p>Manage hospital materials efficiently.</p>
      </div>
    </div>
  );
};

export default Home;
