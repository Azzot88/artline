"""
Email service for sending verification codes and reminders via SMTP.
Supports multi-language templates (ru, kk, ky, en).
"""

import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings


class EmailService:
    """Email sending service using mailU SMTP"""
    
    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_body: str
    ) -> bool:
        """
        Send email via SMTP asynchronously.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_body: HTML content of email
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            # Run blocking SMTP operation in executor
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                EmailService._send_email_sync,
                to_email,
                subject,
                html_body
            )
            return True
        except Exception as e:
            print(f"ERROR: Failed to send email to {to_email}: {e}")
            return False
    
    @staticmethod
    def _send_email_sync(to_email: str, subject: str, html_body: str):
        """Synchronous SMTP send operation"""
        msg = MIMEMultipart('alternative')
        msg['From'] = settings.SMTP_FROM
        msg['To'] = to_email
        msg['Subject'] = subject
        
        html_part = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Port 465 uses SMTP_SSL
        if settings.SMTP_PORT == 465 and settings.SMTP_USE_SSL:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
        else:
            # Port 587 uses STARTTLS
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
    
    @staticmethod
    def get_verification_email_template(code: str, language: str = "ru") -> tuple[str, str]:
        """
        Get localized email template for verification code.
        
        Returns:
            tuple: (subject, html_body)
        """
        templates = {
            "ru": {
                "subject": "Подтвердите ваш email - ArtLine",
                "title": "Подтвердите ваш email",
                "greeting": "Здравствуйте!",
                "message": "Спасибо за регистрацию в ArtLine. Ваш код подтверждения:",
                "instruction": "Введите этот код в приложении для подтверждения вашего email-адреса.",
                "expires": "Код действителен в течение 30 минут.",
                "footer": "Если вы не регистрировались в ArtLine, игнорируйте это письмо."
            },
            "kk": {
                "subject": "Email мекенжайыңызды растаңыз - ArtLine",
                "title": "Email мекенжайыңызды растаңыз",
                "greeting": "Сәлеметсіз бе!",
                "message": "ArtLine-ға тіркелгеніңіз үшін рақмет. Сіздің растау кодыңыз:",
                "instruction": "Email мекенжайыңызды растау үшін бұл кодты қолданбада енгізіңіз.",
                "expires": "Код 30 минут бойы жарамды.",
                "footer": "Егер сіз ArtLine-ға тіркелмесеңіз, бұл хатты елемеңіз."
            },
            "ky": {
                "subject": "Email дарегиңизди ырастаңыз - ArtLine",
                "title": "Email дарегиңизди ырастаңыз",
                "greeting": "Саламатсызбы!",
                "message": "ArtLine'га катталганыңыз үчүн рахмат. Сиздин ырастоо кодуңуз:",
                "instruction": "Email дарегиңизди ырастоо үчүн бул кодду тиркемеге киргизиңиз.",
                "expires": "Код 30 мүнөткө жарактуу.",
                "footer": "Эгер сиз ArtLine'га катталбаса, бул катты этибарга албаңыз."
            },
            "en": {
                "subject": "Verify your email - ArtLine",
                "title": "Verify your email",
                "greeting": "Hello!",
                "message": "Thank you for signing up for ArtLine. Your verification code is:",
                "instruction": "Enter this code in the application to verify your email address.",
                "expires": "The code is valid for 30 minutes.",
                "footer": "If you did not sign up for ArtLine, please ignore this email."
            }
        }
        
        t = templates.get(language, templates["ru"])
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">ArtLine</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">{t['title']}</h2>
                            <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.5;">{t['greeting']}</p>
                            <p style="margin: 0 0 30px 0; color: #666; font-size: 16px; line-height: 1.5;">{t['message']}</p>
                            
                            <!-- Code Box -->
                            <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
                                <div style="font-size: 48px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">{code}</div>
                            </div>
                            
                            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; line-height: 1.5;">{t['instruction']}</p>
                            <p style="margin: 0 0 30px 0; color: #999; font-size: 13px; line-height: 1.5;"><em>{t['expires']}</em></p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; color: #999; font-size: 13px; line-height: 1.5;">{t['footer']}</p>
                            <p style="margin: 10px 0 0 0; color: #999; font-size: 13px;">© 2026 ArtLine. workbench.ink</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
        return t["subject"], html
    
    @staticmethod
    def get_reminder_email_template(days_left: int, language: str = "ru") -> tuple[str, str]:
        """
        Get localized reminder email template.
        
        Args:
            days_left: Days until account deletion (27 or 15)
        
        Returns:
            tuple: (subject, html_body)
        """
        templates = {
            "ru": {
                "subject": f"Подтвердите email - осталось {days_left} дней",
                "title": "Подтвердите ваш email",
                "greeting": "Здравствуйте!",
                "message": f"Ваш аккаунт в ArtLine еще не подтвержден. Через {days_left} дней аккаунт будет автоматически удален, если вы не подтвердите email.",
                "action": "Войдите в приложение и подтвердите ваш email, чтобы:✓ Пополнять баланс и покупать кредиты<br>✓ Получить полный доступ ко всем функциям<br>✓ Сохранить ваши данные и генерации",
                "footer": "Если вы не регистрировались в ArtLine, игнорируйте это письмо."
            },
            "kk": {
                "subject": f"Email растаңыз - {days_left} күн қалды",
                "title": "Email мекенжайыңызды растаңыз",
                "greeting": "Сәлеметсіз бе!",
                "message": f"ArtLine-дағы аккаунтыңыз әлі расталмаған. Email растамасаңыз, {days_left} күннен кейін аккаунт автоматты түрде жойылады.",
                "action": "Қолданбаға кіріп, email растаңыз:<br>✓ Балансты толтыру және несие сатып алу<br>✓ Барлық функцияларға толық қол жеткізу<br>✓ Деректеріңізді және генерацияларыңызды сақтау",
                "footer": "Егер сіз ArtLine-ға тіркелмесеңіз, бұл хатты елемеңіз."
            },
            "ky": {
                "subject": f"Email ырастаңыз - {days_left} күн калды",
                "title": "Email дарегиңизди ырастаңыз",
                "greeting": "Саламатсызбы!",
                "message": f"ArtLine'дагы аккаунтуңуз али ырасталган эмес. Email ырастабасаңыз, {days_left} күндөн кийин аккаунт автоматтык түрдө жок кылынат.",
                "action": "Тиркемеге кирип, email ырастаңыз:<br>✓ Балансты толтуруу жана кредит сатып алуу<br>✓ Бардык функцияларга толук жетүү<br>✓ Маалыматтарыңызды жана генерацияларды сактоо",
                "footer": "Эгер сиз ArtLine'га катталбаса, бул катты этибарга албаңыз."
            },
            "en": {
                "subject": f"Verify your email - {days_left} days left",
                "title": "Verify your email",
                "greeting": "Hello!",
                "message": f"Your ArtLine account is not yet verified. In {days_left} days, your account will be automatically deleted if you don't verify your email.",
                "action": "Log in to the app and verify your email to:<br>✓ Top up balance and purchase credits<br>✓ Get full access to all features<br>✓ Keep your data and generations",
                "footer": "If you did not sign up for ArtLine, please ignore this email."
            }
        }
        
        t = templates.get(language, templates["ru"])
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">⚠️ ArtLine</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">{t['title']}</h2>
                            <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.5;">{t['greeting']}</p>
                            <p style="margin: 0 0 30px 0; color: #666; font-size: 16px; line-height: 1.5;">{t['message']}</p>
                            
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 30px 0;">
                                <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">{t['action']}</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; color: #999; font-size: 13px; line-height: 1.5;">{t['footer']}</p>
                            <p style="margin: 10px 0 0 0; color: #999; font-size: 13px;">© 2026 ArtLine. workbench.ink</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
        return t["subject"], html


async def send_verification_email(email: str, code: str, language: str = "ru") -> bool:
    """Send email verification code"""
    subject, html_body = EmailService.get_verification_email_template(code, language)
    return await EmailService.send_email(email, subject, html_body)


async def send_reminder_email(email: str, days_left: int, language: str = "ru") -> bool:
    """Send reminder to verify email before account deletion"""
    subject, html_body = EmailService.get_reminder_email_template(days_left, language)
    return await EmailService.send_email(email, subject, html_body)
