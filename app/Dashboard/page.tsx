"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardNavbar, PromptInput, PromptInputTextarea } from "@/components/dashboard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { BlobLoader } from "@/components/dashboard/BlobLoader";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [prompt, setPrompt] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const isRequestInProgress = useRef(false); // 중복 호출 방지용 ref

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const session = await getSession();
            if (!session) {
                router.push("/auth");
                return;
            }
            setUser(session.user);
        } catch (error) {
            router.push("/auth");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // 중복 호출 방지: 이미 요청이 진행 중이면 무시
        if (!prompt.trim() || generating || isRequestInProgress.current) {
            return;
        }
        
        // 요청 시작 표시
        isRequestInProgress.current = true;
        setGenerating(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const response = await fetch("/api/thumbnail/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    image: attachedImage, // 첨부된 이미지 base64 또는 URL
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // 안전 시스템 에러인 경우 특별한 메시지 표시
                if (data.isSafetyError) {
                    throw new Error(
                        "프롬프트가 OpenAI의 안전 정책에 위배됩니다. " +
                        "다른 표현으로 프롬프트를 수정해주세요."
                    );
                }
                
                // 쿼터 에러인 경우 특별한 메시지 표시
                if (data.isQuotaError) {
                    throw new Error(
                        "API 쿼터가 초과되었습니다. 잠시 후 다시 시도해주세요."
                    );
                }
                
                // 개발 환경에서는 더 자세한 에러 정보 표시
                const errorMsg = data.error || "이미지 생성에 실패했습니다.";
                if (data.details && process.env.NODE_ENV === "development") {
                    console.error("서버 에러 상세:", data.details);
                }
                throw new Error(errorMsg);
            }

            setGeneratedImage(data.data.imageUrl);
            setPrompt("");
            setAttachedImage(null); // 이미지 생성 후 첨부 이미지 초기화
            
            // 사이드바 갤러리 새로고침 (새 이미지 추가됨)
            // Sidebar 컴포넌트가 자동으로 새로고침되도록 이벤트 발생
            window.dispatchEvent(new CustomEvent("thumbnail-created"));
        } catch (err: any) {
            console.error("이미지 생성 오류:", err);
            setError(err.message || "이미지 생성 중 오류가 발생했습니다.");
        } finally {
            // 요청 완료 표시
            isRequestInProgress.current = false;
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#181818] flex items-center justify-center">
                <div className="text-white">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#181818] relative overflow-hidden">
            {/* 체크그리드 배경 패턴 */}
            <div 
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: `
                        linear-gradient(45deg, #2a2a2a 25%, transparent 25%),
                        linear-gradient(-45deg, #2a2a2a 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #2a2a2a 75%),
                        linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)
                    `,
                    backgroundSize: '40px 40px',
                    backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px'
                }}
            />
            
            {/* Navbar */}
            <DashboardNavbar />

            {/* Sidebar */}
            <Sidebar />

            {/* 중앙 컨텐츠 영역 */}
            <div className="relative z-10 flex items-center justify-center min-h-screen pt-20 pb-12 lg:ml-80">
                <div className="w-full max-w-5xl px-6 md:px-8 lg:px-12">
                    <div className="mb-6">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white text-center">
                            Describe your Thumbnail
                        </h2>
                    </div>

                    {/* 생성된 이미지 표시 (Describe your Thumbnail과 PromptArea 사이) */}
                    {generating && (
                        <div className="mb-6 flex flex-col items-center">
                            <div className="relative w-full max-w-md aspect-square">
                                <BlobLoader />
                            </div>
                        </div>
                    )}
                    {generatedImage && !generating && (
                        <div className="mb-6 flex flex-col items-center">
                            <div className="relative w-full max-w-md">
                                <img
                                    src={generatedImage}
                                    alt="Generated thumbnail"
                                    className="w-full h-auto rounded-lg border border-[#2a2a2a] shadow-lg"
                                />
                            </div>
                        </div>
                    )}

                    {/* PromptInput 영역 - 로딩 중일 때 BlobLoader 표시 */}
                    <div className="relative">
                        <PromptInput
                            value={prompt}
                            onValueChange={setPrompt}
                            onSubmit={handleSubmit}
                            maxHeight={400}
                            className="w-full"
                            disabled={generating}
                        >
                            {/* 첨부된 이미지 미리보기 - PromptArea 내부 상단 왼쪽 */}
                            {attachedImage && (
                                <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a] group mb-3">
                                    <img
                                        src={attachedImage}
                                        alt="Attached"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={() => setAttachedImage(null)}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                className="text-white"
                                            >
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                            )}
                            
                            <div className="flex items-start gap-3">
                                <PromptInputTextarea
                                    placeholder="프롬프트를 입력하세요..."
                                    className="text-xl md:text-2xl flex-1"
                                    disabled={generating}
                                />
                                
                                {/* 이미지 첨부 버튼 */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={generating}
                                    className={cn(
                                        "flex-shrink-0 w-10 h-10 rounded-lg",
                                        "bg-[#2a2a2a] hover:bg-[#3a3a3a]",
                                        "border border-[#3a3a3a]",
                                        "flex items-center justify-center",
                                        "transition-colors",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="text-neutral-400"
                                    >
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <path d="M21 15l-5-5L5 21" />
                                    </svg>
                                </button>
                            </div>
                            
                            {/* 숨겨진 파일 입력 */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const result = event.target?.result as string;
                                            setAttachedImage(result);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </PromptInput>
                    </div>

                    {error && (
                        <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-red-400 text-sm mb-2">{error}</p>
                            {error.includes("안전 정책") && (
                                <div className="mt-3 text-xs text-red-300 space-y-1">
                                    <p className="font-semibold mb-2">프롬프트 작성 팁:</p>
                                    <p>• 부적절하거나 폭력적인 내용을 피해주세요</p>
                                    <p>• 명확하고 건전한 표현을 사용해주세요</p>
                                    <p>• 유튜브 썸네일에 적합한 내용으로 작성해주세요</p>
                                    <p className="mt-2 text-red-400">
                                        예: "밝고 화사한 배경에 큰 텍스트가 있는 썸네일" 등
                                    </p>
                                </div>
                            )}
                            {error.includes("쿼터") && (
                                <div className="mt-3 text-xs text-red-300 space-y-1">
                                    <p>• API 쿼터가 초과되었습니다</p>
                                    <p>• 잠시 후 다시 시도해주세요</p>
                                    <p>• OpenAI 대시보드에서 사용량을 확인해주세요</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
