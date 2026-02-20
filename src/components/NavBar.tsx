import React from "react"
import { NavLink, Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/AuthContext"
import { User, ChevronDown, Menu } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
  NavigationMenuIndicator,
} from "@/components/ui/navigation-menu"

import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu.styles"

export type NavItem = {
  id: string
  title: React.ReactNode
  href?: string
  content?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export interface CustomNavbarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: NavItem[]
  collapsibleOnMobile?: boolean
  mobileTriggerIcon?: React.ReactNode
  navigationMenuProps?: Partial<React.ComponentProps<typeof NavigationMenu>>
}

const CustomNavbar: React.FC<CustomNavbarProps> = ({
  items,
  collapsibleOnMobile = true,
  mobileTriggerIcon,
  className,
  navigationMenuProps,
  ...rootProps
}) => {
  const mobileIcon = mobileTriggerIcon ?? <Menu size={18} />

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        "sticky top-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur-md",
        className
      )}
      {...rootProps}
    >
      <div className="mx-auto max-w-7xl px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* ✅ MOBILE MENU */}
          {collapsibleOnMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 rounded-md hover:bg-muted/20" aria-label="Abrir menú">
                  {mobileIcon}
                </button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="w-[320px] p-0 flex flex-col"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <div className="flex flex-col">
                  <span className="text-sm font-semibold text-primary">Menú</span>
                    <span className="text-xs text-muted-foreground">Navegación</span>
                  </div>
                  {/* El X ya lo pone shadcn, esto es opcional */}
                </div>

                {/* Links */}
                <div className="px-3 py-3 flex-1">
                  <nav className="flex flex-col gap-1">
                    {items.map((item) => {
                      const hasDropdown = Boolean(item.content)

                      // Si tiene dropdown, en mobile mejor tratarlo como sección simple
                      if (hasDropdown) {
                        return (
                          <div key={item.id} className="mt-2">
                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {item.title}
                            </div>
                            <div className="pl-2">{item.content}</div>
                          </div>
                        )
                      }

                      return (
                        <SheetClose asChild key={item.id}>
                          <NavLink
                            to={item.href ?? "/"}
                            className={({ isActive }) =>
                              cn(
                                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                                "hover:bg-muted/50",
                                isActive && "bg-teal-50 text-teal-600 font-semibold"
                              )
                            }
                          >
                            <span className="h-8 w-8 rounded-lg bg-muted/60 grid place-items-center group-hover:bg-muted transition">
                              {item.icon ?? <span className="text-xs">•</span>}
                            </span>

                            <span className="flex-1">{item.title}</span>

                            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                              ↵
                            </span>
                          </NavLink>
                        </SheetClose>
                      )
                    })}
                  </nav>
                </div>

                {/* Footer (opcional): acciones como login/logout */}
                <div className="border-t px-5 py-4">
                  <div className="text-xs text-muted-foreground">
                    Fisioterapia RH
                  </div>
                </div>
              </SheetContent>

            </Sheet>
          )}

          {/* ✅ DESKTOP MENU */}
          <NavigationMenu
            {...navigationMenuProps}
            className={cn("hidden md:block", navigationMenuProps?.className)}
          >
            <NavigationMenuList className="flex items-center gap-1">
              {items.map((item) => {
                const hasDropdown = Boolean(item.content)

                if (!hasDropdown) {
                  return (
                    <NavigationMenuItem key={item.id} className={item.className}>
                      <NavigationMenuLink asChild>
                        <NavLink
                          to={item.href ?? "/"}
                          className={({ isActive }) =>
                            cn(
                              navigationMenuTriggerStyle(),
                              "transition-colors",
                              isActive && "bg-teal-50 text-teal-600 font-semibold rounded-xl"
                            )
                          }
                        >
                          <div className="flex items-center gap-2">
                            {item.icon}
                            {item.title}
                          </div>
                        </NavLink>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )
                }

                return (
                  <NavigationMenuItem key={item.id} className={item.className}>
                    <NavigationMenuTrigger>
                      <div className="flex items-center gap-2">
                        {item.icon}
                        {item.title}
                        <ChevronDown className="h-4 w-4 opacity-70" />
                      </div>
                    </NavigationMenuTrigger>

                    <NavigationMenuContent className="w-[300px] p-2">
                      {item.content}
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )
              })}
            </NavigationMenuList>

            <NavigationMenuIndicator />
            <NavigationMenuViewport />
          </NavigationMenu>
        </div>

        <NavActions />
      </div>
    </nav>
  )
}

function NavActions() {
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const navigate = useNavigate()

  if (isLoading) return null

  if (!isAuthenticated || !user) {
    return (
      <Link to="/login">
        <Button className="bg-teal-500 hover:bg-teal-600 text-white shadow-sm rounded-xl px-5">
          Login
        </Button>
      </Link>
    )
  }

  function handleLogout() {
    logout()
    navigate("/")
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/account"
        className={cn(
          "h-10 w-10 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-teal-50 transition-all shadow-sm"
        )}
        aria-label="Cuenta"
        title="Cuenta"
      >
        <User className="h-5 w-5" />
      </Link>

      <Button 
        onClick={handleLogout}
        className="bg-teal-500 hover:bg-teal-600 text-white shadow-sm rounded-xl px-5 transition-all duration-200"
      >
        Salir
      </Button>
    </div>
  )
}

export default CustomNavbar
