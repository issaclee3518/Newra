"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ConditionalNavbar() {
    const pathname = usePathname();
    const isDashboardPage = pathname.includes("/Dashboard");
    
    if (isDashboardPage) {
        return null;
    }
    
    return <Navbar />;
}

export function Navbar() {
    const pathname = usePathname();
    const isAuthPage = pathname.includes("/auth");

    const links = [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "Contact", href: "#contact" },
    ];

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-transparent backdrop-blur-sm"
        >
            {/* Left: Logo + Brand Name OR Back Button */}
            {isAuthPage ? (
                <Link
                    href="/"
                    className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 backdrop-blur-md">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-5 h-5"
                        >
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </div>
                    <span className="text-xl font-semibold">Back</span>
                </Link>
            ) : (
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 backdrop-blur-md">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            stroke="none"
                            className="w-6 h-6 text-neutral-800 dark:text-neutral-100 transform rotate-[-45deg] translate-x-1 translate-y-1"
                        >
                            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        Thumbnail
                    </span>
                </Link>
            )}

            {/* Center: Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
                {links.map((link) => (
                    <a
                        key={link.name}
                        href={link.href}
                        className="text-base font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        {link.name}
                    </a>
                ))}
            </div>

            {/* Right: Get Started Button */}
            <div className="flex items-center">
                <Link
                    href="/auth"
                    className="rounded-full px-6 py-2 text-base font-semibold 
            bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 
            text-neutral-900 dark:text-white transition-all duration-300 
            border border-black/5 dark:border-white/10"
                >
                    Get Started
                </Link>
            </div>
        </motion.nav>
    );
}
