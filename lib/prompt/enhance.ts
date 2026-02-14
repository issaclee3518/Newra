/**
 * 프롬프트 개선 함수
 * 유튜브 썸네일 가이드라인을 적용하여 프롬프트를 더 효과적이고 안전하게 만듭니다.
 */

/**
 * 프롬프트를 유튜브 썸네일에 적합하게 개선
 * 더 간결하고 안전한 프롬프트 생성
 * OpenAI의 안전 시스템을 고려하여 최소한의 수정만 적용
 */
export function enhancePromptForThumbnail(
    userPrompt: string, 
    useMinimalEnhancement: boolean = true,
    hasAttachedImage: boolean = false
): string {
    // 사용자 프롬프트 정리
    const cleanedPrompt = userPrompt.trim();
    
    // 프롬프트가 너무 짧거나 비어있으면 기본값 사용
    if (cleanedPrompt.length < 2) {
        return "A bright, colorful YouTube thumbnail with bold text and clear design";
    }
    
    // 이미지가 첨부된 경우, 이미지를 참조하는 프롬프트 추가
    let imageContext = "";
    if (hasAttachedImage) {
        imageContext = "based on the provided reference image, ";
    }
    
    // 최소한의 개선만 적용 (안전 시스템 거부 가능성 최소화)
    if (useMinimalEnhancement) {
        // 사용자 프롬프트를 그대로 사용하되, YouTube thumbnail 컨텍스트만 추가
        return `YouTube thumbnail: ${imageContext}${cleanedPrompt}`;
    }
    
    // 더 많은 가이드라인 적용 (선택적)
    const baseGuidelines = "professional, bright colors, bold text, clean design, family-friendly";
    return `${imageContext}${cleanedPrompt}, ${baseGuidelines}`;
}

/**
 * 프롬프트가 안전한지 간단히 검사 (기본 필터링)
 */
export function isPromptSafe(prompt: string): { safe: boolean; reason?: string } {
    const lowerPrompt = prompt.toLowerCase();
    
    // 명백히 부적절한 단어들 (기본 필터)
    const blockedWords = [
        // 폭력 관련
        'kill', 'murder', 'violence', 'weapon', 'gun', 'knife',
        // 성인 콘텐츠 관련
        'nude', 'naked', 'sex', 'porn',
        // 혐오 표현
        'hate', 'racist',
    ];
    
    for (const word of blockedWords) {
        if (lowerPrompt.includes(word)) {
            return {
                safe: false,
                reason: `프롬프트에 부적절한 내용이 포함되어 있습니다. 다른 표현을 사용해주세요.`
            };
        }
    }
    
    return { safe: true };
}
