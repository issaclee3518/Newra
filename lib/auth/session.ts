import { createClient } from "@/lib/supabase";

/**
 * 현재 세션 가져오기
 */
export async function getSession() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
        throw new Error(error.message || "세션을 가져오는 중 오류가 발생했습니다.");
    }

    return data.session;
}

/**
 * 인증 상태 변경 감지
 */
export function onAuthStateChange(callback: (session: any) => void) {
    const supabase = createClient();
    
    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session);
    });

    return subscription;
}

/**
 * 로그아웃
 */
export async function logout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        throw new Error(error.message || "로그아웃 중 오류가 발생했습니다.");
    }
}
