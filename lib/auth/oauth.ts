import { createClient } from "@/lib/supabase";

type OAuthProvider = "google" | "github";

/**
 * OAuth 소셜 로그인
 */
export async function loginWithOAuth(provider: OAuthProvider) {
    const supabase = createClient();
    
    const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });

    if (error) {
        throw new Error(error.message || "소셜 로그인 중 오류가 발생했습니다.");
    }
}
