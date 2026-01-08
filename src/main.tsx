import "./index.css"

import React from "react"
import ReactDOM from "react-dom/client"
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom"
import { AuthProvider } from "./lib/AuthContext";

import AppShell from "./layouts/AppShell"

// Pages
import Home from "./pages/Home"
import Appointments from "./pages/Appointments"
import Planner from "./pages/Planner"
import Login from "./pages/Login"
import {ComboboxDemo} from "./components/FunctionCbox"

import Account from "./pages/Account"
import Record from "./pages/Record"
import Records from "./pages/Records";

import ForgotPassword from "./pages/ForgotPassword";
import ForgotPasswordConfirmed from "./pages/ForgotPasswordConfirmed";
import ResetPassword from "./pages/ResetPassword";

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
      { path: "example", element: <ComboboxDemo /> },
      { path: "records", element: <Records /> },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  { 
    path: "/forgot-password", 
    element: <ForgotPassword /> 
  },
  { 
    path: "/forgot-password/confirmed", 
    element: <ForgotPasswordConfirmed /> 
  },
  { 
    path: "/reset-password", 
    element: <ResetPassword /> 
  },
  {
    path: "*",
    element: <Home />,
  },
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
)
