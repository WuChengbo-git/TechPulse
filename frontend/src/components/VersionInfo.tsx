import React from 'react'
import { Typography, Space } from 'antd'

const { Text } = Typography

interface VersionInfoProps {
  style?: React.CSSProperties
}

const VersionInfo: React.FC<VersionInfoProps> = ({ style }) => {
  const version = '0.1.5'
  const build = '20250909'
  
  return (
    <Space style={style} split={<Text type="secondary">|</Text>}>
      <Text type="secondary" style={{ fontSize: '11px' }}>
        Version {version}
      </Text>
      <Text type="secondary" style={{ fontSize: '11px' }}>
        Build {build}
      </Text>
    </Space>
  )
}

export default VersionInfo