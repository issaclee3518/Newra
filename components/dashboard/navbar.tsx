"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSession, logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { PricingModal } from "./PricingModal";

export function DashboardNavbar() {
    const [user, setUser] = useState<any>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const router = useRouter();
    const profileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const session = await getSession();
            if (session) {
                setUser(session.user);
            }
        } catch (error) {
            console.error("Failed to load user:", error);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.push("/auth");
        } catch (error) {
            console.error("Failed to logout:", error);
        }
    };

    const getInitials = (email: string) => {
        return email.charAt(0).toUpperCase();
    };

    // 외부 클릭 시 팝오버 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target as Node)
            ) {
                setShowProfileMenu(false);
            }
        };

        if (showProfileMenu) {
            // 약간의 지연을 두어 버튼 클릭 이벤트가 먼저 처리되도록
            setTimeout(() => {
                document.addEventListener("mousedown", handleClickOutside);
            }, 0);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showProfileMenu]);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
            <div className="w-full px-8 md:px-12 lg:px-16">
                <div className="flex items-center justify-between h-16">
                    {/* 로고 */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                stroke="none"
                                className="w-6 h-6 text-white transform rotate-[-45deg] translate-x-1 translate-y-1"
                            >
                                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white">
                            Thumbnail
                        </h1>
                    </div>

                    {/* 사용자 프로필 */}
                    <div className="relative" ref={profileMenuRef}>
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                        >
                            {user?.user_metadata?.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <span className="text-white font-semibold">
                                    {user?.email ? getInitials(user.email) : "U"}
                                </span>
                            )}
                        </button>

                        {/* 팝오버 메뉴 */}
                        {showProfileMenu && (
                            <div
                                className="profile-popover absolute right-0 top-16 w-80 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg shadow-lg overflow-hidden z-50"
                            >
                                <div className="p-4 border-b border-[#2a2a2a]">
                                    <p className="text-white text-sm font-medium">
                                        {user?.email || "User"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowPricingModal(true);
                                        setShowProfileMenu(false);
                                    }}
                                    className="w-full px-4 py-3 text-left text-white hover:bg-[#2a2a2a] transition-colors text-sm flex items-center gap-2"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="text-[#ffaa40]"
                                    >
                                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                        <path d="M2 17l10 5 10-5" />
                                        <path d="M2 12l10 5 10-5" />
                                    </svg>
                                    Pricing
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-[#2a2a2a] transition-colors text-sm"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Pricing Modal */}
            <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />
        </nav>
    );
}
