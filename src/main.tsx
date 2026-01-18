import "./index.css"

import React, { Suspense } from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { AuthProvider } from "./lib/AuthContext"

import AppShell from "./layouts/AppShell"

// Pages
import Home from "./pages/Home"
import Appointments from "./pages/Appointments"
import Login from "./pages/Login"
import Account from "./pages/Account"
import Records from "./pages/Records"

import ForgotPassword from "./pages/ForgotPassword"
import ForgotPasswordConfirmed from "./pages/ForgotPasswordConfirmed"
import ResetPassword from "./pages/ResetPassword"

import RequireAdmin from "./components/auth/RequireAdmin"
const Planner = React.lazy(() => import("./pages/Planner"))

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: "appointment", element: <Appointments /> },

      {
        element: <RequireAdmin />,
        children: [
          {
            path: "planner",
            element: (
              <Suspense fallback={null}>
                <Planner />
              </Suspense>
            ),
          },
        ],
      },

      { path: "account", element: <Account /> },
      { path: "records", element: <Records /> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/forgot-password/confirmed", element: <ForgotPasswordConfirmed /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "*", element: <Home /> },
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
)
