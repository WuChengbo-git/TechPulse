import React, { useState } from 'react';
import { Modal, Form, Checkbox, Radio, Button, Typography, Space, Divider, message } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';

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
    { label: '大语言模型 (LLM)', value: 'LLM', emoji: '🤖' },
    { label: '计算机视觉 (CV)', value: 'CV', emoji: '👁️' },
    { label: '强化学习 (RL)', value: 'RL', emoji: '🎮' },
    { label: 'AI Agent', value: 'Agent', emoji: '🤝' },
    { label: '多模态 (Multimodal)', value: 'Multimodal', emoji: '🎨' },
    { label: '模型量化 (Quantization)', value: 'Quantization', emoji: '⚡' },
    { label: '开源工具', value: 'Tools', emoji: '🛠️' },
    { label: '自然语言处理 (NLP)', value: 'NLP', emoji: '💬' },
  ];

  // 技术角色选项
  const roleOptions = [
    { label: '研究员', value: 'researcher', emoji: '🔬' },
    { label: '工程师', value: 'engineer', emoji: '👨‍💻' },
    { label: '产品经理', value: 'pm', emoji: '📊' },
    { label: '学生', value: 'student', emoji: '🎓' },
  ];

  // 内容类型偏好
  const contentTypeOptions = [
    { label: '前沿论文', value: 'papers', emoji: '📄' },
    { label: '开源项目', value: 'projects', emoji: '📦' },
    { label: '实用工具', value: 'tools', emoji: '🔧' },
    { label: '行业趋势', value: 'trends', emoji: '📈' },
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

      // 调用API保存偏好
      const response = await fetch('/api/v1/preferences/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        message.success('偏好设置保存成功！');
        onComplete(preferences);
      } else {
        message.error('保存失败，请重试');
      }
    } catch (error) {
      console.error('Survey submission error:', error);
      message.error('提交失败');
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
          <span>🎯 让 TechPulse 更懂你</span>
        </div>
      }
      width={700}
      footer={null}
      closable={false}
      maskClosable={false}
    >
      <div style={{ padding: '20px 0' }}>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          花1分钟告诉我们你的兴趣，我们将为你推荐最相关的技术情报 ✨
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
                1️⃣ 你主要关注哪些领域？ <Text type="secondary">(多选)</Text>
              </Text>
            }
            rules={[{ required: true, message: '请至少选择一个领域' }]}
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
                2️⃣ 你的技术角色？
              </Text>
            }
            rules={[{ required: true, message: '请选择你的角色' }]}
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
                3️⃣ 你更喜欢看？ <Text type="secondary">(多选)</Text>
              </Text>
            }
            rules={[{ required: true, message: '请至少选择一种内容类型' }]}
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
                暂时跳过
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                loading={loading}
                style={{ minWidth: '120px' }}
              >
                完成并开始使用 🚀
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 你可以随时在「个人中心」修改这些偏好设置
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default InterestSurvey;
