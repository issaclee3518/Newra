/**
 * Gemini API를 사용한 이미지 생성 함수
 * Nano Banana 모델 사용
 * 참고: https://ai.google.dev/gemini-api/docs/image-generation
 */

export interface ImageGenerationOptions {
    prompt: string;
    model?: "nano-banana" | "nano-banana-pro";
    aspectRatio?: "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9";
}

export interface ImageGenerationResult {
    imageData: string; // base64 encoded image
    mimeType: string;
}

/**
 * Gemini API를 사용하여 이미지 생성
 * Nano Banana (gemini-2.5-flash-image-exp) 모델 사용
 */
export async function generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    
    const apiKey = process.env.GEMINI_AI_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_AI_KEY가 설정되지 않았습니다.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Nano Banana 모델 사용
    // 문서에 따르면 이미지 생성은 REST API를 직접 호출해야 할 수 있습니다
    // 또는 다른 모델 이름을 사용해야 할 수 있습니다
    // 일단 일반적인 Gemini 모델로 시도하고, 이미지 생성은 다른 방식으로 처리합니다
    
    // aspectRatio를 프롬프트에 포함
    let enhancedPrompt = options.prompt;
    if (options.aspectRatio) {
        enhancedPrompt = `${options.prompt}\n\n이미지 비율: ${options.aspectRatio}`;
    }

    try {
        // Gemini API REST 엔드포인트를 직접 호출하여 이미지 생성
        // 문서에 따르면 이미지 생성은 특별한 모델이나 엔드포인트를 사용해야 할 수 있습니다
        // 일단 일반적인 Gemini 모델로 시도합니다
        // 실제로는 이미지 생성 전용 API를 사용해야 할 수 있습니다
        
        // 사용 가능한 모델 목록 확인 결과:
        // - gemini-2.5-flash-image: Nano Banana (이미지 생성 전용)
        // - gemini-2.0-flash-exp-image-generation: Gemini 2.0 Flash (Image Generation) Experimental
        
        const modelName = options.model === "nano-banana-pro" 
            ? "gemini-2.0-flash-exp-image-generation" 
            : "gemini-2.5-flash-image"; // Nano Banana 모델 사용
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: enhancedPrompt,
                    }],
                }],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || response.statusText;
            
            // 모델이 존재하지 않거나 이미지 생성을 지원하지 않는 경우
            if (response.status === 404 || errorMessage.includes("not found") || errorMessage.includes("not supported")) {
                throw new Error(
                    `이미지 생성 모델을 찾을 수 없습니다. Gemini API의 이미지 생성 기능은 아직 베타 단계일 수 있습니다. ` +
                    `에러: ${errorMessage}`
                );
            }
            
            throw new Error(`API 요청 실패: ${errorMessage}`);
        }

        const data = await response.json();

        // 응답에서 이미지 데이터 추출
        const imagePart = data.candidates?.[0]?.content?.parts?.find(
            (part: any) => part.inlineData
        );
        
        if (!imagePart || !imagePart.inlineData) {
            // 응답이 텍스트인 경우 (에러 메시지일 수 있음)
            const textPart = data.candidates?.[0]?.content?.parts?.find(
                (part: any) => part.text
            );
            if (textPart?.text) {
                throw new Error(`이미지 생성 실패: ${textPart.text}`);
            }
            throw new Error("이미지 생성에 실패했습니다. 응답에 이미지 데이터가 없습니다.");
        }

        return {
            imageData: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType || "image/png",
        };
    } catch (error: any) {
        console.error("Gemini API 오류:", error);
        throw new Error(`이미지 생성 실패: ${error.message || "알 수 없는 오류"}`);
    }
}
