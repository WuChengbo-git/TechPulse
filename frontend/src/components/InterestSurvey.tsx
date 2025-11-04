import React, { useState } from 'react';
import { Modal, Form, Checkbox, Radio, Button, Typography, Space, Divider, message } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../utils/api';

const { Title, Text } = Typography;

interface InterestSurveyProps {
  visible: boolean;
  onComplete: (preferences: UserPreferences) => void;
  onSkip?: () => void;
}

export interface UserPreferences {
  interests: string[];
  role: string;
  content_types: string[];
  languages: string[];
  onboarding_completed: boolean;
}

/**
 * 用户兴趣问卷组件
 * 用于新用户首次登录时收集偏好信息，实现个性化推荐
 */
const InterestSurvey: React.FC<InterestSurveyProps> = ({ visible, onComplete, onSkip }) => {
  const { t, language } = useLanguage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 兴趣领域选项
  const interestOptions = [
    { label: t('onboarding.interestLLM'), value: 'LLM', emoji: '🤖' },
    { label: t('onboarding.interestCV'), value: 'CV', emoji: '👁️' },
    { label: t('onboarding.interestRL'), value: 'RL', emoji: '🎮' },
    { label: t('onboarding.interestAgent'), value: 'Agent', emoji: '🤝' },
    { label: t('onboarding.interestMultimodal'), value: 'Multimodal', emoji: '🎨' },
    { label: t('onboarding.interestQuantization'), value: 'Quantization', emoji: '⚡' },
    { label: t('onboarding.interestTools'), value: 'Tools', emoji: '🛠️' },
    { label: t('onboarding.interestNLP'), value: 'NLP', emoji: '💬' },
  ];

  // 技术角色选项
  const roleOptions = [
    { label: t('onboarding.roleResearcher'), value: 'researcher', emoji: '🔬' },
    { label: t('onboarding.roleEngineer'), value: 'engineer', emoji: '👨‍💻' },
    { label: t('onboarding.rolePM'), value: 'pm', emoji: '📊' },
    { label: t('onboarding.roleStudent'), value: 'student', emoji: '🎓' },
  ];

  // 内容类型偏好
  const contentTypeOptions = [
    { label: t('onboarding.contentPapers'), value: 'papers', emoji: '📄' },
    { label: t('onboarding.contentProjects'), value: 'projects', emoji: '📦' },
    { label: t('onboarding.contentTools'), value: 'tools', emoji: '🔧' },
    { label: t('onboarding.contentTrends'), value: 'trends', emoji: '📈' },
  ];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setLoading(true);

      const preferences: UserPreferences = {
        interests: values.interests || [],
        role: values.role || 'engineer',
        content_types: values.content_types || [],
        languages: [language], // 使用当前语言
        onboarding_completed: true,
      };

      // 使用 axios 调用 API 保存偏好（自动添加认证头）
      await api.post('/api/v1/preferences/onboarding', preferences);

      message.success(t('onboarding.successMessage'));
      onComplete(preferences);
    } catch (error: any) {
      console.error('Survey submission error:', error);
      console.error('Error response:', error.response);

      // 显示详细错误信息
      const errorMsg = error.response?.data?.detail || t('onboarding.errorMessage');
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <Modal
      open={visible}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RocketOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <span>🎯 {t('onboarding.title')}</span>
        </div>
      }
      width={700}
      footer={null}
      closable={false}
      maskClosable={false}
    >
      <div style={{ padding: '20px 0' }}>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          {t('onboarding.subtitle')}
        </Text>

        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
          initialValues={{
            interests: ['LLM'],
            role: 'engineer',
            content_types: ['projects', 'papers'],
          }}
        >
          {/* 问题1: 关注领域 */}
          <Form.Item
            name="interests"
            label={
              <Text strong style={{ fontSize: '16px' }}>
                1️⃣ {t('onboarding.question1')} <Text type="secondary">{t('onboarding.question1Hint')}</Text>
              </Text>
            }
            rules={[{ required: true, message: t('onboarding.requireInterest') }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {interestOptions.map(option => (
                  <Checkbox
                    key={option.value}
                    value={option.value}
                    style={{
                      padding: '12px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      width: '100%',
                      marginLeft: 0,
                    }}
                  >
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>{option.emoji}</span>
                    <span style={{ fontSize: '14px' }}>{option.label}</span>
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Divider />

          {/* 问题2: 技术角色 */}
          <Form.Item
            name="role"
            label={
              <Text strong style={{ fontSize: '16px' }}>
                2️⃣ {t('onboarding.question2')}
              </Text>
            }
            rules={[{ required: true, message: t('onboarding.requireRole') }]}
          >
            <Radio.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {roleOptions.map(option => (
                  <Radio
                    key={option.value}
                    value={option.value}
                    style={{
                      padding: '12px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      width: '100%',
                      marginLeft: 0,
                    }}
                  >
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>{option.emoji}</span>
                    <span style={{ fontSize: '14px' }}>{option.label}</span>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>

          <Divider />

          {/* 问题3: 内容类型偏好 */}
          <Form.Item
            name="content_types"
            label={
              <Text strong style={{ fontSize: '16px' }}>
                3️⃣ {t('onboarding.question3')} <Text type="secondary">{t('onboarding.question3Hint')}</Text>
              </Text>
            }
            rules={[{ required: true, message: t('onboarding.requireContentType') }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {contentTypeOptions.map(option => (
                  <Checkbox
                    key={option.value}
                    value={option.value}
                    style={{
                      padding: '12px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      width: '100%',
                      marginLeft: 0,
                    }}
                  >
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>{option.emoji}</span>
                    <span style={{ fontSize: '14px' }}>{option.label}</span>
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Divider />

          {/* 提交按钮 */}
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={handleSkip}>
                {t('onboarding.skipButton')}
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                loading={loading}
                style={{ minWidth: '120px' }}
              >
                {t('onboarding.submitButton')}
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 {t('onboarding.footerHint')}
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default InterestSurvey;
