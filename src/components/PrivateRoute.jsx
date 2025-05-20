// components/PrivateRoute.jsx
import React, { useEffect, useState } from 'react';
import { auth } from '../firebase/firebase';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) return null; // or loading spinner

  return user ? children : <Navigate to="/login" />;
}
