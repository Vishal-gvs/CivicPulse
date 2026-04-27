// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const location = routerState.location;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate({ to: '/' });
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home', show: true },
    { path: '/dashboard', label: 'Dashboard', show: isAuthenticated },
    { path: '/report-issue', label: 'Report Issue', show: isAuthenticated && user?.role === 'citizen' },
    { path: '/track-issues', label: 'Track Issues', show: isAuthenticated },
    { path: '/feedback', label: 'Feedback', show: isAuthenticated },
    { path: '/analytics', label: 'Analytics', show: isAuthenticated && user?.role === 'admin' },
    { path: '/admin', label: 'Admin Panel', show: isAuthenticated && user?.role === 'admin' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 flex items-center justify-center transform transition-transform group-hover:scale-105">
              <img src="/CivicPulse.png" alt="CivicPulse Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold font-display text-foreground">Civic<span className="text-primary">Pulse</span></span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => 
              link.show && (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  {link.label}
                  {isActive(link.path) && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"></span>
                  )}
                </Link>
              )
            )}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-muted">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground leading-none">{user?.name}</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">{user?.role}</span>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => 
                link.show && (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive(link.path)
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              )}
              
              {isAuthenticated ? (
                <>
                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-muted">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground block">{user?.name}</span>
                        <span className="text-xs text-muted-foreground uppercase">{user?.role}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-3 border-t border-border mt-3">
                  <Button asChild variant="outline" className="w-full justify-center">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                  </Button>
                  <Button asChild className="w-full justify-center">
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>Register</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
