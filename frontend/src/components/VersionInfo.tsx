import React from 'react'
import { Typography, Space } from 'antd'
import { APP_VERSION, BUILD_DATE } from '../config/version'

const { Text } = Typography

interface VersionInfoProps {
  style?: React.CSSProperties
}

const VersionInfo: React.FC<VersionInfoProps> = ({ style }) => {
  return (
    <Space style={style} split={<Text type="secondary">|</Text>}>
      <Text type="secondary" style={{ fontSize: '11px' }}>
        Version {APP_VERSION}
      </Text>
      <Text type="secondary" style={{ fontSize: '11px' }}>
        Build {BUILD_DATE}
      </Text>
    </Space>
  )
}

export default VersionInfo