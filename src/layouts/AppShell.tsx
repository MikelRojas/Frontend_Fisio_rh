import { Outlet } from "react-router"
import CustomNavbar from "@/components/NavBar"
import type { NavItem } from "@/components/NavBar"


export default function AppShell() {
  const navbarItems: NavItem[] = [
    { id: "home", title: "Home", href: "/" },
    { id: "appointments", title: "Citas", href: "/appointment" },
    { id: "planner", title: "Agenda", href: "/planner" },
    { id: "record", title: "Expediente", href: "/record" },
    { id: "example", title: "example", href: "/example" },

  ]

  return (
    <>
      <CustomNavbar items={navbarItems} />
      <main className="p-6">
        <Outlet />
      </main>
    </>
  )
}
