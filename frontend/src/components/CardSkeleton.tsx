import { Card, Skeleton, Space } from 'antd'

interface CardSkeletonProps {
  count?: number
}

export function CardSkeleton({ count = 3 }: CardSkeletonProps) {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={{ marginBottom: 16 }}>
          <Skeleton active avatar paragraph={{ rows: 3 }} />
        </Card>
      ))}
    </Space>
  )
}

export default CardSkeleton
