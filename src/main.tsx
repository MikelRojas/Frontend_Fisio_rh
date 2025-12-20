import "./index.css"

import React from "react"
import ReactDOM from "react-dom/client"
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom"

import AppShell from "./layouts/AppShell"

// Pages
import Home from "./pages/Home"
import Appointments from "./pages/Appointments"
import Planner from "./pages/Planner"
import Login from "./pages/Login"

// Puedes crear estos luego si no existen aún
import Account from "./pages/Account"
import Record from "./pages/Record"

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: "appointment", element: <Appointments /> },
      { path: "planner", element: <Planner /> },
      { path: "account", element: <Account /> },
      { path: "record", element: <Record /> },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "*",
    element: <Home />,
  },
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
