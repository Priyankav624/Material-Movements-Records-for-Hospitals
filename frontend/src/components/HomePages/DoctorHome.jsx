import React from "react";

const DoctorHome = () => {
    const userName = localStorage.getItem("name");

    const styles = {
      container: {
        fontFamily: "Poppins, sans-serif",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
      },
      title: {
        fontSize: "24px",
        fontWeight: "bold",
      },
    };
  
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Welcome, {userName} 👋</h2>
      </div>
    )
}

export default DoctorHome;