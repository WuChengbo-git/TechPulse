export interface TechCard {
  id: number
  title: string
  source: 'github' | 'arxiv' | 'huggingface' | 'zenn'
  original_url: string
  summary?: string
  chinese_tags?: string[]
  display_tags?: string[]  // 友好显示的标签名称
  ai_category?: string[]
  tech_stack?: string[]
  license?: string
  stars?: number
  forks?: number
  issues?: number
  trial_suggestion?: string
  status: string
  created_at: string
  quality_score?: number
}
