import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
    try {
        // 서버 사이드에서 사용자 인증 확인
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        // 사용자의 썸네일 목록 가져오기 (최신순)
        const { data: thumbnails, error: dbError } = await supabase
            .from("thumbnails")
            .select("id, prompt, image_url, storage_path, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (dbError) {
            console.error("썸네일 목록 조회 오류:", dbError);
            return NextResponse.json(
                { error: "썸네일 목록을 가져오는데 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: thumbnails || [],
        });
    } catch (error: any) {
        console.error("썸네일 목록 API 오류:", error);
        return NextResponse.json(
            { error: "썸네일 목록을 가져오는데 실패했습니다." },
            { status: 500 }
        );
    }
}
