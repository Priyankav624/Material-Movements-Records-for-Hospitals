import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const userRole = localStorage.getItem("role");

  if (!userRole || userRole !== role) {
    alert("Access Denied!");
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
