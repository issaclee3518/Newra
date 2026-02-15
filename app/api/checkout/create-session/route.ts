import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { plan } = body; // "pro" or "ultra"

        if (!plan || (plan !== "pro" && plan !== "ultra")) {
            return NextResponse.json(
                { error: "유효한 플랜이 필요합니다. (pro 또는 ultra)" },
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

        // 환경 변수에서 Polar 설정 가져오기
        const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
        const proProductId = process.env.POLAR_PRO_PRODUCT_ID;
        const ultraProductId = process.env.POLAR_ULTRA_PRODUCT_ID;

        // 환경 변수 확인 및 디버깅 정보
        console.log("=== Polar API 환경 변수 확인 ===");
        console.log("- POLAR_ACCESS_TOKEN 존재:", !!polarAccessToken);
        console.log("- POLAR_ACCESS_TOKEN 길이:", polarAccessToken?.length || 0);
        console.log("- POLAR_ACCESS_TOKEN 시작:", polarAccessToken ? `${polarAccessToken.substring(0, 10)}...` : "없음");
        console.log("- POLAR_PRO_PRODUCT_ID 존재:", !!proProductId);
        console.log("- POLAR_ULTRA_PRODUCT_ID 존재:", !!ultraProductId);
        console.log("================================");

        if (!polarAccessToken) {
            return NextResponse.json(
                { 
                    error: "POLAR_ACCESS_TOKEN이 설정되지 않았습니다. .env.local 파일을 확인해주세요.",
                    hint: "환경 변수 POLAR_ACCESS_TOKEN이 .env.local에 설정되어 있는지 확인하세요."
                },
                { status: 500 }
            );
        }

        // 토큰 형식 확인 (일반적으로 Bearer 토큰은 특정 형식을 가짐)
        const trimmedToken = polarAccessToken.trim();
        if (trimmedToken.length === 0) {
            return NextResponse.json(
                { error: "POLAR_ACCESS_TOKEN이 비어있습니다." },
                { status: 500 }
            );
        }

        // 토큰에 공백이나 특수문자가 포함되어 있는지 확인
        if (trimmedToken !== polarAccessToken) {
            console.warn("경고: POLAR_ACCESS_TOKEN에 앞뒤 공백이 있습니다. .trim()으로 제거했습니다.");
        }

        // 플랜에 따른 Product ID 선택
        const productId = plan === "pro" ? proProductId : ultraProductId;

        if (!productId) {
            return NextResponse.json(
                { error: `POLAR_${plan.toUpperCase()}_PRODUCT_ID가 설정되지 않았습니다.` },
                { status: 500 }
            );
        }

        // 결제 완료 후 대시보드로 리다이렉트
        const origin =
            request.headers.get("origin") ??
            request.nextUrl?.origin ??
            process.env.NEXT_PUBLIC_APP_URL ??
            "";
        const dashboardPath = "/Dashboard";
        const successUrl =
            process.env.POLAR_CHECKOUT_SUCCESS_URL ?? (origin ? `${origin}${dashboardPath}` : undefined);
        const returnUrl =
            process.env.POLAR_CHECKOUT_RETURN_URL ?? (origin ? `${origin}${dashboardPath}` : undefined);

        // Polar API로 체크아웃 세션 생성
        // 문서: https://polar.sh/docs/api-reference/checkouts/create-session
        const requestBody: Record<string, unknown> = {
            products: [productId],
            external_customer_id: user.id,
        };
        if (successUrl) requestBody.success_url = successUrl;
        if (returnUrl) requestBody.return_url = returnUrl;

        console.log("=== Polar API 요청 정보 ===");
        console.log("- API URL: https://api.polar.sh/v1/checkouts");
        console.log("- Product ID:", productId);
        console.log("- User ID:", user.id);
        console.log("- Request Body:", JSON.stringify(requestBody, null, 2));
        console.log("===========================");

        const response = await fetch("https://api.polar.sh/v1/checkouts", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${trimmedToken}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.text();
            
            console.error("=== Polar API 오류 상세 ===");
            console.error("응답 상태:", response.status);
            console.error("에러 데이터:", errorData);
            console.error("토큰 존재:", !!polarAccessToken);
            console.error("토큰 길이:", polarAccessToken?.length || 0);
            console.error("토큰 시작:", polarAccessToken ? `${polarAccessToken.substring(0, 15)}...` : "없음");
            console.error("Product ID:", productId);
            console.error("사용된 토큰 (처음 20자):", trimmedToken.substring(0, 20));
            console.error("==========================");
            
            // 더 자세한 에러 정보 반환
            let errorMessage = "체크아웃 세션 생성에 실패했습니다.";
            let errorDetails: any = {};
            
            try {
                const errorJson = JSON.parse(errorData);
                errorMessage = errorJson.detail || errorJson.message || errorJson.error_description || errorMessage;
                errorDetails = errorJson;
                
                // invalid_token 에러인 경우 특별한 메시지
                if (errorJson.error === "invalid_token") {
                    errorMessage = "Polar API 토큰이 유효하지 않습니다. 다음을 확인해주세요:\n" +
                        "1. Polar 대시보드에서 새 토큰 생성\n" +
                        "2. .env.local 파일의 POLAR_ACCESS_TOKEN 업데이트\n" +
                        "3. 서버 재시작 (npm run dev)";
                }
            } catch {
                errorMessage = errorData || errorMessage;
            }
            
            return NextResponse.json(
                { 
                    error: errorMessage,
                    status: response.status,
                    details: process.env.NODE_ENV === "development" ? {
                        ...errorDetails,
                        tokenLength: trimmedToken.length,
                        tokenPrefix: trimmedToken.substring(0, 15),
                    } : undefined,
                    hint: response.status === 401 
                        ? "Polar API 토큰이 유효하지 않거나 만료되었습니다. Polar 대시보드(Settings → API Tokens)에서 새 토큰을 생성하고 .env.local을 업데이트한 후 서버를 재시작하세요."
                        : undefined,
                },
                { status: response.status }
            );
        }

        const checkoutData = await response.json();

        // 체크아웃 URL 반환
        if (!checkoutData.url) {
            return NextResponse.json(
                { error: "체크아웃 URL을 받지 못했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            checkoutUrl: checkoutData.url,
        });
    } catch (error: any) {
        console.error("체크아웃 세션 생성 오류:", error);
        return NextResponse.json(
            { error: "체크아웃 세션 생성 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
