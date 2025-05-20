import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // ✅ hook for navigation

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/submit'); // ✅ redirect on success
    } catch (err) {
      setError('Login failed: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };
if (user) navigate('/submit');


  if (user) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
        <p className="mb-4">Welcome, {user.email}</p>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto p-6 bg-white rounded shadow space-y-4">
      <h2 className="text-xl font-semibold">Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        required
        onChange={e => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        required
        onChange={e => setPassword(e.target.value)}
        className="w-full p-2 border rounded"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
        Login
      </button>
    </form>
  );
}
