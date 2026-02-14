/**
 * 썸네일 생성 관련 함수
 */

import { generateImage, ImageGenerationOptions } from "@/lib/openai/image-generation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { enhancePromptForThumbnail, isPromptSafe } from "@/lib/prompt/enhance";

export interface GenerateThumbnailOptions {
    prompt: string;
    userId: string; // 서버 사이드에서 userId를 직접 받음
    size?: ImageGenerationOptions["size"];
    model?: ImageGenerationOptions["model"];
    image?: string; // 첨부된 이미지 (base64 data URL)
}

export interface GenerateThumbnailResult {
    thumbnailId: string;
    imageUrl: string;
    storagePath: string;
}

/**
 * 썸네일 생성 및 저장 (서버 사이드 전용)
 */
export async function generateThumbnail(
    options: GenerateThumbnailOptions
): Promise<GenerateThumbnailResult> {
    if (!options.userId) {
        throw new Error("사용자 ID가 필요합니다.");
    }

    const userId = options.userId;
    const supabase = await createServerSupabaseClient();

    try {
        // 0. 프롬프트 안전성 검사 (기본 필터링)
        const safetyCheck = isPromptSafe(options.prompt);
        if (!safetyCheck.safe) {
            throw new Error(safetyCheck.reason || "프롬프트가 안전 정책에 위배됩니다.");
        }
        
        // 1. 프롬프트 개선 (유튜브 썸네일 가이드라인 적용)
        // 주의: OpenAI의 안전 시스템이 매우 엄격하므로, 최소한의 개선만 적용
        const enhancedPrompt = enhancePromptForThumbnail(
            options.prompt, 
            true,
            !!options.image // 이미지 첨부 여부
        );
        
        // 2. OpenAI API로 이미지 생성 (재시도 로직 포함)
        let imageResult;
        let usedPrompt = enhancedPrompt;
        
        try {
            imageResult = await generateImage({
                prompt: enhancedPrompt,
                model: options.model || "dall-e-3",
                size: options.size || "1024x1024",
            });
        } catch (error: any) {
            // 안전 시스템 에러인 경우, 원본 프롬프트로 재시도
            if (error.isSafetyError && enhancedPrompt !== options.prompt) {
                console.log("개선된 프롬프트가 거부됨, 원본 프롬프트로 재시도");
                try {
                    imageResult = await generateImage({
                        prompt: options.prompt,
                        model: options.model || "dall-e-3",
                        size: options.size || "1024x1024",
                    });
                    usedPrompt = options.prompt;
                } catch (retryError: any) {
                    // 원본도 실패하면 에러 전파
                    throw retryError;
                }
            } else {
                // 다른 에러이거나 이미 원본인 경우 그대로 전파
                throw error;
            }
        }

        // 2. OpenAI에서 받은 이미지 URL에서 이미지 다운로드
        const imageResponse = await fetch(imageResult.imageUrl);
        if (!imageResponse.ok) {
            throw new Error("이미지 다운로드에 실패했습니다.");
        }

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // 3. 파일명 생성 (타임스탬프 기반)
        const timestamp = Date.now();
        const fileName = `${userId}/${timestamp}.png`;
        const storagePath = `images/${fileName}`;

        // 4. Supabase Storage에 업로드 (Buffer를 Uint8Array로 변환)
        const uint8Array = new Uint8Array(imageBuffer);
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("images")
            .upload(fileName, uint8Array, {
                contentType: "image/png",
                upsert: false,
            });

        if (uploadError) {
            console.error("업로드 에러 상세:", uploadError);
            throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
        }

        if (!uploadData) {
            throw new Error("이미지 업로드가 완료되었지만 데이터가 반환되지 않았습니다.");
        }

        console.log("업로드 성공:", uploadData.path);

        // 5. Public URL 가져오기
        const { data: urlData } = supabase.storage
            .from("images")
            .getPublicUrl(fileName);

        if (!urlData || !urlData.publicUrl) {
            throw new Error("Public URL을 가져올 수 없습니다.");
        }

        const imageUrl = urlData.publicUrl;
        console.log("생성된 이미지 URL:", imageUrl);

        // 6. 데이터베이스에 썸네일 정보 저장
        // revisedPrompt가 있으면 저장 (DALL-E 3가 프롬프트를 개선한 경우)
        // 원본 프롬프트도 함께 저장
        const { data: thumbnailData, error: dbError } = await supabase
            .from("thumbnails")
            .insert({
                user_id: userId,
                prompt: imageResult.revisedPrompt || usedPrompt || options.prompt,
                image_url: imageUrl,
                storage_path: storagePath,
            })
            .select()
            .single();

        if (dbError) {
            throw new Error(`데이터베이스 저장 실패: ${dbError.message}`);
        }

        return {
            thumbnailId: thumbnailData.id,
            imageUrl,
            storagePath,
        };
    } catch (error: any) {
        console.error("썸네일 생성 오류:", error);
        throw error;
    }
}

