import { createClient } from "@/lib/supabase";

/**
 * 이메일/비밀번호로 회원가입
 */
export async function signUpWithEmail(email: string, password: string) {
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message || "회원가입 중 오류가 발생했습니다.");
    }

    return data;
}
