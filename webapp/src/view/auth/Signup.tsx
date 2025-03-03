import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../utils/firebase";
import { Link } from "react-router-dom";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto", textAlign: "center" }}>
      <h1>March Madness Simulator</h1>
      <h2>Sign Up</h2>
      <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "10px", fontSize: "16px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: "10px", fontSize: "16px" }}
        />
        <button type="submit" style={{ padding: "10px", fontSize: "16px", cursor: "pointer" }}>Sign Up</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <Link to="/" style={{ display: "block", marginTop: "10px", padding: "10px", textDecoration: "none", color: "white", backgroundColor: "gray", borderRadius: "5px" }}>Go to Login</Link>
    </div>
  );
};

export default Signup;