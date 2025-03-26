import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Admin");
  const navigate = useNavigate();

  const handleLogin = async () => {
    console.log({ email, password });
    try {
      const res = await axios.post("http://localhost:5000/api/auth/signin", {
        email,
        password,
        role,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("name", res.data.name);

      alert(`Welcome ${res.data.name} (${res.data.role})`);

      if (res.data.role === "Admin") navigate("/Adminhome");
      else if (res.data.role === "Doctor") navigate("/Doctorhome");
      else if (res.data.role === "Store Manager") navigate("/storehome");
      else if (res.data.role === "Staff") navigate("/Staffhome");
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="app-container">
      <div className="login">
        <h2> Login</h2>
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <select onChange={(e) => setRole(e.target.value)} value={role}>
          <option value="Admin">Admin</option>
          <option value="Store Manager">Store Manager</option>
          <option value="Doctor">Doctor</option>
          <option value="Staff">Staff</option>
        </select>
        <br />
        <button onClick={handleLogin}>Sign In</button>
      </div>
    </div>
  );
};

export default Login;