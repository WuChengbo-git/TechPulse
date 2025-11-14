"""
标签映射工具模块
将技术标识（如arXiv分类、内部标识）转换为用户友好的显示名称
"""

from typing import List, Dict

# arXiv分类映射表
ARXIV_CATEGORY_MAP = {
    # 计算机科学
    "cs.AI": "人工智能",
    "cs.AR": "硬件架构",
    "cs.CC": "计算复杂性",
    "cs.CE": "计算工程",
    "cs.CG": "计算几何",
    "cs.CL": "自然语言处理",
    "cs.CR": "密码学与安全",
    "cs.CV": "计算机视觉",
    "cs.CY": "计算机与社会",
    "cs.DB": "数据库",
    "cs.DC": "分布式计算",
    "cs.DL": "数字图书馆",
    "cs.DM": "离散数学",
    "cs.DS": "数据结构与算法",
    "cs.ET": "新兴技术",
    "cs.FL": "形式语言",
    "cs.GL": "通用文献",
    "cs.GR": "图形学",
    "cs.GT": "博弈论",
    "cs.HC": "人机交互",
    "cs.IR": "信息检索",
    "cs.IT": "信息论",
    "cs.LG": "机器学习",
    "cs.LO": "逻辑",
    "cs.MA": "多智能体系统",
    "cs.MM": "多媒体",
    "cs.MS": "数学软件",
    "cs.NA": "数值分析",
    "cs.NE": "神经与进化计算",
    "cs.NI": "网络与互联网",
    "cs.OH": "其他计算机科学",
    "cs.OS": "操作系统",
    "cs.PF": "性能",
    "cs.PL": "编程语言",
    "cs.RO": "机器人学",
    "cs.SC": "符号计算",
    "cs.SD": "声音",
    "cs.SE": "软件工程",
    "cs.SI": "社交网络",
    "cs.SY": "系统与控制",

    # 统计学
    "stat.ML": "机器学习(统计)",
    "stat.AP": "应用统计",
    "stat.CO": "计算统计",
    "stat.ME": "方法论",
    "stat.OT": "其他统计",
    "stat.TH": "统计理论",

    # 数学
    "math.OC": "优化与控制",
    "math.ST": "统计理论",
    "math.NA": "数值分析",
    "math.IT": "信息论",
    "math.PR": "概率论",

    # 物理学
    "physics.comp-ph": "计算物理",
    "physics.data-an": "数据分析",

    # 电气工程
    "eess.AS": "音频与语音处理",
    "eess.IV": "图像与视频处理",
    "eess.SP": "信号处理",
    "eess.SY": "系统与控制",

    # 量化生物学
    "q-bio.QM": "定量方法",
    "q-bio.NC": "神经与认知",
}

# 常见技术标签映射
TECH_TAG_MAP = {
    # 编程语言
    "python": "Python",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "java": "Java",
    "cpp": "C++",
    "c": "C",
    "go": "Go",
    "rust": "Rust",
    "julia": "Julia",
    "r": "R",
    "matlab": "MATLAB",
    "scala": "Scala",
    "kotlin": "Kotlin",
    "swift": "Swift",

    # 框架和库
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "keras": "Keras",
    "scikit-learn": "Scikit-learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "scipy": "SciPy",
    "opencv": "OpenCV",
    "huggingface": "Hugging Face",
    "transformers": "Transformers",
    "langchain": "LangChain",
    "llama": "LLaMA",
    "bert": "BERT",
    "gpt": "GPT",
    "stable-diffusion": "Stable Diffusion",
    "diffusers": "Diffusers",
    "gradio": "Gradio",
    "streamlit": "Streamlit",
    "fastapi": "FastAPI",
    "flask": "Flask",
    "django": "Django",
    "react": "React",
    "vue": "Vue",
    "angular": "Angular",
    "docker": "Docker",
    "kubernetes": "Kubernetes",

    # HuggingFace任务标签
    "text-generation": "文本生成",
    "text-classification": "文本分类",
    "token-classification": "标记分类",
    "question-answering": "问答系统",
    "translation": "机器翻译",
    "summarization": "文本摘要",
    "conversational": "对话系统",
    "text-to-speech": "语音合成",
    "automatic-speech-recognition": "语音识别",
    "audio-classification": "音频分类",
    "image-classification": "图像分类",
    "object-detection": "目标检测",
    "image-segmentation": "图像分割",
    "image-to-text": "图像描述",
    "text-to-image": "文本生成图像",
    "zero-shot-classification": "零样本分类",
    "sentence-similarity": "句子相似度",
    "feature-extraction": "特征提取",
    "fill-mask": "填充掩码",
    "table-question-answering": "表格问答",
    "reinforcement-learning": "强化学习",

    # 产品分析和实验相关
    "ab-testing": "A/B测试",
    "ai-analytics": "AI分析",
    "analytics": "数据分析",
    "cdp": "客户数据平台",
    "data-warehouse": "数据仓库",
    "experiments": "实验功能",
    "feature-flags": "功能开关",
    "product-analytics": "产品分析",
    "session-replay": "会话回放",
    "surveys": "问卷调查",
    "web-analytics": "Web分析",

    # 技术领域
    "machine-learning": "机器学习",
    "deep-learning": "深度学习",
    "natural-language-processing": "自然语言处理",
    "computer-vision": "计算机视觉",
    "data-science": "数据科学",
    "artificial-intelligence": "人工智能",
    "neural-network": "神经网络",
    "cnn": "卷积神经网络",
    "rnn": "循环神经网络",
    "lstm": "长短期记忆网络",
    "gnn": "图神经网络",
    "gan": "生成对抗网络",
    "vae": "变分自编码器",
    "attention": "注意力机制",
    "transformer": "Transformer",
    "diffusion": "扩散模型",
    "mlops": "MLOps",
    "automl": "自动机器学习",
    "explainable-ai": "可解释AI",
    "federated-learning": "联邦学习",
    "transfer-learning": "迁移学习",
    "meta-learning": "元学习",
    "few-shot-learning": "少样本学习",
    "self-supervised": "自监督学习",
    "semi-supervised": "半监督学习",

    # 应用领域
    "robotics": "机器人学",
    "autonomous-driving": "自动驾驶",
    "recommendation-system": "推荐系统",
    "anomaly-detection": "异常检测",
    "time-series": "时间序列",
    "graph-analytics": "图分析",
    "blockchain": "区块链",
    "quantum-computing": "量子计算",
    "edge-computing": "边缘计算",
    "cloud-computing": "云计算",

    # 数据相关
    "dataset": "数据集",
    "data-analysis": "数据分析",
    "data-visualization": "数据可视化",
    "big-data": "大数据",
    "etl": "数据处理",
    "sql": "SQL",
    "nosql": "NoSQL",

    # 工具类别
    "api": "API",
    "library": "代码库",
    "framework": "框架",
    "tool": "工具",
    "benchmark": "基准测试",
    "evaluation": "评估",
    "tutorial": "教程",
    "documentation": "文档",
    "research": "研究",
    "paper": "论文",
    "code": "代码",
    "notebook": "笔记本",
    "demo": "演示",
    "project": "项目",
}

# 保留不翻译的标签（通常是已经是友好名称的）
KEEP_AS_IS = {
    "LLM", "GPT", "BERT", "YOLO", "API", "UI", "UX",
    "3D", "2D", "AI", "ML", "NLP", "CV", "RL", "DQN",
    "Python", "PyTorch", "TensorFlow", "Docker", "Git",
    "LLaMA", "ChatGPT", "Stable Diffusion",
}


def map_tag_to_display_name(tag: str) -> str:
    """
    将单个标签转换为显示名称

    Args:
        tag: 原始标签（如 "cs.CV", "pytorch", "text-generation"）

    Returns:
        友好的显示名称
    """
    if not tag or not isinstance(tag, str):
        return tag

    # 去除首尾空格
    tag = tag.strip()

    # 如果是需要保留的标签，直接返回
    if tag in KEEP_AS_IS:
        return tag

    # 首先检查arXiv分类
    if tag in ARXIV_CATEGORY_MAP:
        return ARXIV_CATEGORY_MAP[tag]

    # 检查技术标签映射（不区分大小写）
    tag_lower = tag.lower()
    if tag_lower in TECH_TAG_MAP:
        return TECH_TAG_MAP[tag_lower]

    # 处理一些常见的变体
    # 移除连字符和下划线，尝试匹配
    tag_normalized = tag_lower.replace("-", "").replace("_", "")
    for key, value in TECH_TAG_MAP.items():
        key_normalized = key.replace("-", "").replace("_", "")
        if tag_normalized == key_normalized:
            return value

    # 如果都没匹配到，返回原标签（首字母大写）
    return tag.capitalize()


def map_tags_to_display_names(tags: List[str], max_tags: int = None, language: str = 'zh') -> List[str]:
    """
    批量转换标签为显示名称

    Args:
        tags: 标签列表
        max_tags: 最多返回多少个标签（None表示全部）
        language: 目标语言 ('zh', 'en', 'ja')

    Returns:
        转换后的显示名称列表
    """
    if not tags:
        return []

    # 如果是英文，直接返回首字母大写的标签
    if language == 'en':
        unique_names = []
        seen = set()
        for tag in tags:
            display_name = tag if tag in KEEP_AS_IS else tag.replace('-', ' ').replace('_', ' ').title()
            if display_name not in seen:
                seen.add(display_name)
                unique_names.append(display_name)
        if max_tags:
            unique_names = unique_names[:max_tags]
        return unique_names

    # 转换所有标签（中文或日文）
    display_names = [map_tag_to_display_name(tag) for tag in tags]

    # 去重但保持顺序
    seen = set()
    unique_names = []
    for name in display_names:
        if name not in seen:
            seen.add(name)
            unique_names.append(name)

    # 限制数量
    if max_tags:
        unique_names = unique_names[:max_tags]

    # 如果是日文，转换中文标签为日文
    if language == 'ja':
        unique_names = [_translate_to_japanese(name) for name in unique_names]

    return unique_names


# 中文到日文的映射（常用技术词汇）
ZH_TO_JA_MAP = {
    "A/B测试": "A/Bテスト",
    "AI分析": "AI分析",
    "数据分析": "データ分析",
    "客户数据平台": "顧客データプラットフォーム",
    "数据仓库": "データウェアハウス",
    "实验功能": "実験機能",
    "功能开关": "フィーチャーフラグ",
    "产品分析": "プロダクト分析",
    "会话回放": "セッションリプレイ",
    "问卷调查": "アンケート",
    "人工智能": "人工知能",
    "机器学习": "機械学習",
    "深度学习": "深層学習",
    "自然语言处理": "自然言語処理",
    "计算机视觉": "コンピュータビジョン",
    "数据科学": "データサイエンス",
    "神经网络": "ニューラルネットワーク",
    "强化学习": "強化学習",
    "机器人学": "ロボティクス",
    "文本生成": "テキスト生成",
    "文本分类": "テキスト分類",
    "标记分类": "トークン分類",
    "问答系统": "質問応答システム",
    "机器翻译": "機械翻訳",
    "文本摘要": "テキスト要約",
    "对话系统": "対話システム",
    "语音合成": "音声合成",
    "语音识别": "音声認識",
    "音频分类": "音声分類",
    "图像分类": "画像分類",
    "目标检测": "物体検出",
    "图像分割": "画像セグメンテーション",
    "图像描述": "画像キャプション",
    "文本生成图像": "テキストから画像生成",
    "卷积神经网络": "畳み込みニューラルネットワーク",
    "循环神经网络": "再帰型ニューラルネットワーク",
    "长短期记忆网络": "長短期記憶ネットワーク",
    "图神经网络": "グラフニューラルネットワーク",
    "生成对抗网络": "敵対的生成ネットワーク",
    "推荐系统": "レコメンドシステム",
    "异常检测": "異常検知",
    "时间序列": "時系列",
    "自动驾驶": "自動運転",
    "大数据": "ビッグデータ",
    "数据可视化": "データ可視化",
    "数据处理": "データ処理",
    "代码库": "ライブラリ",
    "框架": "フレームワーク",
    "工具": "ツール",
    "基准测试": "ベンチマーク",
    "评估": "評価",
}


def _translate_to_japanese(chinese_text: str) -> str:
    """将中文技术词汇转换为日文"""
    # 直接映射
    if chinese_text in ZH_TO_JA_MAP:
        return ZH_TO_JA_MAP[chinese_text]

    # 如果是英文或已经是日文，直接返回
    if chinese_text in KEEP_AS_IS or not any('\u4e00' <= c <= '\u9fff' for c in chinese_text):
        return chinese_text

    # 未找到映射，返回原文
    return chinese_text


def get_tag_category(tag: str) -> str:
    """
    获取标签的类别

    Args:
        tag: 原始标签

    Returns:
        类别：'arxiv', 'framework', 'task', 'domain', 'other'
    """
    tag_lower = tag.lower()

    if tag in ARXIV_CATEGORY_MAP:
        return 'arxiv'

    frameworks = ['pytorch', 'tensorflow', 'keras', 'scikit-learn', 'transformers']
    if tag_lower in frameworks:
        return 'framework'

    if any(task in tag_lower for task in ['classification', 'detection', 'generation', 'recognition']):
        return 'task'

    domains = ['cv', 'nlp', 'ml', 'robotics', 'data-science']
    if tag_lower in domains:
        return 'domain'

    return 'other'


def enrich_card_tags(card_data: Dict) -> Dict:
    """
    丰富卡片数据，添加显示名称字段

    Args:
        card_data: 卡片数据字典

    Returns:
        添加了 display_tags 字段的卡片数据
    """
    if 'chinese_tags' in card_data and card_data['chinese_tags']:
        card_data['display_tags'] = map_tags_to_display_names(
            card_data['chinese_tags'],
            max_tags=10  # 最多显示10个标签
        )
    else:
        card_data['display_tags'] = []

    return card_data
