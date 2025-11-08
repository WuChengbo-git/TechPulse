import React, { useState } from 'react';
import { Modal, Input, Tag, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';

interface AddToFavoriteModalProps {
  visible: boolean;
  cardId: number | null;
  cardTitle: string;
  onClose: () => void;
  onConfirm: (cardId: number, tags: string[]) => Promise<void>;
}

const AddToFavoriteModal: React.FC<AddToFavoriteModalProps> = ({
  visible,
  cardId,
  cardTitle,
  onClose,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  // 预设标签
  const suggestedTags = [
    'LLM',
    '计算机视觉',
    'NLP',
    '机器学习',
    '深度学习',
    '工具库',
    '数据科学',
    '强化学习',
    '待学习',
    '重要',
  ];

  const handleAddTag = () => {
    if (inputValue && !tags.includes(inputValue)) {
      setTags([...tags, inputValue]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (removedTag: string) => {
    setTags(tags.filter((tag) => tag !== removedTag));
  };

  const handleSelectSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleConfirm = async () => {
    if (!cardId) return;

    setLoading(true);
    try {
      await onConfirm(cardId, tags);
      message.success(t('favorite.added') || '已添加到收藏');
      setTags([]);
      setInputValue('');
      onClose();
    } catch (error) {
      message.error(t('favorite.addFailed') || '添加收藏失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTags([]);
    setInputValue('');
    onClose();
  };

  return (
    <Modal
      title={t('favorite.addToFavorite') || '添加到收藏'}
      open={visible}
      onOk={handleConfirm}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText={t('favorite.confirm') || '确认'}
      cancelText={t('favorite.cancel') || '取消'}
      width={600}
    >
      <div>
        {/* 卡片标题 */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ margin: 0, color: '#8c8c8c', fontSize: '12px' }}>
            {t('favorite.cardTitle') || '项目'}:
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px', fontWeight: 500 }}>
            {cardTitle}
          </p>
        </div>

        {/* 已选标签 */}
        {tags.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500 }}>
              {t('favorite.selectedTags') || '已选标签'}:
            </p>
            <Space size="small" wrap>
              {tags.map((tag) => (
                <Tag
                  key={tag}
                  closable
                  onClose={() => handleRemoveTag(tag)}
                  color="blue"
                >
                  {tag}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 输入框 */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500 }}>
            {t('favorite.addCustomTag') || '添加自定义标签'}:
          </p>
          <Input
            placeholder={t('favorite.tagPlaceholder') || '输入标签名称后按回车'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleAddTag}
            suffix={
              <PlusOutlined
                style={{ cursor: 'pointer', color: '#1890ff' }}
                onClick={handleAddTag}
              />
            }
          />
        </div>

        {/* 推荐标签 */}
        <div>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500 }}>
            {t('favorite.suggestedTags') || '推荐标签'}:
          </p>
          <Space size="small" wrap>
            {suggestedTags.map((tag) => (
              <Tag
                key={tag}
                style={{ cursor: 'pointer' }}
                color={tags.includes(tag) ? 'blue' : 'default'}
                onClick={() => handleSelectSuggestedTag(tag)}
              >
                {tag}
              </Tag>
            ))}
          </Space>
        </div>

        {/* 提示 */}
        <div style={{ marginTop: '16px', padding: '8px', backgroundColor: '#f0f5ff', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#595959' }}>
            💡 {t('favorite.tip') || '添加标签可以帮助你更好地组织和查找收藏的内容'}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default AddToFavoriteModal;
