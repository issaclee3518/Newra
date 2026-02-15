/**
 * OpenAI API를 사용한 이미지 생성 함수
 * DALL-E 모델 사용
 * 참고: https://developers.openai.com/api-reference/images
 */

export interface ImageGenerationOptions {
    prompt: string;
    model?: "dall-e-2" | "dall-e-3";
    size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
    quality?: "standard" | "hd";
    n?: number; // 생성할 이미지 개수 (1-10)
}

export interface ImageGenerationResult {
    imageUrl: string; // 이미지 URL
    revisedPrompt?: string; // DALL-E 3가 프롬프트를 개선한 경우
}

/**
 * OpenAI API를 사용하여 이미지 생성
 * DALL-E 모델 사용
 */
export async function generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const OpenAI = (await import("openai")).default;
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
    }

    const openai = new OpenAI({
        apiKey: apiKey,
    });

    try {
        // DALL-E 모델 선택 (기본값: dall-e-3)
        const model = options.model || "dall-e-3";
        const size = options.size || (model === "dall-e-3" ? "1024x1024" : "512x512");
        const quality = options.quality || (model === "dall-e-3" ? "standard" : undefined);
        const n = options.n || 1;

        // OpenAI 이미지 생성 API 호출
        const response = await openai.images.generate({
            model: model,
            prompt: options.prompt,
            size: size as any,
            quality: quality as any,
            n: n,
            response_format: "url", // URL 형식으로 응답 받기
        });

        // 첫 번째 이미지 URL 반환 (response.data는 undefined일 수 있음)
        const data = response.data ?? [];
        const first = data[0];
        const imageUrl = typeof first?.url === "string" ? first.url : undefined;
        if (!imageUrl) {
            throw new Error("이미지 생성에 실패했습니다. 응답에 이미지 URL이 없습니다.");
        }

        // DALL-E 3의 경우 revised_prompt가 있을 수 있음
        const revisedPrompt = first?.revised_prompt;

        return {
            imageUrl,
            revisedPrompt,
        };
    } catch (error: any) {
        console.error("OpenAI API 오류:", error);
        
        // 안전 시스템 에러 감지
        const errorMessage = error.message || "";
        if (errorMessage.includes("safety system") || errorMessage.includes("content policy")) {
            const safetyError = new Error("프롬프트가 OpenAI의 안전 정책에 위배됩니다. 다른 프롬프트를 시도해주세요.");
            (safetyError as any).isSafetyError = true;
            throw safetyError;
        }
        
        throw new Error(`이미지 생성 실패: ${errorMessage || "알 수 없는 오류"}`);
    }
}
