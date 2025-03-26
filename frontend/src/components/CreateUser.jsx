import { useState } from "react";
import axios from "axios";

const CreateUser = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Doctor");

  const handleCreateUser = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/create-user", { name, email, password, role });
      alert("User Created Successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Error Creating User");
    }
  };

  return (
    <div>
      <h2>Admin Dashboard - Create Users</h2>
      <input type="text" placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <br />
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <br />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <br />
      <select onChange={(e) => setRole(e.target.value)} value={role}>
        <option value="Doctor">Doctor</option>
        <option value="Store Manager">Store Manager</option>
        <option value="Staff">Staff</option>
      </select>
      <br />
      <button onClick={handleCreateUser}>Create User</button>
    </div>
  );
};

export default CreateUser;
