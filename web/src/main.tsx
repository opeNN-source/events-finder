import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css';
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import Login from './pages/Login.tsx'
import EventsList from "./pages/EventsList.tsx";
import EventPage from "./pages/EventPage.tsx";
import Settings from "./pages/Settings.tsx";
import ProtectedRoute from "./components/shared/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login/>,
  },
  {
    path: "/events",
    element: (
      <ProtectedRoute>
        <EventsList/>
      </ProtectedRoute>
    )
  },
  {
    path: "/events/:eventId",
    element: (
      <ProtectedRoute>
        <EventPage/>
      </ProtectedRoute>
    )
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <Settings/>
      </ProtectedRoute>
    )
  }
], {
  basename: '/web'
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)