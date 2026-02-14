"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Thumbnail {
    id: string;
    prompt: string;
    image_url: string;
    storage_path: string;
    created_at: string;
}

export function Sidebar() {
    const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        fetchThumbnails();
        
        // 새 썸네일 생성 시 갤러리 새로고침
        const handleThumbnailCreated = () => {
            fetchThumbnails();
        };
        
        window.addEventListener("thumbnail-created", handleThumbnailCreated);
        return () => {
            window.removeEventListener("thumbnail-created", handleThumbnailCreated);
        };
    }, []);

    const fetchThumbnails = async () => {
        try {
            const response = await fetch("/api/thumbnail/list");
            const data = await response.json();

            if (response.ok && data.success) {
                setThumbnails(data.data);
            }
        } catch (error) {
            console.error("썸네일 목록 가져오기 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const downloadImage = async (imageUrl: string, prompt: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `thumbnail-${prompt.slice(0, 20).replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("이미지 다운로드 실패:", error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "방금 전";
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        return date.toLocaleDateString("ko-KR");
    };

    return (
        <aside
            className={cn(
                "fixed left-4 top-20 bottom-4 w-80 z-40",
                "bg-[#202020] border border-[#2a2a2a]/50",
                "backdrop-blur-xl backdrop-saturate-150",
                "rounded-2xl",
                "shadow-2xl",
                "overflow-y-auto",
                "hidden lg:block" // 모바일에서는 숨김
            )}
            style={{
                background: "linear-gradient(135deg, rgba(32, 32, 32, 0.9) 0%, rgba(26, 26, 26, 0.95) 100%)",
                boxShadow: "inset -1px 0 0 rgba(255, 255, 255, 0.05), 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)",
            }}
        >
            <div className="p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white mb-1">My Gallery</h2>
                    <p className="text-sm text-neutral-400">
                        {thumbnails.length}개의 썸네일
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-neutral-400">로딩 중...</div>
                    </div>
                ) : thumbnails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#2a2a2a] flex items-center justify-center mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-neutral-500"
                            >
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                            </svg>
                        </div>
                        <p className="text-neutral-400 text-sm">
                            아직 생성된 썸네일이 없습니다
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {thumbnails.map((thumbnail) => (
                            <div
                                key={thumbnail.id}
                                className={cn(
                                    "group relative rounded-lg overflow-hidden",
                                    "bg-[#1a1a1a]/50 border border-[#2a2a2a]/50",
                                    "backdrop-blur-sm",
                                    "transition-all duration-300",
                                    "hover:border-[#3a3a3a]/50 hover:shadow-lg",
                                    selectedImage === thumbnail.id && "border-[#4a4a4a]"
                                )}
                                style={{
                                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                                }}
                            >
                                {/* 이미지 */}
                                <div className="relative aspect-video bg-[#1a1a1a] overflow-hidden">
                                    <img
                                        src={thumbnail.image_url}
                                        alt={thumbnail.prompt}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "/placeholder.png";
                                        }}
                                    />
                                    {/* 호버 시 오버레이 */}
                                    <div
                                        className={cn(
                                            "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100",
                                            "transition-opacity duration-300",
                                            "flex items-center justify-center gap-2"
                                        )}
                                    >
                                        <button
                                            onClick={() => downloadImage(thumbnail.image_url, thumbnail.prompt)}
                                            className={cn(
                                                "px-4 py-2 rounded-lg",
                                                "bg-white/10 backdrop-blur-md border border-white/20",
                                                "text-white text-sm font-medium",
                                                "hover:bg-white/20 transition-colors",
                                                "flex items-center gap-2"
                                            )}
                                            style={{
                                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                                            }}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            다운로드
                                        </button>
                                    </div>
                                </div>

                                {/* 프롬프트 및 날짜 */}
                                <div className="p-3">
                                    <p className="text-white text-sm line-clamp-2 mb-2">
                                        {thumbnail.prompt}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                        {formatDate(thumbnail.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}
