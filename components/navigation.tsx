"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Droplets, Menu, LogOut } from "lucide-react"

interface NavigationProps {
  onLogout?: () => void
}

export default function Navigation({ onLogout }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { href: "/", label: "Tableau de Bord", icon: "📊" },
    { href: "/employees", label: "Employés", icon: "👥" },
    { href: "/payroll", label: "Paie", icon: "💵" },
    { href: "/suppliers", label: "Fournisseurs", icon: "🚚" },
    { href: "/purchases", label: "Achats d'Huile", icon: "🫒" },
    { href: "/pressing", label: "Pressage", icon: "⚙️" },
    { href: "/tanks", label: "Citernes", icon: "🏭" },
    { href: "/sales", label: "Ventes", icon: "💰" },
    { href: "/maintenance", label: "Maintenance", icon: "🔧" },
    { href: "/pomace", label: "Grignons", icon: "🌾" },
    { href: "/settings", label: "Paramètres", icon: "⚙️" },
  ]

  return (
    <header className="border-b border-border/50 bg-card shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors p-2">
            <Droplets className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold text-foreground hidden sm:inline">Huilerie</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button 
                variant="ghost" 
                className={`text-sm ${pathname === link.href ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onLogout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-2 pt-6">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${pathname === link.href ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
                    >
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
