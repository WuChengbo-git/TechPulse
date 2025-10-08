import React from 'react';
import { Tag, Tooltip } from 'antd';
import { StarFilled } from '@ant-design/icons';

interface QualityBadgeProps {
  score: number;  // 0-10分
  showLabel?: boolean;  // 是否显示文字标签
  size?: 'small' | 'default';
}

/**
 * 质量评分徽章组件
 * 根据评分显示不同颜色和星级
 */
const QualityBadge: React.FC<QualityBadgeProps> = ({
  score,
  showLabel = true,
  size = 'default'
}) => {
  // 获取质量等级
  const getQualityLevel = (score: number): string => {
    if (score >= 8.5) return '优秀';
    if (score >= 7.0) return '良好';
    if (score >= 5.0) return '中等';
    if (score >= 3.0) return '一般';
    return '较低';
  };

  // 获取标签颜色
  const getColor = (score: number): string => {
    if (score >= 8.5) return 'gold';
    if (score >= 7.0) return 'green';
    if (score >= 5.0) return 'blue';
    if (score >= 3.0) return 'orange';
    return 'default';
  };

  // 获取星级 (1-5星)
  const getStarRating = (score: number): number => {
    if (score >= 9.0) return 5;
    if (score >= 7.5) return 4;
    if (score >= 5.5) return 3;
    if (score >= 3.5) return 2;
    return 1;
  };

  // 获取详细说明
  const getTooltip = (score: number): string => {
    const level = getQualityLevel(score);
    return `质量评分: ${score.toFixed(1)}/10 (${level})

评分依据:
• GitHub: Star数、活跃度、文档质量
• arXiv: 作者声誉、主题热度、完整性
• HuggingFace: 下载量、社区互动
• Zenn: 点赞数、评论数、Premium标识`;
  };

  const stars = getStarRating(score);
  const color = getColor(score);
  const level = getQualityLevel(score);

  return (
    <Tooltip title={getTooltip(score)} placement="top">
      <Tag
        color={color}
        style={{
          cursor: 'pointer',
          fontSize: size === 'small' ? '12px' : '14px',
          padding: size === 'small' ? '2px 6px' : '4px 8px',
          margin: 0
        }}
      >
        {[...Array(stars)].map((_, i) => (
          <StarFilled
            key={i}
            style={{
              fontSize: size === 'small' ? '10px' : '12px',
              marginRight: i < stars - 1 ? '2px' : '4px'
            }}
          />
        ))}
        {showLabel && level}
      </Tag>
    </Tooltip>
  );
};

export default QualityBadge;
