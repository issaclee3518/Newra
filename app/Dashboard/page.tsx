"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardNavbar, PromptInput, PromptInputTextarea } from "@/components/dashboard";

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [prompt, setPrompt] = useState("");
    const router = useRouter();

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

    const handleSubmit = () => {
        if (!prompt.trim()) return;
        console.log("Prompt submitted:", prompt);
        // TODO: 프롬프트 처리 로직 추가
        setPrompt("");
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

            {/* 중앙 컨텐츠 영역 */}
            <div className="relative z-10 flex items-center justify-center min-h-screen pt-20 pb-12">
                <div className="w-full max-w-5xl px-6 md:px-8 lg:px-12">
                    <div className="mb-6">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white text-center">
                            Describe your Thumbnail
                        </h2>
                    </div>
                    <PromptInput
                        value={prompt}
                        onValueChange={setPrompt}
                        onSubmit={handleSubmit}
                        maxHeight={400}
                        className="w-full"
                    >
                        <PromptInputTextarea
                            placeholder="프롬프트를 입력하세요..."
                            className="text-xl md:text-2xl"
                        />
                    </PromptInput>
                </div>
            </div>
        </div>
    );
}
