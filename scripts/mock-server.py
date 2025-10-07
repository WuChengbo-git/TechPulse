#!/usr/bin/env python3
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import datetime

class MockAPIHandler(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_OPTIONS(self):
        self._set_headers()
    
    def do_GET(self):
        parsed_url = urlparse(self.path)
        
        if parsed_url.path == '/api/v1/cards/':
            query_params = parse_qs(parsed_url.query)
            limit = int(query_params.get('limit', [50])[0])
            
            mock_cards = [
                {
                    "id": 1,
                    "title": "Attention Is All You Need: Transformer架构突破性论文",
                    "source": "arxiv",
                    "stars": 15678,
                    "summary": "**核心贡献**：提出了完全基于注意力机制的Transformer模型架构\n\n**技术突破**：\n• 摒弃了传统的RNN和CNN结构\n• 采用自注意力机制实现并行化训练\n• 在机器翻译任务上达到SOTA性能\n\n**影响意义**：奠定了现代大语言模型的基础架构，GPT、BERT等模型都基于此架构发展而来。",
                    "created_at": "2025-09-08T10:00:00Z",
                    "chinese_tags": ["Transformer", "注意力机制", "深度学习", "NLP"],
                    "url": "https://arxiv.org/abs/1706.03762"
                },
                {
                    "id": 2,
                    "title": "Llama 3.1 - Meta最新开源大语言模型",
                    "source": "huggingface",
                    "stars": 8934,
                    "summary": "**模型规模**：405B参数的超大规模语言模型\n\n**核心特性**：\n• 支持128K上下文长度，处理超长文档\n• 多语言支持，包含中文、日语等8种语言\n• 在数学推理、代码生成方面表现出色\n\n**开源影响**：开源版本性能接近GPT-4，为开源社区提供了强大的基础模型选择。",
                    "created_at": "2025-09-08T09:45:00Z",
                    "chinese_tags": ["Llama", "大语言模型", "开源", "Meta"],
                    "url": "https://huggingface.co/meta-llama/Llama-3.1-405B"
                },
                {
                    "id": 3,
                    "title": "React 19 RC版本发布：并发特性大幅改进",
                    "source": "github",
                    "stars": 2145,
                    "summary": "**重大更新**：React 19带来革命性的并发渲染能力\n\n**新特性亮点**：\n• Server Components正式稳定，提升SSR性能\n• 新的use() Hook简化异步数据处理\n• 改进的Suspense边界处理机制\n• 自动批处理优化，减少不必要的重渲染\n\n**开发体验**：开发者工具升级，更好的调试体验和性能分析。",
                    "created_at": "2025-09-08T08:30:00Z",
                    "chinese_tags": ["React", "前端框架", "并发渲染", "Server Components"],
                    "url": "https://github.com/facebook/react"
                },
                {
                    "id": 4,
                    "title": "Rust 1.75版本：安全性与性能的双重提升",
                    "source": "zenn",
                    "stars": 567,
                    "summary": "**版本亮点**：Rust 1.75带来了重要的语言特性和标准库改进\n\n**主要更新**：\n• async fn语法在trait中的支持更加完善\n• 改进的错误信息提示，开发体验更友好\n• 新的标准库API，简化常用操作\n• 编译性能优化，构建速度提升15%\n\n**生态发展**：WebAssembly支持增强，适合构建高性能Web应用。",
                    "created_at": "2025-09-08T07:15:00Z",
                    "chinese_tags": ["Rust", "系统编程", "异步编程", "WebAssembly"],
                    "url": "https://zenn.dev/rust/articles/rust-1-75-release"
                },
                {
                    "id": 5,
                    "title": "多模态大模型的统一理论框架研究",
                    "source": "arxiv",
                    "stars": 892,
                    "summary": "**研究背景**：现有多模态模型缺乏统一的理论指导\n\n**核心贡献**：\n• 提出多模态信息融合的数学理论框架\n• 证明了跨模态表征学习的收敛性定理\n• 在图像-文本、语音-文本任务上验证了理论有效性\n\n**实际应用**：为设计更高效的多模态模型提供了理论指导，有助于减少训练数据需求。",
                    "created_at": "2025-09-07T20:45:00Z",
                    "chinese_tags": ["多模态", "理论框架", "机器学习", "表征学习"],
                    "url": "https://arxiv.org/abs/2509.03456"
                },
                {
                    "id": 6,
                    "title": "Whisper v3 - OpenAI语音识别模型升级",
                    "source": "huggingface",
                    "stars": 4521,
                    "summary": "**模型改进**：Whisper v3在语音识别精度和多语言支持上显著提升\n\n**技术优化**：\n• 支持99种语言的语音转文字，识别准确率提升20%\n• 改进的标点符号和大小写处理\n• 更好的长音频处理能力，支持小时级别音频\n• 低资源语言的识别效果大幅改善\n\n**应用场景**：适用于会议记录、多语言字幕生成、语音助手等。",
                    "created_at": "2025-09-07T18:20:00Z",
                    "chinese_tags": ["Whisper", "语音识别", "多语言", "OpenAI"],
                    "url": "https://huggingface.co/openai/whisper-large-v3"
                },
                {
                    "id": 7,
                    "title": "Next.js 14 App Router深度实践指南",
                    "source": "zenn",
                    "stars": 1234,
                    "summary": "**全栈开发新范式**：Next.js 14 App Router重新定义了React全栈开发\n\n**核心内容**：\n• Server Components最佳实践与性能优化策略\n• 渐进式迁移方案，从Pages Router平滑过渡\n• 缓存策略详解，提升页面加载速度\n• TypeScript集成与类型安全实践\n\n**实战案例**：包含电商网站、博客系统等完整项目示例。",
                    "created_at": "2025-09-07T16:30:00Z",
                    "chinese_tags": ["Next.js", "App Router", "全栈开发", "React"],
                    "url": "https://zenn.dev/web-dev/articles/nextjs14-app-router-guide"
                },
                {
                    "id": 8,
                    "title": "LangChain框架：构建LLM应用的最佳实践",
                    "source": "github",
                    "stars": 7890,
                    "summary": "**框架特色**：LangChain为构建大语言模型应用提供了完整的工具链\n\n**主要组件**：\n• 模型抽象层，支持多种LLM提供商\n• 向量数据库集成，实现高效的语义搜索\n• 链式调用机制，组合复杂的推理流程\n• 记忆系统，维持对话上下文状态\n\n**应用场景**：适合构建智能客服、文档问答、代码助手等AI应用。",
                    "created_at": "2025-09-07T14:45:00Z",
                    "chinese_tags": ["LangChain", "LLM应用", "向量数据库", "AI框架"],
                    "url": "https://github.com/langchain-ai/langchain"
                },
                {
                    "id": 9,
                    "title": "基于扩散模型的高分辨率图像生成新方法",
                    "source": "arxiv",
                    "stars": 1567,
                    "summary": "**技术创新**：提出了多尺度扩散模型架构，实现超高分辨率图像生成\n\n**方法优势**：\n• 分层生成策略，从低分辨率逐步细化到高分辨率\n• 引入注意力引导机制，提升图像细节质量\n• 训练效率提升3倍，内存占用减少50%\n• 在FID和IS指标上达到新的SOTA性能\n\n**实验结果**：能够生成4K分辨率的逼真图像，在人像、风景等场景表现出色。",
                    "created_at": "2025-09-07T12:00:00Z",
                    "chinese_tags": ["扩散模型", "图像生成", "计算机视觉", "深度学习"],
                    "url": "https://arxiv.org/abs/2509.04567"
                },
                {
                    "id": 10,
                    "title": "Claude 3.5 Sonnet API集成开发实战",
                    "source": "zenn",
                    "stars": 890,
                    "summary": "**API特性介绍**：Claude 3.5 Sonnet在推理能力和代码生成方面的优势\n\n**开发指南**：\n• API认证与配置的最佳实践\n• 流式响应处理，优化用户体验\n• 成本控制策略，合理使用token配额\n• 错误处理与重试机制设计\n\n**实战项目**：构建智能编程助手、文档分析工具等应用示例。",
                    "created_at": "2025-09-07T09:30:00Z",
                    "chinese_tags": ["Claude", "API开发", "人工智能", "编程助手"],
                    "url": "https://zenn.dev/ai-dev/articles/claude-3-5-integration"
                },
                {
                    "id": 11,
                    "title": "DALL-E 3图像生成模型开源替代方案",
                    "source": "huggingface",
                    "stars": 3456,
                    "summary": "**开源优势**：提供与DALL-E 3相媲美的图像生成能力，完全开源可商用\n\n**模型特点**：\n• 支持中文提示词，更好的中文理解能力\n• 多种艺术风格支持，从写实到抽象应有尽有\n• ControlNet集成，精确控制图像生成过程\n• 优化的推理速度，单张图片生成仅需5秒\n\n**社区生态**：活跃的开发者社区，持续优化模型性能。",
                    "created_at": "2025-09-06T22:15:00Z",
                    "chinese_tags": ["DALL-E", "图像生成", "开源模型", "文生图"],
                    "url": "https://huggingface.co/dataautogpt3/OpenDalleV1.1"
                },
                {
                    "id": 12,
                    "title": "深度强化学习在游戏AI中的最新进展",
                    "source": "arxiv",
                    "stars": 678,
                    "summary": "**研究概述**：综述了深度强化学习在电子游戏AI领域的突破性进展\n\n**技术发展**：\n• 从DQN到PPO，算法效率持续提升\n• 多智能体强化学习在团队游戏中的应用\n• 模仿学习结合强化学习的混合训练方法\n• 大规模分布式训练架构设计\n\n**应用成果**：在StarCraft II、Dota 2等复杂游戏中达到职业选手水平。",
                    "created_at": "2025-09-06T19:45:00Z",
                    "chinese_tags": ["强化学习", "游戏AI", "多智能体", "深度学习"],
                    "url": "https://arxiv.org/abs/2509.05678"
                }
            ]
            
            self._set_headers()
            result = mock_cards[:limit]
            self.wfile.write(json.dumps(result).encode('utf-8'))
        else:
            self.send_error(404)

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8000), MockAPIHandler)
    print('Mock API server running on http://localhost:8000')
    server.serve_forever()