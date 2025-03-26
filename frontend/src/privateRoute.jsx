import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const userRole = localStorage.getItem("role");

  // Check if role is an array (multiple roles) or a single string
  const isAuthorized = Array.isArray(role) ? role.includes(userRole) : userRole === role;

  if (!userRole || !isAuthorized) {
    alert("Access Denied!");
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
