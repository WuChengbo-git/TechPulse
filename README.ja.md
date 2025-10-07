<div align="center">
  <img src="assets/logo.svg" alt="TechPulse Logo" width="200" height="200">

  # TechPulse

  ### 🚀 インテリジェント技術情報集約プラットフォーム - より正確な技術洞察を

  **言語**: [English](README.en.md) | [中文](README.md) | [日本語](README.ja.md)
</div>

<br>

[![Version](https://img.shields.io/badge/version-0.1.8-blue.svg)](https://github.com/yourusername/TechPulse)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)

## 🎯 プロジェクト概要

TechPulseは、GitHub、arXiv、Hugging Face、Zennなどの優良データソースを統合した、マルチソース技術情報のインテリジェント集約プラットフォームです。AI強化とビジュアル分析により、開発者や研究者が技術トレンドを素早く捉え、情報取得効率を向上させることを支援します。

### コア機能

- 🌐 **マルチソースデータ統合** - GitHub Trending、arXiv論文、HuggingFaceモデル、Zenn技術記事
- 🤖 **AI強化** - OpenAI GPT駆動のコンテンツ要約とタグ翻訳
- 🌍 **完全国際化対応** - 中国語、英語、日本語をサポート
- 📊 **トレンド分析** - プログラミング言語活動度、AI分野動向、技術スタック分析
- 🔐 **ユーザー認証** - JWTセキュア認証システム
- 📱 **レスポンシブデザイン** - デスクトップとモバイルデバイスに対応

## ✨ 主要機能

### データソース管理
- **GitHub Trending** - 人気のオープンソースプロジェクトとリポジトリを追跡
- **arXiv Papers** - 最新の学術論文と研究成果を集約
- **Hugging Face** - AIモデルとデータセットの探索
- **Zenn Articles** - 日本の技術コミュニティの良質なコンテンツ

### インテリジェント分析
- **トレンド可視化** - 多次元データチャート表示
- **ホットスポット追跡** - 新興技術とトレンドの識別
- **タグ分類** - AI自動抽出と技術タグの翻訳
- **スマート推奨** - ユーザー好みに基づくコンテンツ推奨

### ユーザー体験
- **多言語インターフェース** - 中国語、英語、日本語のシームレス切替
- **カスタムフィルタリング** - 柔軟なデータソースとコンテンツフィルタリング
- **リアルタイム更新** - 定期的な最新技術情報の自動取得
- **パーソナライズ設定** - カスタマイズ可能なデータソースと表示設定

## 🏗️ プロジェクト構造

```
TechPulse/
├── backend/              # Python FastAPIバックエンド
│   ├── app/
│   │   ├── api/          # RESTful APIルート
│   │   ├── core/         # コア設定とデータベース
│   │   ├── models/       # SQLAlchemyデータモデル
│   │   ├── services/     # ビジネスロジックサービス
│   │   └── utils/        # ユーティリティ関数
│   ├── tests/            # ユニットテスト
│   └── requirements.txt  # Python依存関係
├── frontend/             # React + TypeScriptフロントエンド
│   ├── src/
│   │   ├── components/   # Reactコンポーネント
│   │   ├── pages/        # ページコンポーネント
│   │   ├── contexts/     # Context API
│   │   ├── utils/        # ユーティリティ関数
│   │   └── translations/ # 国際化翻訳
│   └── package.json      # Node.js依存関係
├── scripts/              # 自動化スクリプト
│   ├── dev.sh            # 開発環境起動
│   ├── start.sh          # 本番環境起動
│   ├── stop.sh           # サービス停止
│   └── version-manager.py # バージョン管理
├── docs/                 # プロジェクトドキュメント
│   ├── FUTURE_FEATURES.md     # 開発予定機能
│   ├── DEVELOPMENT_LOG.md     # 開発ログ
│   ├── RELEASE.md             # リリース履歴
│   ├── SETUP_GUIDE.md         # インストールガイド
│   ├── DEPLOYMENT_GUIDE.md    # デプロイガイド
│   └── ...                    # その他のドキュメント
├── logs/                 # ログファイル
├── .gitignore
├── LICENSE
└── README.md
```

## 🚀 クイックスタート

### 環境要件

- **Python** 3.9+
- **Node.js** 16+
- **npm** または **yarn**
- **SQLite** (開発) / **PostgreSQL** (本番)

### ワンクリック起動（開発環境）

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/TechPulse.git
cd TechPulse

# 開発環境を起動（フロントエンド + バックエンド）
chmod +x scripts/dev.sh
./scripts/dev.sh
```

### 手動インストール

#### バックエンドセットアップ

```bash
cd backend

# 仮想環境を作成
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係をインストール
pip install -r requirements.txt

# 環境変数を設定
cp .env.example .env
# .envファイルを編集し、必要なAPIキーを設定

# バックエンドサービスを起動
uvicorn app.main:app --reload --port 8000
```

#### フロントエンドセットアップ

```bash
cd frontend

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### アプリケーションへのアクセス

- **フロントエンドインターフェース**: http://localhost:3000
- **バックエンドAPIドキュメント**: http://localhost:8000/docs
- **バックエンドヘルスチェック**: http://localhost:8000/health

## 📊 主要機能紹介

### データソースページ
- **Overview** - 全データソースの最新コンテンツを表示する総合概要
- **GitHub** - GitHub Trendingリポジトリとプロジェクト
- **arXiv** - 最新の学術論文と研究
- **Hugging Face** - AIモデルとデータセット
- **Zenn** - 日本の技術コミュニティ記事

### インテリジェント分析
- **Trends** - 技術トレンド分析と可視化
- **Analytics** - データ統計とインサイトレポート
- **AI Chat** - AIアシスタントQ&A（計画中）

### システム管理
- **Data Sources** - データソース設定と管理
- **Settings** - 個人設定とシステム設定

## 🛠️ 技術スタック

### フロントエンド
- **React 18** - UIフレームワーク
- **TypeScript** - 型安全性
- **Ant Design 5** - UIコンポーネントライブラリ
- **@ant-design/charts** - データ可視化
- **React Router** - ルート管理
- **Axios** - HTTPクライアント

### バックエンド
- **FastAPI** - 高性能Webフレームワーク
- **SQLAlchemy** - ORMデータベース操作
- **Pydantic** - データ検証
- **JWT** - 認証
- **bcrypt** - パスワード暗号化
- **OpenAI API** - AI翻訳サービス

### データベース
- **SQLite** - 開発環境
- **PostgreSQL** - 本番環境（推奨）

### ツールとサービス
- **OpenAI GPT-3.5** - スマート翻訳と要約
- **GitHub API** - オープンソースプロジェクトデータ
- **arXiv API** - 学術論文データ
- **Hugging Face API** - AIモデル情報

## 📖 ドキュメント索引

### ユーザードキュメント
- [インストールガイド](docs/SETUP_GUIDE.md) - 詳細な環境設定説明
- [デプロイガイド](docs/DEPLOYMENT_GUIDE.md) - 本番環境デプロイ手順
- [認証システム](docs/AUTH_SYSTEM_COMPLETE.md) - 認証機能説明

### 開発ドキュメント
- [開発ログ](docs/DEVELOPMENT_LOG.md) - 開発履歴と技術的決定
- [リリース履歴](docs/RELEASE.md) - 詳細なバージョン更新履歴
- [開発予定機能](docs/FUTURE_FEATURES.md) - 今後の計画と機能ロードマップ
- [プロジェクト構造](docs/project-structure.md) - コード組織アーキテクチャ
- [最適化ガイド](docs/OPTIMIZATION_GUIDE.md) - パフォーマンス最適化提案

### 技術ドキュメント
- [言語システム](docs/LANGUAGE_AUTO_DETECTION_GUIDE.md) - 多言語実装方案
- [翻訳システム](docs/TRANSLATION_GENERATION_PLAN.md) - AI翻訳アーキテクチャ
- [バージョン管理](docs/VERSION_MANAGEMENT.md) - バージョン制御ワークフロー

## 🎯 バージョン履歴

### 最新バージョン - v0.1.8 (2025-10-04)
- ✨ 完全な中国語/英語/日本語サポート
- 🤖 AI駆動のリアルタイムタグ翻訳
- 🔐 JWTユーザー認証システム
- 🎨 180以上の翻訳キー完全カバレッジ
- ⚡ デュアルレイヤーキャッシュパフォーマンス最適化

[完全なバージョン履歴](docs/RELEASE.md)を表示

## 🤝 コントリビューション

あらゆる形式のコントリビューションを歓迎します！

### コントリビューション方法

1. **リポジトリをフォーク**
2. **機能ブランチを作成** (`git checkout -b feature/AmazingFeature`)
3. **変更をコミット** (`git commit -m 'Add some AmazingFeature'`)
4. **ブランチにプッシュ** (`git push origin feature/AmazingFeature`)
5. **プルリクエストを作成**

### コード規約

- ESLintとPrettierの設定に従う
- 明確なコミットメッセージを書く
- 必要なユニットテストを追加
- 関連ドキュメントを更新

### 問題報告

バグを発見しましたか？機能提案がありますか？[GitHub Issues](https://github.com/yourusername/TechPulse/issues)でお知らせください。

## 📋 開発予定機能

詳細な計画については[FUTURE_FEATURES.md](docs/FUTURE_FEATURES.md)をご覧ください。

### 高優先度
- 🔑 パスワード忘れ機能（メール確認コードリセット）
- 🌐 多言語翻訳の改善

### 中優先度
- 📦 データソースの一括インポート/エクスポート
- 🔍 高度な検索とフィルタリング

### 低優先度
- 🔔 リアルタイム通知システム
- 📊 高度なデータ分析ダッシュボード

## 📄 ライセンス

このプロジェクトは[MITライセンス](LICENSE)の下でライセンスされています - 自由に使用、修正、配布できます。

## 🙏 謝辞

- **Ant Design** - 優れたReact UIコンポーネントライブラリ
- **FastAPI** - モダンなPython Webフレームワーク
- **OpenAI** - 強力なAI APIサービス
- **すべてのコントリビューター** - すべての参加者に感謝します

## 📞 連絡先

- **プロジェクトホームページ**: https://github.com/yourusername/TechPulse
- **Issues**: https://github.com/yourusername/TechPulse/issues
- **Discussions**: https://github.com/yourusername/TechPulse/discussions

---

**TechPulse Team** - より正確な技術洞察を 🎯
