import React from "react";

const StaffHome = () => {
    const userName = localStorage.getItem("name");

    return(
        
      <div style={{ fontSize: "18px" }}>Welcome, {userName}</div>
    )
}

export default StaffHome;