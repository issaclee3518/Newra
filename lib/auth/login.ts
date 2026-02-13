import { createClient } from "@/lib/supabase";

/**
 * 이메일/비밀번호로 로그인
 */
export async function loginWithEmail(email: string, password: string) {
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message || "로그인 중 오류가 발생했습니다.");
    }

    return data;
}
