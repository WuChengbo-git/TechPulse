"""
Email service for sending verification and password reset emails
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
import logging
from .config import settings

logger = logging.getLogger(__name__)


async def send_email(
    to_emails: List[str],
    subject: str,
    html_content: str,
    text_content: str = None
) -> bool:
    """
    发送邮件

    Args:
        to_emails: 收件人邮箱列表
        subject: 邮件主题
        html_content: HTML 内容
        text_content: 纯文本内容（可选）

    Returns:
        发送是否成功
    """
    if not settings.smtp_host or not settings.smtp_from_email:
        logger.warning("SMTP not configured, skipping email send")
        return False

    try:
        # 创建邮件
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        message["To"] = ", ".join(to_emails)

        # 添加纯文本和 HTML 版本
        if text_content:
            part1 = MIMEText(text_content, "plain", "utf-8")
            message.attach(part1)

        part2 = MIMEText(html_content, "html", "utf-8")
        message.attach(part2)

        # 发送邮件
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_username,
            password=settings.smtp_password,
            use_tls=True
        )

        logger.info(f"Email sent successfully to {to_emails}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False


async def send_verification_email(email: str, username: str, token: str) -> bool:
    """
    发送邮箱验证邮件

    Args:
        email: 用户邮箱
        username: 用户名
        token: 验证令牌

    Returns:
        发送是否成功
    """
    verification_url = f"{settings.frontend_url}/auth/verify-email?token={token}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ margin-top: 20px; text-align: center; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>欢迎来到 TechPulse</h1>
            </div>
            <div class="content">
                <p>你好 <strong>{username}</strong>,</p>
                <p>感谢您注册 TechPulse！请点击下面的按钮验证您的邮箱地址：</p>
                <div style="text-align: center;">
                    <a href="{verification_url}" class="button">验证邮箱</a>
                </div>
                <p>或者复制以下链接到浏览器：</p>
                <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">
                    {verification_url}
                </p>
                <p>此链接将在 48 小时后失效。</p>
                <p>如果您没有注册 TechPulse 账号，请忽略此邮件。</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 TechPulse. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"""
    欢迎来到 TechPulse

    你好 {username},

    感谢您注册 TechPulse！请访问以下链接验证您的邮箱地址：

    {verification_url}

    此链接将在 48 小时后失效。

    如果您没有注册 TechPulse 账号，请忽略此邮件。

    © 2025 TechPulse. All rights reserved.
    """

    return await send_email(
        to_emails=[email],
        subject="验证您的 TechPulse 账号",
        html_content=html_content,
        text_content=text_content
    )


async def send_password_reset_email(email: str, username: str, token: str) -> bool:
    """
    发送密码重置邮件

    Args:
        email: 用户邮箱
        username: 用户名
        token: 重置令牌

    Returns:
        发送是否成功
    """
    reset_url = f"{settings.frontend_url}/auth/reset-password?token={token}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }}
            .footer {{ margin-top: 20px; text-align: center; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>重置密码</h1>
            </div>
            <div class="content">
                <p>你好 <strong>{username}</strong>,</p>
                <p>我们收到了您的密码重置请求。请点击下面的按钮重置密码：</p>
                <div style="text-align: center;">
                    <a href="{reset_url}" class="button">重置密码</a>
                </div>
                <p>或者复制以下链接到浏览器：</p>
                <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">
                    {reset_url}
                </p>
                <div class="warning">
                    <strong>安全提示：</strong> 此链接将在 24 小时后失效。如果您没有请求重置密码，请忽略此邮件并考虑修改您的密码以确保账号安全。
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2025 TechPulse. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"""
    重置密码

    你好 {username},

    我们收到了您的密码重置请求。请访问以下链接重置密码：

    {reset_url}

    此链接将在 24 小时后失效。

    安全提示：如果您没有请求重置密码，请忽略此邮件并考虑修改您的密码以确保账号安全。

    © 2025 TechPulse. All rights reserved.
    """

    return await send_email(
        to_emails=[email],
        subject="重置您的 TechPulse 密码",
        html_content=html_content,
        text_content=text_content
    )


async def send_mfa_enabled_email(email: str, username: str) -> bool:
    """
    发送 MFA 启用通知邮件

    Args:
        email: 用户邮箱
        username: 用户名

    Returns:
        发送是否成功
    """
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .success {{ background: #d4edda; border-left: 4px solid #28a745; padding: 10px; margin: 20px 0; }}
            .footer {{ margin-top: 20px; text-align: center; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>双因素认证已启用</h1>
            </div>
            <div class="content">
                <p>你好 <strong>{username}</strong>,</p>
                <div class="success">
                    您的账号已成功启用双因素认证（MFA），账号安全性得到了增强。
                </div>
                <p>从现在开始，登录时需要：</p>
                <ol>
                    <li>输入用户名和密码</li>
                    <li>输入身份验证器应用中的 6 位验证码</li>
                </ol>
                <p><strong>请妥善保管您的备用验证码</strong>，以防身份验证器不可用时使用。</p>
                <p>如果这不是您的操作，请立即联系我们的支持团队。</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 TechPulse. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    return await send_email(
        to_emails=[email],
        subject="双因素认证已启用 - TechPulse",
        html_content=html_content
    )
