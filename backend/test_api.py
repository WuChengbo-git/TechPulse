#!/usr/bin/env python3
"""
TechPulse API测试脚本
用于验证所有功能是否正常工作
"""

import asyncio
import requests
import json
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000/api/v1"

class APITester:
    def __init__(self, base_url=BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = {}
    
    def test_health_check(self):
        """测试健康检查"""
        try:
            response = self.session.get(f"{self.base_url.replace('/api/v1', '')}/health")
            if response.status_code == 200:
                logger.info("✅ 健康检查通过")
                return True
            else:
                logger.error(f"❌ 健康检查失败: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ 健康检查异常: {e}")
            return False
    
    def test_cards_api(self):
        """测试卡片API"""
        try:
            response = self.session.get(f"{self.base_url}/cards/")
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ 卡片API正常，共有 {len(data)} 张卡片")
                return True
            else:
                logger.error(f"❌ 卡片API失败: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ 卡片API异常: {e}")
            return False
    
    def test_sources_api(self):
        """测试数据源API"""
        try:
            response = self.session.get(f"{self.base_url}/sources/")
            if response.status_code == 200:
                logger.info("✅ 数据源API正常")
                return True
            else:
                logger.error(f"❌ 数据源API失败: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ 数据源API异常: {e}")
            return False
    
    def test_ai_api(self):
        """测试AI API"""
        try:
            # 测试AI摘要生成
            test_data = {
                "title": "Test Project",
                "description": "This is a test project for AI functionality",
                "source_type": "github"
            }
            
            response = self.session.post(
                f"{self.base_url}/ai/generate-summary",
                json=test_data
            )
            
            if response.status_code == 200:
                logger.info("✅ AI API正常")
                return True
            else:
                logger.error(f"❌ AI API失败: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ AI API异常: {e}")
            return False
    
    def test_chat_api(self):
        """测试Chat API"""
        try:
            # 测试聊天功能
            test_data = {
                "message": "Hello, this is a test message",
                "conversation_history": []
            }
            
            response = self.session.post(
                f"{self.base_url}/chat/chat",
                json=test_data
            )
            
            if response.status_code == 200:
                logger.info("✅ Chat API正常")
                return True
            else:
                logger.error(f"❌ Chat API失败: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ Chat API异常: {e}")
            return False
    
    def test_scheduler_status(self):
        """测试调度器状态"""
        try:
            response = self.session.get(f"{self.base_url}/scheduler/status")
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ 调度器状态: {data.get('running', False)}")
                return True
            else:
                logger.error(f"❌ 调度器状态检查失败: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ 调度器状态检查异常: {e}")
            return False
    
    def test_content_types(self):
        """测试支持的内容类型"""
        try:
            response = self.session.get(f"{self.base_url}/chat/content-types")
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ 支持 {len(data.get('content_types', []))} 种内容类型")
                return True
            else:
                logger.error(f"❌ 内容类型API失败: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ 内容类型API异常: {e}")
            return False
    
    def run_all_tests(self):
        """运行所有测试"""
        logger.info("🚀 开始API测试...")
        logger.info("=" * 50)
        
        tests = [
            ("健康检查", self.test_health_check),
            ("卡片API", self.test_cards_api),
            ("数据源API", self.test_sources_api),
            ("AI API", self.test_ai_api),
            ("Chat API", self.test_chat_api),
            ("调度器状态", self.test_scheduler_status),
            ("内容类型", self.test_content_types),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            logger.info(f"🧪 测试: {test_name}")
            try:
                if test_func():
                    passed += 1
                    self.results[test_name] = "✅ 通过"
                else:
                    self.results[test_name] = "❌ 失败"
            except Exception as e:
                logger.error(f"❌ 测试 {test_name} 异常: {e}")
                self.results[test_name] = f"❌ 异常: {e}"
            
            logger.info("-" * 30)
        
        logger.info("📊 测试结果总结:")
        logger.info("=" * 50)
        
        for test_name, result in self.results.items():
            logger.info(f"{test_name}: {result}")
        
        logger.info(f"\n🎯 测试通过率: {passed}/{total} ({passed/total*100:.1f}%)")
        
        if passed == total:
            logger.info("🎉 所有测试通过！")
        else:
            logger.warning(f"⚠️ 有 {total-passed} 个测试失败")
        
        return passed == total


def main():
    """主函数"""
    tester = APITester()
    
    print("TechPulse API 测试工具")
    print("=" * 50)
    
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ 所有功能正常，系统可以使用！")
        return 0
    else:
        print("\n❌ 部分功能异常，请检查配置和服务状态")
        return 1


if __name__ == "__main__":
    exit(main())