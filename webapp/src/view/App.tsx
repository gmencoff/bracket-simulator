import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import Dashboard from './Dashboard';
import { auth } from '../utils/firebase';
import { useAuthState } from "react-firebase-hooks/auth";

const App = () => {

  const [user] = useAuthState(auth); // Get the current user

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={!user ? <Login /> : <Navigate to="/dashboard" />}
        />
        
        <Route
          path="/signup"
          element={!user ? <Signup /> : <Navigate to="/dashboard" />}
        />
        
        {/* If the user is not logged in, redirect to the login page */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
};

export default App;
