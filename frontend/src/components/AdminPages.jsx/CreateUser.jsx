import { useState } from "react";
import axios from "axios";
import "./CreateUser.css"

const CreateUser = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Doctor");

  const handleCreateUser = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post("http://localhost:5000/api/auth/create-user", { name, email, password, role },
        {
          headers: {
            Authorization: `Bearer ${token}`, // 🔹 Send token in request
          },
        }
      );
      alert("User Created Successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Error Creating User");
    }
  };

  return (
    <div className="create-user-container">
    <h1 className="title">Create Users</h1>
    <div className="form-container">
      <label>User Name </label>
      <input
        type="text"
        placeholder="Name"
        onChange={(e) => setName(e.target.value)}
      />
      <label>Email </label>
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <label>Password</label>
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <select onChange={(e) => setRole(e.target.value)} value={role}>
        <option value="Doctor">Doctor</option>
        <option value="Store Manager">Store Manager</option>
        <option value="Staff">Staff</option>
      </select>
      <button onClick={handleCreateUser}>Create User</button>
    </div>
  </div>
  );
};

export default CreateUser;
