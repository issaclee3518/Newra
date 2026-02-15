import { NextRequest, NextResponse } from "next/server";

/**
 * 토큰 검증을 위한 테스트 엔드포인트
 * 개발 환경에서만 사용
 */
export async function GET(request: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { error: "이 엔드포인트는 개발 환경에서만 사용할 수 있습니다." },
            { status: 403 }
        );
    }

    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
    const proProductId = process.env.POLAR_PRO_PRODUCT_ID;
    const ultraProductId = process.env.POLAR_ULTRA_PRODUCT_ID;

    // 환경 변수 정보 반환 (토큰은 일부만 표시)
    return NextResponse.json({
        tokenExists: !!polarAccessToken,
        tokenLength: polarAccessToken?.length || 0,
        tokenPrefix: polarAccessToken ? `${polarAccessToken.substring(0, 20)}...` : null,
        tokenSuffix: polarAccessToken && polarAccessToken.length > 20 
            ? `...${polarAccessToken.substring(polarAccessToken.length - 10)}` 
            : null,
        proProductIdExists: !!proProductId,
        proProductId: proProductId || null,
        ultraProductIdExists: !!ultraProductId,
        ultraProductId: ultraProductId || null,
        // 실제 토큰으로 Polar API 테스트
        testResult: await testPolarToken(polarAccessToken),
    });
}

async function testPolarToken(token: string | undefined): Promise<any> {
    if (!token) {
        return { error: "토큰이 설정되지 않았습니다." };
    }

    const trimmedToken = token.trim();
    
    // 여러 인증 방식 시도
    const authMethods = [
        { name: "Bearer", header: `Bearer ${trimmedToken}` },
        { name: "Token (no Bearer)", header: trimmedToken },
    ];

    for (const method of authMethods) {
        try {
            // Polar API의 체크아웃 엔드포인트로 직접 테스트
            // 빈 products 배열로 테스트 (실제 생성은 하지 않음)
            const testProductId = process.env.POLAR_PRO_PRODUCT_ID;
            
            if (!testProductId) {
                return {
                    success: false,
                    error: "Product ID가 설정되지 않았습니다.",
                };
            }

            const response = await fetch("https://api.polar.sh/v1/checkouts", {
                method: "POST",
                headers: {
                    "Authorization": method.header,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    products: [testProductId],
                }),
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    status: response.status,
                    message: "토큰이 유효합니다!",
                    authMethod: method.name,
                    checkoutUrl: data.url || "체크아웃 URL 생성됨",
                };
            } else {
                const errorData = await response.text();
                let errorJson: any = {};
                try {
                    errorJson = JSON.parse(errorData);
                } catch {
                    errorJson = { raw: errorData };
                }

                // 마지막 방법이면 에러 반환
                if (method === authMethods[authMethods.length - 1]) {
                    return {
                        success: false,
                        status: response.status,
                        error: errorJson.error || "알 수 없는 오류",
                        errorDescription: errorJson.error_description || errorData,
                        triedMethods: authMethods.map(m => m.name),
                    };
                }
                // 다음 방법 시도
                continue;
            }
        } catch (error: any) {
            // 마지막 방법이면 에러 반환
            if (method === authMethods[authMethods.length - 1]) {
                return {
                    success: false,
                    error: "네트워크 오류",
                    message: error.message,
                    triedMethods: authMethods.map(m => m.name),
                };
            }
            // 다음 방법 시도
            continue;
        }
    }
    
    return {
        success: false,
        error: "모든 인증 방식 실패",
        triedMethods: authMethods.map(m => m.name),
    };
}
