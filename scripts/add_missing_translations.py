#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
在现有翻译文件中添加缺失的翻译键
"""

import re

# 读取当前翻译文件
with open('/home/AI/TechPulse/frontend/src/locales/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 需要添加的翻译键
additional_translations = {
    'huggingface': {
        'zh-CN': {
            'textRelated': '文本相关',
            'visionRelated': '视觉相关',
        },
        'en-US': {
            'textRelated': 'Text Related',
            'visionRelated': 'Vision Related',
        },
        'ja-JP': {
            'textRelated': 'テキスト関連',
            'visionRelated': 'ビジョン関連',
        }
    },
    'zenn': {
        'zh-CN': {
            'premiumArticles': '付费文章',
        },
        'en-US': {
            'premiumArticles': 'Premium Articles',
        },
        'ja-JP': {
            'premiumArticles': 'プレミアム記事',
        }
    },
    'arxiv': {
        'zh-CN': {
            'aiRelated': 'AI相关',
            'computerVision': '计算机视觉',
        },
        'en-US': {
            'aiRelated': 'AI Related',
            'computerVision': 'Computer Vision',
        },
        'ja-JP': {
            'aiRelated': 'AI関連',
            'computerVision': 'コンピュータビジョン',
        }
    },
    'common': {
        'zh-CN': {
            'allWithCount': '全部',
            'popularWithCount': '热门',
            'recentTab': '最新',
        },
        'en-US': {
            'allWithCount': 'All',
            'popularWithCount': 'Popular',
            'recentTab': 'Recent',
        },
        'ja-JP': {
            'allWithCount': 'すべて',
            'popularWithCount': '人気',
            'recentTab': '最新',
        }
    }
}

# 为每个语言添加翻译
for lang in ['zh-CN', 'en-US', 'ja-JP']:
    for category, translations in additional_translations.items():
        if lang in translations:
            # 找到对应语言和类别的位置
            pattern = f"'{lang}':\\s*{{[^}}]*{category}:\\s*{{([^}}]*)}}"
            match = re.search(pattern, content, re.DOTALL)

            if match:
                # 在现有内容末尾添加新的翻译键
                existing_content = match.group(1)
                # 移除最后的逗号和空白
                existing_content = existing_content.rstrip().rstrip(',')

                # 添加新的键
                new_keys = []
                for key, value in translations[lang].items():
                    new_keys.append(f"      {key}: '{value}',")

                new_content = existing_content + ',\\n' + '\\n'.join(new_keys)

                # 替换内容
                old_block = match.group(1)
                content = content.replace(old_block, new_content)

# 写回文件
with open('/home/AI/TechPulse/frontend/src/locales/translations.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 翻译键已添加")
print("添加的类别:")
print("- huggingface: textRelated, visionRelated")
print("- zenn: premiumArticles")
print("- arxiv: aiRelated, computerVision")
print("- common: allWithCount, popularWithCount, recentTab")
