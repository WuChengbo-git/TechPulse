#!/usr/bin/env python3
"""
国际化缺失扫描工具
扫描前端源代码中的硬编码文本,生成需要翻译的清单
"""

import re
import os
import json
from pathlib import Path
from collections import defaultdict
from typing import List, Dict, Tuple

# 匹配中文字符的正则表达式
CHINESE_PATTERN = re.compile(r'[\u4e00-\u9fa5]+')
# 匹配日文字符的正则表达式
JAPANESE_PATTERN = re.compile(r'[\u3040-\u309f\u30a0-\u30ff\u31f0-\u31ff]+')

# 匹配字符串字面量 (单引号、双引号、模板字符串)
STRING_LITERAL_PATTERN = re.compile(
    r'''(?:['"`])((?:[^'"`\\]|\\.)*)(?:['"`])''',
    re.MULTILINE | re.DOTALL
)

# 排除的文件和目录
EXCLUDE_PATTERNS = [
    'node_modules',
    'translations.ts',
    'translations-additions.ts',
    '.backup',
    'dist',
    'build'
]

# 排除的常见模式 (不需要翻译的)
EXCLUDE_TEXT_PATTERNS = [
    r'^[\d\s\.\-\+\*/=<>!&|%()[\]{}:;,@#$^~`]+$',  # 纯符号和数字
    r'^[a-zA-Z0-9\-_\.@]+$',  # 纯英文标识符
    r'^https?://',  # URL
    r'^/[a-zA-Z0-9\-_/]+$',  # 路由路径
    r'^\w+\.\w+$',  # 属性访问 like 'user.name'
    r'^(localStorage|sessionStorage|console|window|document)\.',  # JS API
    r'^(zh-CN|en-US|ja-JP)$',  # 语言代码
    r'^(GET|POST|PUT|DELETE|PATCH)$',  # HTTP方法
    r'^\d{4}-\d{2}-\d{2}',  # 日期格式
    r'^[A-Z_]+$',  # 常量命名
    r'^#[0-9a-fA-F]{3,8}$',  # 颜色代码
]

class I18nScanner:
    def __init__(self, src_dir: str):
        self.src_dir = Path(src_dir)
        self.findings: Dict[str, List[Dict]] = defaultdict(list)
        self.stats = {
            'total_files': 0,
            'files_with_issues': 0,
            'total_hardcoded': 0,
            'chinese_texts': 0,
            'japanese_texts': 0,
        }

    def should_exclude_file(self, filepath: Path) -> bool:
        """检查文件是否应该被排除"""
        path_str = str(filepath)
        return any(pattern in path_str for pattern in EXCLUDE_PATTERNS)

    def should_exclude_text(self, text: str) -> bool:
        """检查文本是否应该被排除 (不需要翻译)"""
        text = text.strip()
        if not text or len(text) < 2:
            return True

        for pattern in EXCLUDE_TEXT_PATTERNS:
            if re.match(pattern, text):
                return True

        return False

    def extract_strings_from_file(self, filepath: Path) -> List[Tuple[int, str, str]]:
        """从文件中提取所有字符串字面量
        返回: [(行号, 原始内容, 提取的字符串)]
        """
        results = []
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            for line_num, line in enumerate(lines, 1):
                # 跳过注释行
                if line.strip().startswith('//') or line.strip().startswith('/*'):
                    continue

                # 查找所有字符串字面量
                for match in STRING_LITERAL_PATTERN.finditer(line):
                    text = match.group(1)
                    # 处理转义字符
                    text = text.replace('\\n', ' ').replace('\\t', ' ')

                    # 检查是否包含中文或日文
                    if CHINESE_PATTERN.search(text) or JAPANESE_PATTERN.search(text):
                        if not self.should_exclude_text(text):
                            results.append((line_num, line.strip(), text))

        except Exception as e:
            print(f"⚠️  Error reading {filepath}: {e}")

        return results

    def scan_file(self, filepath: Path) -> None:
        """扫描单个文件"""
        if self.should_exclude_file(filepath):
            return

        self.stats['total_files'] += 1
        strings = self.extract_strings_from_file(filepath)

        if strings:
            self.stats['files_with_issues'] += 1
            relative_path = filepath.relative_to(self.src_dir)

            for line_num, line_content, text in strings:
                # 判断文本类型
                has_chinese = bool(CHINESE_PATTERN.search(text))
                has_japanese = bool(JAPANESE_PATTERN.search(text))

                if has_chinese:
                    self.stats['chinese_texts'] += 1
                if has_japanese:
                    self.stats['japanese_texts'] += 1

                self.stats['total_hardcoded'] += 1

                self.findings[str(relative_path)].append({
                    'line': line_num,
                    'text': text,
                    'line_content': line_content,
                    'type': 'chinese' if has_chinese else 'japanese',
                    'length': len(text)
                })

    def scan_directory(self) -> None:
        """扫描整个目录"""
        print(f"🔍 开始扫描目录: {self.src_dir}")
        print(f"{'='*60}")

        # 递归扫描所有 .tsx 和 .ts 文件
        for ext in ['*.tsx', '*.ts']:
            for filepath in self.src_dir.rglob(ext):
                if filepath.name.endswith('.d.ts'):
                    continue
                self.scan_file(filepath)

        print(f"✅ 扫描完成!")
        print(f"   - 总文件数: {self.stats['total_files']}")
        print(f"   - 包含硬编码的文件: {self.stats['files_with_issues']}")
        print(f"   - 硬编码文本总数: {self.stats['total_hardcoded']}")
        print(f"   - 中文文本: {self.stats['chinese_texts']}")
        print(f"   - 日文文本: {self.stats['japanese_texts']}")

    def categorize_by_module(self) -> Dict[str, List]:
        """按模块分类归纳"""
        categorized = {
            'pages': [],
            'components': [],
            'services': [],
            'utils': [],
            'others': []
        }

        for filepath, items in self.findings.items():
            if 'pages/' in filepath:
                category = 'pages'
            elif 'components/' in filepath:
                category = 'components'
            elif 'services/' in filepath:
                category = 'services'
            elif 'utils/' in filepath:
                category = 'utils'
            else:
                category = 'others'

            categorized[category].append({
                'file': filepath,
                'count': len(items),
                'items': items
            })

        return categorized

    def generate_report(self, output_file: str) -> None:
        """生成详细报告"""
        categorized = self.categorize_by_module()

        report = {
            'scan_time': None,  # 可以添加时间戳
            'statistics': self.stats,
            'findings_by_module': categorized,
            'detailed_findings': dict(self.findings)
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

        print(f"\n📄 详细报告已保存到: {output_file}")

    def generate_markdown_report(self, output_file: str) -> None:
        """生成Markdown格式的可读报告"""
        categorized = self.categorize_by_module()

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# 国际化缺失扫描报告\n\n")

            # 统计摘要
            f.write("## 📊 扫描统计\n\n")
            f.write(f"- **扫描文件总数**: {self.stats['total_files']}\n")
            f.write(f"- **包含硬编码的文件**: {self.stats['files_with_issues']}\n")
            f.write(f"- **硬编码文本总数**: {self.stats['total_hardcoded']}\n")
            f.write(f"- **中文文本**: {self.stats['chinese_texts']}\n")
            f.write(f"- **日文文本**: {self.stats['japanese_texts']}\n\n")

            # 按模块分类
            f.write("## 📂 按模块分类\n\n")

            for category, files in categorized.items():
                if not files:
                    continue

                total_in_category = sum(item['count'] for item in files)
                f.write(f"### {category.upper()} ({len(files)} 文件, {total_in_category} 处硬编码)\n\n")

                # 按硬编码数量排序
                files_sorted = sorted(files, key=lambda x: x['count'], reverse=True)

                for file_info in files_sorted:
                    f.write(f"#### `{file_info['file']}` ({file_info['count']} 处)\n\n")

                    # 列出前10个示例
                    for i, item in enumerate(file_info['items'][:10], 1):
                        f.write(f"{i}. **第 {item['line']} 行**: `{item['text']}`\n")
                        f.write(f"   ```typescript\n")
                        f.write(f"   {item['line_content']}\n")
                        f.write(f"   ```\n\n")

                    if file_info['count'] > 10:
                        f.write(f"   _...还有 {file_info['count'] - 10} 处硬编码_\n\n")

            # 优先级建议
            f.write("## 🎯 修复优先级建议\n\n")
            f.write("根据使用频率和影响范围,建议按以下优先级修复:\n\n")

            # 获取硬编码最多的前10个文件
            all_files = []
            for category, files in categorized.items():
                all_files.extend(files)

            top_files = sorted(all_files, key=lambda x: x['count'], reverse=True)[:10]

            f.write("### 高优先级 (硬编码数量最多的文件)\n\n")
            for i, file_info in enumerate(top_files, 1):
                f.write(f"{i}. `{file_info['file']}` - {file_info['count']} 处硬编码\n")

            f.write("\n### 建议修复顺序\n\n")
            f.write("1. **Pages** - 用户直接看到的页面,影响最大\n")
            f.write("2. **Components** - 复用组件,修改一次影响多处\n")
            f.write("3. **Services** - 错误消息和提示\n")
            f.write("4. **Utils** - 工具函数中的文本\n")

        print(f"📄 Markdown报告已保存到: {output_file}")

    def suggest_translation_keys(self) -> Dict[str, Dict]:
        """为每个硬编码文本建议翻译key"""
        suggestions = {}

        for filepath, items in self.findings.items():
            # 从文件路径推断模块名
            parts = Path(filepath).parts
            if 'pages' in parts:
                module = Path(filepath).stem.replace('Page', '').lower()
            elif 'components' in parts:
                module = Path(filepath).stem.lower()
            else:
                module = 'common'

            for item in items:
                text = item['text']
                # 生成建议的key (简化版)
                # 实际使用时可能需要人工调整
                key_suggestion = f"{module}.{self._generate_key_name(text)}"

                if text not in suggestions:
                    suggestions[text] = {
                        'suggested_key': key_suggestion,
                        'occurrences': [],
                        'chinese_text': text
                    }

                suggestions[text]['occurrences'].append({
                    'file': filepath,
                    'line': item['line']
                })

        return suggestions

    def _generate_key_name(self, text: str) -> str:
        """从中文文本生成建议的key名称"""
        # 这是一个简化版本,实际可能需要更智能的处理
        # 移除特殊字符,只保留中文和字母
        clean = re.sub(r'[^\w\u4e00-\u9fa5]', '', text)
        # 截断到合理长度
        if len(clean) > 20:
            clean = clean[:20]
        return clean.lower()


def main():
    # 设置路径
    frontend_src = Path("/home/AI/TechPulse/frontend/src")
    output_dir = Path("/home/AI/TechPulse/reports")
    output_dir.mkdir(exist_ok=True)

    # 创建扫描器并执行扫描
    scanner = I18nScanner(frontend_src)
    scanner.scan_directory()

    # 生成报告
    print(f"\n{'='*60}")
    print("📝 正在生成报告...")

    scanner.generate_report(str(output_dir / "i18n_gaps_detailed.json"))
    scanner.generate_markdown_report(str(output_dir / "i18n_gaps_report.md"))

    # 生成翻译key建议
    suggestions = scanner.suggest_translation_keys()
    with open(output_dir / "translation_key_suggestions.json", 'w', encoding='utf-8') as f:
        json.dump(suggestions, f, ensure_ascii=False, indent=2)

    print(f"📄 翻译key建议已保存到: {output_dir / 'translation_key_suggestions.json'}")

    print(f"\n{'='*60}")
    print("✨ 扫描完成! 请查看 reports/ 目录下的报告文件")


if __name__ == "__main__":
    main()
