"""
数据库迁移脚本：为 tech_cards 表添加 short_summary 字段

这个脚本会：
1. 添加 short_summary 列（用于卡片列表的简短介绍）
2. 从现有的 summary 字段生成简短摘要（取前100个字符或第一句话）
"""
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.app.core.database import SessionLocal, engine
from backend.app.models.card import TechCard
from sqlalchemy import text
import re


def generate_short_summary(summary: str) -> str:
    """从完整摘要生成简短摘要（1-2句话）"""
    if not summary:
        return ""

    # 移除多余空格和换行
    summary = summary.strip()
    summary = re.sub(r'\s+', ' ', summary)

    # 尝试找到第一句话（以句号、问号、感叹号结束）
    # 支持中文和英文标点
    sentence_end = re.search(r'[。！？\.!\?]', summary)
    if sentence_end:
        first_sentence = summary[:sentence_end.end()].strip()
        # 如果第一句话太短，尝试取两句话
        if len(first_sentence) < 50 and sentence_end.end() < len(summary):
            second_end = re.search(r'[。！？\.!\?]', summary[sentence_end.end():])
            if second_end:
                return summary[:sentence_end.end() + second_end.end()].strip()
        return first_sentence

    # 如果没有找到句号，取前120个字符
    if len(summary) > 120:
        return summary[:120] + "..."

    return summary


def main():
    db = SessionLocal()

    try:
        print("=" * 60)
        print("添加 short_summary 字段到 tech_cards 表")
        print("=" * 60)

        # 1. 检查列是否已存在
        result = db.execute(text("PRAGMA table_info(tech_cards)"))
        columns = [row[1] for row in result.fetchall()]

        if 'short_summary' in columns:
            print("✓ short_summary 列已存在")
        else:
            print("\n1. 添加 short_summary 列...")
            db.execute(text("ALTER TABLE tech_cards ADD COLUMN short_summary TEXT"))
            db.commit()
            print("✓ short_summary 列添加成功")

        # 2. 为现有记录生成简短摘要
        print("\n2. 为现有记录生成简短摘要...")
        cards = db.query(TechCard).all()

        updated_count = 0
        for card in cards:
            if card.summary and not card.short_summary:
                short_summary = generate_short_summary(card.summary)
                card.short_summary = short_summary
                updated_count += 1

                if updated_count <= 3:  # 显示前3个示例
                    print(f"\n示例 {updated_count}:")
                    print(f"  原摘要: {card.summary[:100]}...")
                    print(f"  简短摘要: {short_summary}")

        db.commit()
        print(f"\n✓ 成功为 {updated_count} 条记录生成简短摘要")

        # 3. 显示统计信息
        print("\n" + "=" * 60)
        print("统计信息:")
        print("=" * 60)

        total_cards = db.query(TechCard).count()
        cards_with_short_summary = db.query(TechCard).filter(
            TechCard.short_summary.isnot(None),
            TechCard.short_summary != ''
        ).count()

        print(f"总卡片数: {total_cards}")
        print(f"有简短摘要的卡片数: {cards_with_short_summary}")
        if total_cards > 0:
            print(f"覆盖率: {cards_with_short_summary/total_cards*100:.1f}%")
        else:
            print(f"覆盖率: N/A (没有卡片数据)")

        print("\n✅ 迁移完成！")

    except Exception as e:
        print(f"\n❌ 错误: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
