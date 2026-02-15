import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용 Supabase Admin 클라이언트 (Service Role Key).
 * 웹훅 등 RLS를 우회해 users/payments를 쓰기할 때만 사용하세요.
 * .env에 SUPABASE_SERVICE_ROLE_KEY 설정 필요.
 */
export function createSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
        throw new Error(
            "SUPABASE_SERVICE_ROLE_KEY(및 NEXT_PUBLIC_SUPABASE_URL)가 필요합니다. 웹훅에서 users/payments를 업데이트하려면 .env에 설정하세요."
        );
    }
    return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
