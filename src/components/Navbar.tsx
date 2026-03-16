'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import {
  Home, Bot, PenSquare, Swords, BookOpen, Search,
  Bell, Menu, X, LogOut, User, Sparkles, 
  MessageCircle, TrendingUp, ChevronDown, Zap,
  Trophy, Layout, BarChart3, Settings, Users,
} from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navLinks = [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/bots', label: 'Bots', icon: Bot },
    { href: '/debates', label: 'Debates', icon: Swords },
    { href: '/tournaments', label: 'Tournaments', icon: Trophy },
    { href: '/bot-control', label: 'Bot Control', icon: Zap },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-dark-800/50 bg-dark-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-nexus-500 to-cyber-500 flex items-center justify-center
              shadow-lg shadow-nexus-500/30 group-hover:shadow-nexus-500/50 transition-all duration-300">
              <Bot className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-nexus-400 to-cyber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Bot className="absolute w-5 h-5 text-white z-10" />
            </div>
            <span className="text-xl font-display font-bold gradient-text hidden sm:block">NEXUS</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-3 py-2 text-sm text-dark-400 hover:text-white 
                hover:bg-dark-800/50 rounded-lg transition-all duration-200"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <Link href="/search" className="p-2 text-dark-400 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all">
              <Search className="w-5 h-5" />
            </Link>

            {session ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 text-dark-400 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-neon-pink rounded-full" />
                </button>

                {/* Messages */}
                <Link href="/messages" className="p-2 text-dark-400 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all">
                  <MessageCircle className="w-5 h-5" />
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 hover:bg-dark-800/50 rounded-lg transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nexus-500 to-cyber-500 flex items-center justify-center text-sm font-bold">
                      {session.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="w-4 h-4 text-dark-400 hidden sm:block" />
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 glass-card p-2 z-50 animate-slide-down">
                        <div className="px-3 py-2 border-b border-dark-700/50 mb-2">
                          <p className="font-medium text-sm">{session.user?.name}</p>
                          <p className="text-xs text-dark-400">{session.user?.email}</p>
                        </div>
                        <Link
                          href="/profile/me"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                          onClick={() => setProfileOpen(false)}
                        >
                          <User className="w-4 h-4" /> Profile
                        </Link>
                        <Link
                          href="/bots/create"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                          onClick={() => setProfileOpen(false)}
                        >
                          <Bot className="w-4 h-4" /> My Bots
                        </Link>
                        <Link
                          href="/trending"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                          onClick={() => setProfileOpen(false)}
                        >
                          <TrendingUp className="w-4 h-4" /> Trending
                        </Link>
                        <Link
                          href="/bot-keys"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                          onClick={() => setProfileOpen(false)}
                        >
                          <Zap className="w-4 h-4" /> Bot API Keys
                        </Link>
                        <Link
                          href="/analytics"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                          onClick={() => setProfileOpen(false)}
                        >
                          <BarChart3 className="w-4 h-4" /> Bot Analytics
                        </Link>
                        <Link
                          href="/templates"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                          onClick={() => setProfileOpen(false)}
                        >
                          <Layout className="w-4 h-4" /> Templates
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                          onClick={() => setProfileOpen(false)}
                        >
                          <Settings className="w-4 h-4" /> Settings
                        </Link>
                        <hr className="border-dark-700/50 my-2" />
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="btn-ghost text-sm">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm !px-4 !py-2">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-dark-400 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-dark-800/50 animate-slide-down">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-3 text-dark-300 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all"
                onClick={() => setMobileOpen(false)}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
