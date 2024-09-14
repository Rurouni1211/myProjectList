import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { createBrowserRouter, RouterProvider, redirect, Navigate } from 'react-router-dom'
import Submit from "./components/Form"
import VideoData from "./VideoData"

function App() {
  
  const router = createBrowserRouter([
  
    {
      
      path: '/',
    element: <VideoData />, // Layout that includes Navbar
    },
    {
      path: '/submit',
      element: <Submit/>,
    },
  
])
  return (
    <>
      <RouterProvider router={router} />
    </>
    
    
    
  
  )
}

export default App
