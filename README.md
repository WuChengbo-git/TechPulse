# TechPulse

AI技術情報の可視化ダッシュボード - GitHub、arXiv、HuggingFace、Zennから最新の技術トレンドを収集・分析

**言語**: [English](README.en.md) | [中文](README.md) | [日本語](README.ja.md)

## 🚀 クイックスタート

```bash
# バックエンド起動
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# フロントエンド起動（別のターミナル）
cd frontend
npm run dev
```

アクセス: http://localhost:5173

## 📚 ドキュメント

すべてのドキュメントは `docs/` ディレクトリにあります：

### バージョン履歴
- **[CHANGELOG_v0.5.0.md](docs/CHANGELOG_v0.5.0.md)** - v0.5.0 変更履歴
- **[v0.4.1-bugfix-and-field-filter.md](docs/v0.4.1-bugfix-and-field-filter.md)** - v0.4.1 バグ修正
- **[v0.4.0-completion-summary.md](docs/v0.4.0-completion-summary.md)** - v0.4.0 完成まとめ

### 機能実装まとめ
- **[NEW_FEATURES_SUMMARY.md](docs/NEW_FEATURES_SUMMARY.md)** - 新機能実装詳細
- **[LOAD_MORE_FEATURE_SUMMARY.md](docs/LOAD_MORE_FEATURE_SUMMARY.md)** - 読み込み機能
- **[BUGFIX_SUMMARY.md](docs/BUGFIX_SUMMARY.md)** - バグ修正詳細

### 開発ガイド
- **[VERSION_MANAGEMENT.md](docs/VERSION_MANAGEMENT.md)** - バージョン管理
- **[RELEASE.md](docs/RELEASE.md)** - リリースガイド

## ✨ 主な機能

- **📊 トレンド分析** - AI技術の人気度とトレンドを可視化
- **🔍 データ探索** - GitHub、arXiv、HuggingFace、Zennから情報収集
- **⭐ お気に入り** - タグ付きお気に入り管理
- **🎯 今日のおすすめ** - パーソナライズされた推薦
- **🚀 クイック表示** - モーダルで素早くプレビュー
- **🔖 タグ管理** - お気に入りにカスタムタグを追加

## 🛠️ 技術スタック

### バックエンド
- **FastAPI** - 高性能Webフレームワーク
- **SQLAlchemy** - ORM
- **Python 3.10+**

### フロントエンド
- **React 18** - UIフレームワーク
- **TypeScript** - 型安全
- **Ant Design 5** - UIコンポーネント
- **Vite** - ビルドツール

## 📦 プロジェクト構成

```
TechPulse/
├── backend/          # FastAPI バックエンド
│   ├── app/          # アプリケーションコード
│   ├── tests/        # テスト
│   └── venv/         # 仮想環境
├── frontend/         # React フロントエンド
│   ├── src/          # ソースコード
│   ├── dist/         # ビルド済みファイル
│   └── package.json  # 依存関係
├── docs/             # ドキュメント
└── README.md         # このファイル
```

## 🔧 開発

### 環境要件
- Python 3.10+
- Node.js 16+
- npm または yarn

### 開発の流れ
1. イシューを確認または作成
2. 機能ブランチを作成
3. コードを実装
4. テストを実行
5. プルリクエストを作成

詳細は `docs/` ディレクトリのドキュメントを参照してください。

## 📝 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照

## 📞 連絡先

- GitHub Issues: https://github.com/WuChengbo-git/TechPulse/issues
- Discussions: https://github.com/WuChengbo-git/TechPulse/discussions

---

**TechPulse** - AI技術トレンドを可視化 🎯
