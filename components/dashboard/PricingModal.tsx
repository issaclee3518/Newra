"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface PricingCardProps {
    name: string;
    price: number;
    credits: number;
    isPopular?: boolean;
    onSelect: () => void;
    isLoading?: boolean;
}

function PricingCard({ name, price, credits, isPopular = false, onSelect, isLoading = false }: PricingCardProps) {
    return (
        <div
            className={cn(
                "relative rounded-2xl p-6 border transition-all",
                isPopular
                    ? "bg-[#1f1f1f] border-[#3a3a3a] shadow-lg scale-105"
                    : "bg-[#1a1a1a] border-[#2a2a2a]"
            )}
            style={{
                boxShadow: isPopular
                    ? "0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                    : "0 4px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            }}
        >
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#ffaa40] to-[#9c40ff] text-white text-xs font-semibold">
                    POPULAR
                </div>
            )}
            
            <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-white">${price}</span>
                    <span className="text-neutral-400 text-sm">/month</span>
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
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
                    <span className="text-white font-semibold text-lg">{credits} Credits</span>
                </div>
            </div>
            
            <button
                onClick={onSelect}
                disabled={isLoading}
                className={cn(
                    "w-full mt-6 py-3 rounded-lg font-semibold transition-all",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isPopular
                        ? "bg-gradient-to-r from-[#ffaa40] to-[#9c40ff] text-white hover:opacity-90"
                        : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] border border-[#3a3a3a]"
                )}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Processing...
                    </span>
                ) : (
                    `Select ${name}`
                )}
            </button>
        </div>
    );
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleSelectPlan = async (plan: "pro" | "ultra") => {
        setLoadingPlan(plan);

        try {
            const response = await fetch("/api/checkout/create-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ plan }),
            });

            const data = await response.json();

            if (!response.ok) {
                let errorMessage = data.error || "체크아웃 세션 생성에 실패했습니다.";
                
                // 401 에러인 경우 더 명확한 메시지
                if (response.status === 401) {
                    errorMessage = data.hint || "Polar API 인증에 실패했습니다. 관리자에게 문의하세요.";
                }
                
                console.error("체크아웃 API 오류:", {
                    status: response.status,
                    error: data.error,
                    hint: data.hint,
                    details: data.details,
                });
                
                throw new Error(errorMessage);
            }

            if (data.checkoutUrl) {
                // 체크아웃 URL로 리다이렉트
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error("체크아웃 URL을 받지 못했습니다.");
            }
        } catch (error: any) {
            console.error("체크아웃 오류:", error);
            alert(error.message || "체크아웃 세션 생성 중 오류가 발생했습니다.");
            setLoadingPlan(null);
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        document.addEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.removeEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
                background: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(8px)",
            }}
        >
            <div
                ref={modalRef}
                className={cn(
                    "relative w-full max-w-2xl rounded-2xl",
                    "bg-[#181818] border border-[#2a2a2a]",
                    "shadow-2xl p-8"
                )}
                style={{
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] flex items-center justify-center transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-neutral-400"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* 헤더 */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Choose Your Plan</h2>
                    <p className="text-neutral-400">Select the perfect plan for your needs</p>
                </div>

                {/* 가격 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PricingCard
                        name="Pro"
                        price={10}
                        credits={100}
                        onSelect={() => handleSelectPlan("pro")}
                        isLoading={loadingPlan === "pro"}
                    />
                    <PricingCard
                        name="Ultra"
                        price={25}
                        credits={300}
                        isPopular
                        onSelect={() => handleSelectPlan("ultra")}
                        isLoading={loadingPlan === "ultra"}
                    />
                </div>
            </div>
        </div>
    );

    // React Portal을 사용하여 body에 렌더링
    if (typeof window !== "undefined") {
        return createPortal(modalContent, document.body);
    }

    return null;
}
