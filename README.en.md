<div align="center">
  <img src="assets/logo.svg" alt="TechPulse Logo" width="200" height="200">

  # TechPulse

  ### 🚀 Intelligent Tech Intelligence Aggregation Platform - Making Tech Insights More Accurate

  **Language**: [English](README.en.md) | [中文](README.md) | [日本語](README.ja.md)
</div>

<br>

[![Version](https://img.shields.io/badge/version-0.1.8-blue.svg)](https://github.com/yourusername/TechPulse)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)

## 🎯 Project Overview

TechPulse is an intelligent aggregation platform that integrates multi-source tech intelligence, combining GitHub, arXiv, Hugging Face, Zenn and other quality data sources. Through AI enhancement and visual analysis, it helps developers and researchers quickly capture tech trends and improve information acquisition efficiency.

### Core Features

- 🌐 **Multi-Source Data Integration** - GitHub Trending, arXiv papers, HuggingFace models, Zenn tech articles
- 🤖 **AI Enhancement** - OpenAI GPT-powered content summarization and tag translation
- 🌍 **Complete Internationalization** - Support for Chinese, English, and Japanese
- 📊 **Trend Analysis** - Programming language activity, AI field trends, tech stack analysis
- 🔐 **User Authentication** - JWT secure authentication system
- 📱 **Responsive Design** - Adaptive for desktop and mobile devices

## ✨ Core Features

### Data Source Management
- **GitHub Trending** - Track popular open-source projects and repositories
- **arXiv Papers** - Aggregate latest academic papers and research
- **Hugging Face** - AI model and dataset exploration
- **Zenn Articles** - Quality content from Japanese tech community

### Intelligent Analysis
- **Trend Visualization** - Multi-dimensional data chart display
- **Hotspot Tracking** - Identify emerging technologies and trends
- **Tag Classification** - AI automatic extraction and translation of tech tags
- **Smart Recommendations** - Content recommendations based on user preferences

### User Experience
- **Multi-language Interface** - Seamless switching between Chinese, English, and Japanese
- **Custom Filtering** - Flexible data source and content filtering
- **Real-time Updates** - Scheduled automatic fetching of latest tech intelligence
- **Personalized Configuration** - Customizable data sources and display settings

## 🏗️ Project Structure

```
TechPulse/
├── backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── api/          # RESTful API routes
│   │   ├── core/         # Core configuration and database
│   │   ├── models/       # SQLAlchemy data models
│   │   ├── services/     # Business logic services
│   │   └── utils/        # Utility functions
│   ├── tests/            # Unit tests
│   └── requirements.txt  # Python dependencies
├── frontend/             # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # Context API
│   │   ├── utils/        # Utility functions
│   │   └── translations/ # i18n translations
│   └── package.json      # Node.js dependencies
├── scripts/              # Automation scripts
│   ├── dev.sh            # Development environment startup
│   ├── start.sh          # Production startup
│   ├── stop.sh           # Stop services
│   └── version-manager.py # Version management
├── docs/                 # Project documentation
│   ├── FUTURE_FEATURES.md     # Planned features
│   ├── DEVELOPMENT_LOG.md     # Development log
│   ├── RELEASE.md             # Release history
│   ├── SETUP_GUIDE.md         # Installation guide
│   ├── DEPLOYMENT_GUIDE.md    # Deployment guide
│   └── ...                    # Other docs
├── logs/                 # Log files
├── .gitignore
├── LICENSE
└── README.md
```

## 🚀 Quick Start

### Requirements

- **Python** 3.9+
- **Node.js** 16+
- **npm** or **yarn**
- **SQLite** (development) / **PostgreSQL** (production)

### One-Click Start (Development)

```bash
# Clone the repository
git clone https://github.com/yourusername/TechPulse.git
cd TechPulse

# Start development environment (frontend + backend)
chmod +x scripts/dev.sh
./scripts/dev.sh
```

### Manual Installation

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env file, configure necessary API keys

# Start backend service
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access Application

- **Frontend Interface**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health Check**: http://localhost:8000/health

## 📊 Main Features

### Data Source Pages
- **Overview** - Comprehensive overview displaying latest content from all sources
- **GitHub** - GitHub Trending repositories and projects
- **arXiv** - Latest academic papers and research
- **Hugging Face** - AI models and datasets
- **Zenn** - Japanese tech community articles

### Intelligent Analysis
- **Trends** - Tech trend analysis and visualization
- **Analytics** - Data statistics and insight reports
- **AI Chat** - AI assistant Q&A (planned)

### System Management
- **Data Sources** - Data source configuration and management
- **Settings** - Personal preferences and system settings

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Ant Design 5** - UI component library
- **@ant-design/charts** - Data visualization
- **React Router** - Route management
- **Axios** - HTTP client

### Backend
- **FastAPI** - High-performance web framework
- **SQLAlchemy** - ORM database operations
- **Pydantic** - Data validation
- **JWT** - Authentication
- **bcrypt** - Password encryption
- **OpenAI API** - AI translation service

### Database
- **SQLite** - Development environment
- **PostgreSQL** - Production environment (recommended)

### Tools & Services
- **OpenAI GPT-3.5** - Smart translation and summarization
- **GitHub API** - Open-source project data
- **arXiv API** - Academic paper data
- **Hugging Face API** - AI model information

## 📖 Documentation Index

### User Documentation
- [Installation Guide](docs/SETUP_GUIDE.md) - Detailed environment configuration
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment steps
- [Authentication System](docs/AUTH_SYSTEM_COMPLETE.md) - Authentication features

### Development Documentation
- [Development Log](docs/DEVELOPMENT_LOG.md) - Development history and technical decisions
- [Release History](docs/RELEASE.md) - Detailed version update history
- [Future Features](docs/FUTURE_FEATURES.md) - Future planning and feature roadmap
- [Project Structure](docs/project-structure.md) - Code organization architecture
- [Optimization Guide](docs/OPTIMIZATION_GUIDE.md) - Performance optimization suggestions

### Technical Documentation
- [Language System](docs/LANGUAGE_AUTO_DETECTION_GUIDE.md) - Multi-language implementation
- [Translation System](docs/TRANSLATION_GENERATION_PLAN.md) - AI translation architecture
- [Version Management](docs/VERSION_MANAGEMENT.md) - Version control workflow

## 🎯 Version History

### Latest Version - v0.1.8 (2025-10-04)
- ✨ Complete Chinese/English/Japanese support
- 🤖 AI-driven real-time tag translation
- 🔐 JWT user authentication system
- 🎨 180+ translation keys full coverage
- ⚡ Dual-layer cache performance optimization

View [Complete Version History](docs/RELEASE.md)

## 🤝 Contributing

We welcome all forms of contributions!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Create a Pull Request**

### Code Standards

- Follow ESLint and Prettier configurations
- Write clear commit messages
- Add necessary unit tests
- Update relevant documentation

### Report Issues

Found a bug? Have a feature suggestion? Please let us know through [GitHub Issues](https://github.com/yourusername/TechPulse/issues).

## 📋 Planned Features

See [FUTURE_FEATURES.md](docs/FUTURE_FEATURES.md) for detailed planning.

### High Priority
- 🔑 Forgot password feature (email verification code reset)
- 🌐 Multi-language translation improvements

### Medium Priority
- 📦 Batch import/export of data sources
- 🔍 Advanced search and filtering

### Low Priority
- 🔔 Real-time notification system
- 📊 Advanced data analysis dashboard

## 📄 License

This project is licensed under the [MIT License](LICENSE) - free to use, modify, and distribute.

## 🙏 Acknowledgments

- **Ant Design** - Excellent React UI component library
- **FastAPI** - Modern Python web framework
- **OpenAI** - Powerful AI API services
- **All Contributors** - Thanks to every participant

## 📞 Contact

- **Project Homepage**: https://github.com/yourusername/TechPulse
- **Issues**: https://github.com/yourusername/TechPulse/issues
- **Discussions**: https://github.com/yourusername/TechPulse/discussions

---

**TechPulse Team** - Making Tech Insights More Accurate 🎯
