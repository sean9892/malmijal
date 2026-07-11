import { Link } from "react-router"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "../theme-provider"

export function Navbar() {
    const { theme, setTheme } = useTheme()

    function toggleTheme() {
        setTheme(theme === "dark" ? "light" : "dark")
    }
    return (
        <NavigationMenu className="min-w-full max-w-none justify-start border-b border-b-slate-200 dark:border-b-slate-700">
            <NavigationMenuList className="justify-start">
                <NavigationMenuItem>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} render={
                        <Link to="/">
                            <img src={import.meta.env.BASE_URL + "images/logo.png"} alt="Malmijal Logo" className="h-8 w-auto" />
                        </Link>
                    } />
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link to="/image-generate">Image Generator</Link>} />
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link to="/info">Info</Link>} />
                </NavigationMenuItem>
                <NavigationMenuItem className="ml-auto">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label="Toggle color theme"
                    >
                    {/* Visible in light mode */}
                    <Sun className="size-5 dark:hidden" />

                    {/* Visible in dark mode */}
                    <Moon className="hidden size-5 dark:block" />
                    </Button>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
}

export default Navbar