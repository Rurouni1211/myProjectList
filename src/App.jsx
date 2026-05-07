import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Submit from './components/Form';
import VideoData from './VideoData';
import Layout from './Layout';
import PrivateRoute from './components/PrivateRoute';
import LoginForm from './components/LoginForm';
import AdminVideoManage from './AdminVideoManage';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          path: '',
          element: <VideoData />,
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
          path: 'admin/videos',
          element: (
            <PrivateRoute>
              <AdminVideoManage />
            </PrivateRoute>
          ),
        },
        {
          path: 'login',
          element: <LoginForm />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;