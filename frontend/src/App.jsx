import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Login from "./components/Login.jsx";
import ProtectedRoute from "./privateRoute.jsx";
import Navbar from "./components/Navbar";
import CreateUser from "./components/CreateUser.jsx";
import AdminHome from "./components/HomePages/AdminHome.jsx";
import StoreHome from "./components/HomePages/StoreHome.jsx";
import DoctorHome from "./components/HomePages/DoctorHome.jsx";
import StaffHome from "./components/HomePages/StaffHome.jsx";
import MaterialEntry from "./components/StoreManagerPages/MaterialEntry.jsx";
import Inventory from "./components/StoreManagerPages/MaterialInventory.jsx";
import UpdateMaterial from "./components/StoreManagerPages/UpdateMaterial.jsx";
import ViewMaterials from "./components/StoreManagerPages/MaterialDetails.jsx";

const Layout = ({ children }) => {
  const location = useLocation();
  return (
    <>
      {location.pathname !== "/" && <Navbar />}
      {children}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/adminHome" element={<ProtectedRoute role="Admin"><AdminHome /></ProtectedRoute>} />
          <Route path="/doctorHome" element={<ProtectedRoute role="Doctor"><DoctorHome /></ProtectedRoute>} />
          <Route path="/staffHome" element={<ProtectedRoute role="Staff"><StaffHome /></ProtectedRoute>} />
          
          <Route path="/storeHome" element={<ProtectedRoute role="Store Manager"><StoreHome /></ProtectedRoute>} />
          <Route path="/material-entry" element={<ProtectedRoute role="Store Manager"><MaterialEntry /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute role="Store Manager"><Inventory /></ProtectedRoute>} />
          <Route path="/update-material/:id" element={<ProtectedRoute role="Store Manager"><UpdateMaterial /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute role="Store Manager"><ViewMaterials /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/createusers" element={<ProtectedRoute role="Admin"><CreateUser /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
