"""
标签翻译API
用于将中文标签翻译成英文或日文
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import os
from openai import OpenAI

router = APIRouter()

class TranslateRequest(BaseModel):
    """翻译请求模型"""
    texts: List[str]  # 要翻译的文本列表
    target_language: str  # 目标语言: 'en' 或 'ja'

class TranslateResponse(BaseModel):
    """翻译响应模型"""
    translations: List[str]  # 翻译结果列表

# 翻译缓存（简单的内存缓存）
translation_cache = {}

@router.post("/translate", response_model=TranslateResponse)
async def translate_texts(request: TranslateRequest):
    """
    翻译文本列表

    支持批量翻译以提高效率
    使用缓存避免重复翻译
    """

    # 验证目标语言
    if request.target_language not in ['en', 'ja']:
        raise HTTPException(status_code=400, detail="目标语言必须是 'en' 或 'ja'")

    # 检查是否配置了OpenAI API
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        # 如果没有配置API，返回原文
        return TranslateResponse(translations=request.texts)

    translations = []
    texts_to_translate = []
    cache_keys = []

    # 检查缓存
    for text in request.texts:
        cache_key = f"{text}_{request.target_language}"
        cache_keys.append(cache_key)

        if cache_key in translation_cache:
            translations.append(translation_cache[cache_key])
        else:
            translations.append(None)
            texts_to_translate.append(text)

    # 如果所有文本都在缓存中，直接返回
    if not texts_to_translate:
        return TranslateResponse(translations=translations)

    # 调用OpenAI API进行翻译
    try:
        client = OpenAI(api_key=api_key)

        # 构建翻译提示
        target_lang_name = "English" if request.target_language == 'en' else "Japanese"
        prompt = f"""Please translate the following Chinese technical terms to {target_lang_name}.
Keep the translations concise and technical. Return only the translations, one per line, in the same order.

Chinese terms:
{chr(10).join(texts_to_translate)}

{target_lang_name} translations:"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": f"You are a professional translator specializing in technical terms. Translate Chinese to {target_lang_name}."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )

        # 解析翻译结果
        translated_lines = response.choices[0].message.content.strip().split('\n')
        translated_texts = [line.strip() for line in translated_lines if line.strip()]

        # 将翻译结果填入返回列表并更新缓存
        translate_index = 0
        for i, translation in enumerate(translations):
            if translation is None:
                if translate_index < len(translated_texts):
                    translated_text = translated_texts[translate_index]
                    translations[i] = translated_text
                    translation_cache[cache_keys[i]] = translated_text
                    translate_index += 1
                else:
                    # 如果翻译结果不足，使用原文
                    translations[i] = request.texts[i]

        return TranslateResponse(translations=translations)

    except Exception as e:
        print(f"翻译错误: {e}")
        # 翻译失败时返回原文
        return TranslateResponse(translations=request.texts)


@router.delete("/translate/cache")
async def clear_translation_cache():
    """清空翻译缓存"""
    translation_cache.clear()
    return {"message": "翻译缓存已清空"}
