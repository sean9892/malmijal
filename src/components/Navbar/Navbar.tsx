import { Link } from "react-router"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export function Navbar() {
    return (
        <NavigationMenu className="min-w-full max-w-none justify-start border-b border-b-slate-200 dark:border-b-slate-700">
            <NavigationMenuList className="justify-start">
                <NavigationMenuItem>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link to="/index">Home</Link>} />
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
}

export default Navbar