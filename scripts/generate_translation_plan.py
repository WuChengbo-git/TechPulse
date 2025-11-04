#!/usr/bin/env python3
"""
生成国际化迁移计划
分析扫描结果,生成详细的翻译清单和迁移计划
"""

import json
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Set

# 关键的翻译分类
CATEGORY_MAPPING = {
    # Pages
    'llmproviderspage': 'llmProviders',
    'trendspage': 'trends',
    'settingspage': 'settings',
    'taskmanagementpage': 'taskManagement',
    'systemconfig': 'systemConfig',
    'systemstatuspage': 'systemStatus',
    'arxivpage': 'arxiv',
    'huggingfacepage': 'huggingface',
    'zennpage': 'zenn',
    'githubpage': 'github',
    'dashboard': 'dashboard',
    'datasources': 'dataSources',
    'analytics': 'analytics',
    'chat': 'chat',

    # Components
    'interestsurvey': 'onboarding',
    'languageselector': 'common',
    'sidebar': 'nav',
    'smartsearch': 'search',
    'recommendationpanel': 'recommendation',
    'qualitybadge': 'common',
}

class TranslationPlanGenerator:
    def __init__(self, scan_report_path: str):
        with open(scan_report_path, 'r', encoding='utf-8') as f:
            self.scan_data = json.load(f)

        self.stats = self.scan_data['statistics']
        self.findings = self.scan_data['detailed_findings']

        # 分类的翻译项
        self.categorized_translations: Dict[str, List[Dict]] = defaultdict(list)
        self.unique_texts: Set[str] = set()

    def categorize_translations(self):
        """将翻译项按模块分类"""
        for filepath, items in self.findings.items():
            # 从文件路径提取模块名
            filename = Path(filepath).stem.lower()

            # 确定分类
            category = CATEGORY_MAPPING.get(filename, 'common')

            for item in items:
                text = item['text']
                if text not in self.unique_texts:
                    self.unique_texts.add(text)

                    # 生成建议的key
                    key = self._suggest_key(text, category, filename)

                    self.categorized_translations[category].append({
                        'key': key,
                        'zh_CN': text,
                        'source_file': filepath,
                        'line': item['line'],
                        'context': item['line_content']
                    })

    def _suggest_key(self, text: str, category: str, filename: str) -> str:
        """智能生成翻译key"""
        # 移除特殊字符
        import re

        # 常见的key映射
        key_hints = {
            '成功': 'success',
            '失败': 'failed',
            '错误': 'error',
            '警告': 'warning',
            '确认': 'confirm',
            '取消': 'cancel',
            '保存': 'save',
            '删除': 'delete',
            '编辑': 'edit',
            '添加': 'add',
            '加载': 'loading',
            '测试': 'test',
            '连接': 'connection',
            '配置': 'config',
            '模型': 'model',
            '提供商': 'provider',
            '请': 'please',
            '已': 'already',
        }

        # 尝试从文本中提取关键词
        for zh, en in key_hints.items():
            if zh in text:
                # 简化key生成
                simplified = text[:15].strip()
                return f"{en}Message"

        # 默认使用描述性key
        # 计算文本长度生成合适的key
        if len(text) <= 5:
            key_name = 'short_' + str(hash(text))[-6:]
        elif '成功' in text or '！' in text:
            key_name = 'successMessage'
        elif '失败' in text or '错误' in text:
            key_name = 'errorMessage'
        elif '请' in text or '？' in text:
            key_name = 'promptMessage'
        else:
            key_name = 'message_' + str(hash(text))[-6:]

        return key_name

    def generate_translation_structure(self) -> Dict:
        """生成新的翻译结构"""
        result = {}

        for category, items in self.categorized_translations.items():
            result[category] = {}

            for item in items:
                key = item['key']
                # 避免key重复
                counter = 1
                original_key = key
                while key in result[category]:
                    key = f"{original_key}{counter}"
                    counter += 1

                result[category][key] = {
                    'zh-CN': item['zh_CN'],
                    'en-US': '[TODO]',  # 需要人工翻译
                    'ja-JP': '[TODO]',  # 需要人工翻译
                    '_source': {
                        'file': item['source_file'],
                        'line': item['line']
                    }
                }

        return result

    def generate_markdown_plan(self, output_file: str):
        """生成Markdown格式的迁移计划"""
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# 国际化迁移详细计划\n\n")

            # 总览
            f.write("## 📊 总体情况\n\n")
            f.write(f"- **需要翻译的文本总数**: {len(self.unique_texts)}\n")
            f.write(f"- **涉及文件数**: {len(self.findings)}\n")
            f.write(f"- **需要新增的翻译模块**: {len(self.categorized_translations)}\n\n")

            # 按优先级排序的文件列表
            f.write("## 🎯 迁移优先级\n\n")
            f.write("根据影响范围和使用频率,建议按以下优先级进行迁移:\n\n")

            # 统计各文件的硬编码数量
            file_counts = [(k, len(v)) for k, v in self.findings.items()]
            file_counts.sort(key=lambda x: x[1], reverse=True)

            f.write("### 第一优先级 (P0 - 核心页面)\n\n")
            f.write("这些是用户最常访问的页面,应最先完成:\n\n")

            priority_files = [
                'LLMProvidersPage.tsx',
                'SettingsPage.tsx',
                'Dashboard.tsx',
                'InterestSurvey.tsx'
            ]

            for filepath, count in file_counts[:15]:
                filename = Path(filepath).name
                if any(pf in filename for pf in priority_files):
                    f.write(f"- [ ] `{filepath}` ({count} 处硬编码)\n")

            f.write("\n### 第二优先级 (P1 - 功能页面)\n\n")
            for filepath, count in file_counts[:15]:
                filename = Path(filepath).name
                if not any(pf in filename for pf in priority_files) and 'pages' in filepath:
                    f.write(f"- [ ] `{filepath}` ({count} 处硬编码)\n")

            f.write("\n### 第三优先级 (P2 - 组件和工具)\n\n")
            for filepath, count in file_counts[:15]:
                if 'components' in filepath or 'utils' in filepath:
                    f.write(f"- [ ] `{filepath}` ({count} 处硬编码)\n")

            # 详细的翻译清单
            f.write("\n## 📝 详细翻译清单\n\n")
            f.write("按模块分类的所有需要翻译的文本:\n\n")

            for category in sorted(self.categorized_translations.keys()):
                items = self.categorized_translations[category]
                f.write(f"### {category} ({len(items)} 项)\n\n")

                # 去重并排序
                unique_items = {}
                for item in items:
                    text = item['zh_CN']
                    if text not in unique_items:
                        unique_items[text] = item

                f.write("| 中文 | 建议Key | 来源文件 |\n")
                f.write("|------|---------|----------|\n")

                for text, item in list(unique_items.items())[:50]:  # 只显示前50个
                    key = item['key']
                    source = Path(item['source_file']).name
                    f.write(f"| {text[:30]} | `{category}.{key}` | {source} |\n")

                if len(unique_items) > 50:
                    f.write(f"\n_...还有 {len(unique_items) - 50} 项_\n")

                f.write("\n")

            # 迁移步骤指南
            f.write("## 🛠️ 迁移步骤\n\n")
            f.write("### 步骤1: 扩展 translations.ts\n\n")
            f.write("为每个模块添加新的翻译key。参考生成的 `translation_additions.json`\n\n")

            f.write("### 步骤2: 修改源文件\n\n")
            f.write("对于每个文件:\n\n")
            f.write("1. 确认文件已导入 `useLanguage` hook\n")
            f.write("2. 使用 `t('category.key')` 替换硬编码文本\n")
            f.write("3. 测试中英日三种语言的显示\n\n")

            f.write("### 步骤3: 验证和测试\n\n")
            f.write("1. 运行应用,切换语言验证\n")
            f.write("2. 检查是否有遗漏的硬编码\n")
            f.write("3. 确保所有UI元素都能正确切换语言\n\n")

            # 示例代码
            f.write("## 💡 代码修改示例\n\n")
            f.write("### 修改前\n\n")
            f.write("```typescript\n")
            f.write("message.success('保存成功！');\n")
            f.write("const title = '系统设置';\n")
            f.write("```\n\n")

            f.write("### 修改后\n\n")
            f.write("```typescript\n")
            f.write("import { useLanguage } from '../contexts/LanguageContext';\n\n")
            f.write("const { t } = useLanguage();\n")
            f.write("message.success(t('settings.saveSuccess'));\n")
            f.write("const title = t('settings.title');\n")
            f.write("```\n\n")

            # 估算工作量
            f.write("## ⏱️ 工作量估算\n\n")
            total_items = len(self.unique_texts)
            f.write(f"- **翻译工作**: 约 {total_items} 个文本 × 2语言 = {total_items * 2} 条翻译\n")
            f.write(f"- **代码修改**: 约 {len(self.findings)} 个文件需要修改\n")
            f.write(f"- **预计时间**: \n")
            f.write(f"  - 翻译: 约 {total_items * 2 // 60} 小时 (假设每分钟翻译1条)\n")
            f.write(f"  - 代码修改: 约 {len(self.findings) * 0.5:.1f} 小时 (假设每文件30分钟)\n")
            f.write(f"  - 测试验证: 约 2-3 小时\n")
            f.write(f"  - **总计**: 约 {total_items * 2 // 60 + len(self.findings) * 0.5 + 2.5:.1f} 小时\n\n")

    def generate_json_additions(self, output_file: str):
        """生成可直接添加到translations.ts的JSON格式"""
        structure = self.generate_translation_structure()

        # 重新组织为更友好的格式
        additions = {
            'zh-CN': {},
            'en-US': {},
            'ja-JP': {}
        }

        for category, items in structure.items():
            additions['zh-CN'][category] = {}
            additions['en-US'][category] = {}
            additions['ja-JP'][category] = {}

            for key, langs in items.items():
                additions['zh-CN'][category][key] = langs['zh-CN']
                additions['en-US'][category][key] = langs['en-US']
                additions['ja-JP'][category][key] = langs['ja-JP']

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(additions, f, ensure_ascii=False, indent=2)


def main():
    report_path = "/home/AI/TechPulse/reports/i18n_gaps_detailed.json"
    output_dir = Path("/home/AI/TechPulse/reports")

    print("🔄 正在分析扫描结果...")

    generator = TranslationPlanGenerator(report_path)
    generator.categorize_translations()

    print(f"✅ 分析完成:")
    print(f"   - 独特文本数: {len(generator.unique_texts)}")
    print(f"   - 翻译分类数: {len(generator.categorized_translations)}")

    print("\n📝 正在生成迁移计划...")
    generator.generate_markdown_plan(str(output_dir / "i18n_migration_plan.md"))

    print("📦 正在生成翻译补充文件...")
    generator.generate_json_additions(str(output_dir / "translation_additions.json"))

    print(f"\n{'='*60}")
    print("✨ 迁移计划生成完成!")
    print(f"\n查看以下文件:")
    print(f"  📄 迁移计划: {output_dir / 'i18n_migration_plan.md'}")
    print(f"  📦 翻译补充: {output_dir / 'translation_additions.json'}")


if __name__ == "__main__":
    main()
