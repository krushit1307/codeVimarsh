import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Info, Calendar, Users, Mail, Menu, X, User, LogOut, BookOpen, UserCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "About", href: "/#about", icon: Info },
  { label: "Events", href: "/#events", icon: Calendar },
  { label: "Team", href: "/#team", icon: Users },
  { label: "Resources", href: "/#resources", icon: BookOpen },
  { label: "Contact", href: "/#contact", icon: Mail },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("home");
  const location = useLocation();
  const { user, signOut } = useSupabaseAuth();
  const { isAdmin, admin } = useAdminAuth();

  const adminDisplayName =
    String(admin?.name || "").trim() || String(admin?.email || "").split("@")[0] || "Admin";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("route");
      return;
    }

    const ids = ["about", "events", "team", "resources", "contact"];
    if (location.hash && location.hash.startsWith("#")) {
      const hashId = location.hash.slice(1);
      if (ids.includes(hashId)) setActiveSection(hashId);
      else setActiveSection("home");
    } else {
      setActiveSection("home");
    }

    let raf: number | null = null;
    const compute = () => {
      raf = null;
      if (location.pathname !== "/") return;

      const navOffset = 120;
      const currentY = window.scrollY + navOffset;

      let current: string = "home";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.offsetTop;
        if (top <= currentY) current = id;
      }

      if (window.scrollY < 80) current = "home";
      setActiveSection(current);
    };

    const onScrollOrResize = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(compute);
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    compute();

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [location.pathname, location.hash]);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    if (href.startsWith("/#")) {
      const elementId = href.replace("/#", "");
      const element = document.getElementById(elementId);
      if (element) {
        setActiveSection(elementId);
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else if (href === "/") {
      setActiveSection("home");
    }
  };

  const isItemActive = (href: string) => {
    if (href === "/") return location.pathname === "/" && (activeSection === "home" || activeSection === "route");
    if (href.startsWith("/#")) {
      const id = href.replace("/#", "");
      return location.pathname === "/" && activeSection === id;
    }
    return location.pathname === href;
  };

  const navLinkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 relative",
      active
        ? "text-foreground bg-secondary/60 ring-1 ring-orange-500/40 shadow-md shadow-orange-500/10"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
    );

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-xl border-b border-border/30 shadow-lg shadow-black/20"
          : "bg-background/60 backdrop-blur-md"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden">
              <img src="/logo.png" alt="Code Vimarsh" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-semibold text-xl hidden sm:block">
              <span className="text-gradient-orange">Code</span> Vimarsh
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => handleNavClick(item.href)}
                className={navLinkClass(isItemActive(item.href))}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={navLinkClass(location.pathname.startsWith("/admin"))}
              >
                <span>Admin</span>
              </Link>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <Button
                  variant="outline_orange"
                  size="sm"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  {user.user_metadata?.firstName || user.user_metadata?.first_name || "User"}
                </Button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium">
                        {user.user_metadata?.firstName || user.user_metadata?.first_name || "User"}
                      </p>
                      <button
                        onClick={() => {
                          window.open('/profile', '_blank');
                          setIsUserMenuOpen(false);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline cursor-pointer flex items-center gap-1"
                        title="Open profile in new window"
                      >
                        {user.email}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-secondary/50 transition-colors"
                    >
                      <UserCircle className="w-4 h-4 mr-2 inline" />
                      Profile
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        signOut();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full justify-start px-4 py-2 text-left"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>
            ) : isAdmin ? (
              <div className="relative">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-orange-500/55 via-orange-400/25 to-primary/40 blur-xl" />
                <div className="relative px-6 py-3 rounded-full border border-orange-500/50 bg-background/70 backdrop-blur-md shadow-xl shadow-orange-500/20">
                  <span className="font-display font-bold text-base tracking-wide">
                    <span className="text-gradient-orange">{adminDisplayName}</span>
                  </span>
                </div>
              </div>
            ) : (
              <>
                <Link to="/sign-in">
                  <Button variant="outline_orange" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/join-us">
                  <Button variant="hero" size="sm">
                    Join Us
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border overflow-hidden transition-all duration-300",
          isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isItemActive(item.href)
                  ? "text-foreground bg-secondary/60 ring-1 ring-orange-500/40 shadow-md shadow-orange-500/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                location.pathname.startsWith("/admin")
                  ? "text-foreground bg-secondary/60 ring-1 ring-orange-500/40 shadow-md shadow-orange-500/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <span>Admin</span>
            </Link>
          )}
          {user && (
            <button
              onClick={() => {
                window.open('/profile', '_blank');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            >
              <UserCircle className="w-5 h-5" />
              <span>Profile (New Window)</span>
            </button>
          )}
          <div className="flex gap-3 mt-4 pt-4 border-t border-border">
            {user ? (
              <>
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg">
                  <User className="w-4 h-4" />
                  <div className="flex-1">
                    <span className="text-sm font-medium block">
                      {user.user_metadata?.firstName || user.user_metadata?.first_name || "User"}
                    </span>
                    <button
                      onClick={() => window.open('/profile', '_blank')}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline cursor-pointer flex items-center gap-1"
                      title="Open profile in new window"
                    >
                      {user.email}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <Button
                  variant="outline_orange"
                  className="flex-1"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : isAdmin ? (
              <div className="flex-1 relative">
                <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-orange-500/55 via-orange-400/25 to-primary/40 blur-xl" />
                <div className="relative overflow-hidden rounded-xl border border-orange-500/50 bg-background/70 backdrop-blur-md px-4 py-3">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-transparent to-primary/10" />
                  <div className="relative flex items-center justify-center">
                    <span className="text-base font-bold">
                      <span className="text-gradient-orange">{adminDisplayName}</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/sign-in" className="flex-1">
                  <Button variant="outline_orange" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/join-us" className="flex-1">
                  <Button variant="hero" className="w-full">
                    Join Us
                  </Button>
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
