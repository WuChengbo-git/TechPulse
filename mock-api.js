const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock数据
const mockCards = [
  {
    id: 1,
    title: "React 19 发布了新的并发特性",
    source: "github",
    stars: 1234,
    summary: "React 19 带来了全新的并发特性和性能优化，包括新的Suspense API、并发渲染机制等。这些特性将显著提升大型应用的性能表现。",
    created_at: "2025-09-08T10:00:00Z",
    chinese_tags: ["React", "前端框架", "并发编程", "性能优化"],
    url: "https://github.com/facebook/react"
  },
  {
    id: 2,
    title: "PyTorch 2.5 机器学习框架更新",
    source: "github", 
    stars: 9876,
    summary: "PyTorch 2.5 版本发布，新增了更多的深度学习算子和优化功能，支持更大规模的模型训练。",
    created_at: "2025-09-08T09:30:00Z",
    chinese_tags: ["PyTorch", "机器学习", "深度学习", "人工智能"],
    url: "https://github.com/pytorch/pytorch"
  },
  {
    id: 3,
    title: "注意力机制在自然语言处理中的新突破",
    source: "arxiv",
    stars: 156,
    summary: "本论文提出了一种新的注意力机制，在多个自然语言处理任务上取得了显著的性能提升。",
    created_at: "2025-09-08T08:45:00Z",
    chinese_tags: ["自然语言处理", "注意力机制", "Transformer"],
    url: "https://arxiv.org/abs/2509.01234"
  },
  {
    id: 4,
    title: "BERT-Large 日语预训练模型",
    source: "huggingface",
    stars: 567,
    summary: "专门为日语优化的BERT-Large模型，在多个日语NLP基准测试中取得最佳性能。",
    created_at: "2025-09-08T07:20:00Z", 
    chinese_tags: ["BERT", "日语", "预训练模型", "NLP"],
    url: "https://huggingface.co/cl-tohoku/bert-large-japanese"
  },
  {
    id: 5,
    title: "Next.js 15 全栈开发最佳实践",
    source: "zenn",
    stars: 234,
    summary: "详细介绍了Next.js 15的新特性和在全栈开发中的最佳实践方法。",
    created_at: "2025-09-07T16:00:00Z",
    chinese_tags: ["Next.js", "全栈开发", "React", "Web开发"],
    url: "https://zenn.dev/example/next15-best-practices"
  },
  {
    id: 6,
    title: "Vue 3 组合式API进阶技巧", 
    source: "github",
    stars: 2100,
    summary: "Vue 3 组合式API的高级使用技巧和最佳实践，包括状态管理、生命周期等。",
    created_at: "2025-09-07T14:30:00Z",
    chinese_tags: ["Vue.js", "组合式API", "前端框架"],
    url: "https://github.com/vuejs/composition-api"
  },
  {
    id: 7,
    title: "大语言模型量化技术综述",
    source: "arxiv",
    stars: 89,
    summary: "全面综述了大语言模型量化技术的发展现状和未来趋势。",
    created_at: "2025-09-07T12:15:00Z",
    chinese_tags: ["大语言模型", "模型量化", "压缩技术"],
    url: "https://arxiv.org/abs/2509.02345"
  },
  {
    id: 8,
    title: "ChatGPT API 使用指南",
    source: "github",
    stars: 3456,
    summary: "详细的ChatGPT API使用指南，包括认证、调用、错误处理等最佳实践。",
    created_at: "2025-09-07T10:00:00Z",
    chinese_tags: ["ChatGPT", "API", "人工智能", "开发指南"],
    url: "https://github.com/openai/chatgpt-api-guide"
  }
];

// API端点
app.get('/api/v1/cards/', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(mockCards.slice(0, limit));
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});