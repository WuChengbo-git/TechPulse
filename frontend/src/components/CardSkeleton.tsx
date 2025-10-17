/**
 * 卡片骨架屏组件
 * 用于显示卡片加载时的占位符，提升用户体验
 */
import { Card, Skeleton, Space, Row, Col } from 'antd'

interface CardSkeletonProps {
  count?: number
  size?: 'small' | 'default'
  grid?: boolean  // 是否使用网格布局
}

export function CardSkeleton({ count = 6, size = 'small', grid = true }: CardSkeletonProps) {
  const skeletonCard = (index: number) => (
    <Card
      key={index}
      size={size}
      style={{ marginBottom: grid ? 0 : 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {/* 标题和徽章骨架 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Skeleton.Input active size="small" style={{ width: 180, height: 20 }} />
          <Skeleton.Button active size="small" style={{ width: 60, height: 20 }} />
        </div>

        {/* 统计信息骨架（GitHub star/fork等） */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <Skeleton.Button active size="small" style={{ width: 60, height: 18 }} />
          <Skeleton.Button active size="small" style={{ width: 60, height: 18 }} />
          <Skeleton.Button active size="small" style={{ width: 80, height: 18 }} />
        </div>

        {/* 摘要骨架 */}
        <Skeleton
          active
          paragraph={{ rows: 3, width: ['100%', '100%', '60%'] }}
          title={false}
          style={{ marginBottom: 8 }}
        />

        {/* 标签骨架 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <Skeleton.Button active size="small" style={{ width: 60, height: 22 }} />
          <Skeleton.Button active size="small" style={{ width: 80, height: 22 }} />
          <Skeleton.Button active size="small" style={{ width: 70, height: 22 }} />
        </div>

        {/* 日期骨架 */}
        <Skeleton.Input active size="small" style={{ width: 100, height: 14 }} />
      </Space>
    </Card>
  )

  // 网格布局（适用于Dashboard两栏布局）
  if (grid) {
    return (
      <Row gutter={[16, 16]}>
        {Array.from({ length: count }).map((_, index) => (
          <Col xs={24} sm={12} key={index}>
            {skeletonCard(index)}
          </Col>
        ))}
      </Row>
    )
  }

  // 垂直布局（适用于列表页面）
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {Array.from({ length: count }).map((_, index) => skeletonCard(index))}
    </Space>
  )
}

export default CardSkeleton
