import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { createBrowserRouter, RouterProvider, redirect, Navigate } from 'react-router-dom'
import Submit from "./components/Form"
import VideoData from "./VideoData"
import Layout from "./Layout"
import PrivateRoute from './components/PrivateRoute'
import LoginForm from './components/LoginForm'

function App() {
  
  const router = createBrowserRouter([
  
    {
      path: '/',
    element: <Layout />, // Layout that includes Navbar
    children: [
      {
        path: '',
        element:  <VideoData /> ,
      },
      {
    path: 'submit',
        element: (
          <PrivateRoute>
            <Submit />
          </PrivateRoute>
        ),
      },
     
        {
        path: 'login',
        element: <LoginForm />
      }
    ]
    }
  
])
  return (
    <>
      <RouterProvider router={router}  />
    </>
    
    
    
  
  )
}

export default App
