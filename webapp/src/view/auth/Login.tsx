// Login.js
import React, { useState } from 'react';
import { auth } from '../../utils/firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/dashboard");
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto", textAlign: "center" }}>
            <h1>March Madness Simulator</h1>
            <h2>Login</h2>
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                <button type="submit" style={{ padding: "10px", fontSize: "16px", cursor: "pointer" }}>Login</button>
            </form>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <Link to="/signup" style={{ display: "block", marginTop: "10px", padding: "10px", textDecoration: "none", color: "white", backgroundColor: "gray", borderRadius: "5px" }}>Go to Sign Up</Link>
        </div>
    );
}

export default Login;