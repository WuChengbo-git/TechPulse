import React from 'react';
import { Tag, Tooltip } from 'antd';
import { StarFilled } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t } = useLanguage();

  // 获取质量等级
  const getQualityLevel = (score: number): string => {
    if (score >= 8.5) return t('common.excellent');
    if (score >= 7.0) return t('common.good');
    if (score >= 5.0) return t('common.moderate');
    if (score >= 3.0) return t('common.average');
    return t('common.low');
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
    return `${t('common.qualityScore')}: ${score.toFixed(1)}/10 (${level})

${t('common.scoringCriteria')}:
• ${t('common.githubCriteria')}
• ${t('common.arxivCriteria')}
• ${t('common.huggingfaceCriteria')}
• ${t('common.zennCriteria')}`;
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
