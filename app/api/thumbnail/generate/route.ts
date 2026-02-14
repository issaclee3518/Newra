import { NextRequest, NextResponse } from "next/server";
import { generateThumbnail } from "@/lib/thumbnail/generate";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prompt, size, model, image } = body;

        if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
            return NextResponse.json(
                { error: "프롬프트가 필요합니다." },
                { status: 400 }
            );
        }

        // 서버 사이드에서 사용자 인증 확인
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const result = await generateThumbnail({
            prompt: prompt.trim(),
            userId: user.id,
            size,
            model,
            image, // 첨부된 이미지 전달
        });

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error("썸네일 생성 API 오류:", error);
        console.error("에러 스택:", error.stack);
        
        const errorMessage = error.message || "썸네일 생성 중 오류가 발생했습니다.";
        
        // 안전 시스템 에러 감지
        const isSafetyError = (error as any).isSafetyError || 
                             errorMessage.includes("safety system") ||
                             errorMessage.includes("안전 정책") ||
                             errorMessage.includes("content policy");
        
        // 쿼터 에러인 경우 특별 처리
        const isQuotaError = errorMessage.includes("quota") || 
                            errorMessage.includes("Quota exceeded") ||
                            errorMessage.includes("quota exceeded");
        
        // 안전 시스템 에러는 400 상태 코드 반환
        const statusCode = isSafetyError ? 400 : 500;
        
        // 더 자세한 에러 정보 포함
        return NextResponse.json(
            { 
                error: errorMessage,
                isSafetyError,
                isQuotaError,
                details: process.env.NODE_ENV === "development" ? error.stack : undefined,
            },
            { status: statusCode }
        );
    }
}
