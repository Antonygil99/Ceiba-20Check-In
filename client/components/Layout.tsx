import { Link, Outlet, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-md">✓</div>
            <span className="font-semibold tracking-tight">CEIBA Check In</span>
          </Link>
          <div className="hidden md:flex items-center gap-2"></div>
        </div>
      </header>
      <main className="container py-8">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} CEIBA Check In
      </footer>
    </div>
  );
}
