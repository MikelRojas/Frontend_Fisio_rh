// npx shadcn@latest add navigation-menu

import React from "react"
import { NavLink } from "react-router-dom"

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
  NavigationMenuIndicator,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

import { cn } from "@/lib/utils"
import { ChevronDown, Menu } from "lucide-react"

// ----------------------------------------------
// TYPES
// ----------------------------------------------

export type NavItem = {
  id: string
  title: React.ReactNode
  href?: string
  content?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export interface CustomNavbarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  items: NavItem[]
  collapsibleOnMobile?: boolean
  mobileTriggerIcon?: React.ReactNode
  navigationMenuProps?: Partial<
    React.ComponentProps<typeof NavigationMenu>
  >
}

// ----------------------------------------------
// NAVBAR COMPONENT
// ----------------------------------------------

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
        "relative z-40 border-b bg-background/80 backdrop-blur-sm",
        className
      )}
      {...rootProps}
    >
      <div className="mx-auto max-w-[1280px] px-4 py-3 flex items-center">
        {/* ---------- MOBILE BUTTON (placeholder) ---------- */}
        {collapsibleOnMobile && (
          <button
            className="md:hidden mr-4 p-2 rounded-md hover:bg-muted/20"
            onClick={() =>
              console.log("TODO: implementar menú mobile")
            }
          >
            {mobileIcon}
          </button>
        )}

        {/* ---------- MAIN NAVIGATION ---------- */}
        <NavigationMenu
          {...navigationMenuProps}
          className={cn(
            "hidden md:block",
            navigationMenuProps?.className
          )}
        >
          <NavigationMenuList className="flex items-center gap-1">
            {items.map((item) => {
              const hasDropdown = Boolean(item.content)

              // ---------------- LINK NORMAL ----------------
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
                            isActive &&
                              "bg-muted text-primary font-semibold"
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

              // ---------------- DROPDOWN ----------------
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
    </nav>
  )
}

export default CustomNavbar
