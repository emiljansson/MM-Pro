"""
Email service using Resend for transactional emails
"""
import os
import asyncio
import logging
from typing import Optional
from datetime import datetime, timezone

import resend

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via Resend"""
    
    def __init__(self, db=None):
        self.db = db
        self._api_key: Optional[str] = None
        self._sender_email: Optional[str] = None
        self._sender_name: Optional[str] = None
        self._initialized = False
    
    async def initialize(self):
        """Load settings from database or environment"""
        if self._initialized:
            return
        
        # Try to load from database first
        if self.db:
            settings = await self.db.settings.find_one({"key": "email_settings"})
            if settings and settings.get("api_key"):
                self._api_key = settings.get("api_key")
                self._sender_email = settings.get("sender_email", "onboarding@resend.dev")
                self._sender_name = settings.get("sender_name", "MathMaster Pro")
                self._initialized = True
                resend.api_key = self._api_key
                logger.info("Email service initialized from database settings")
                return
        
        # Fall back to environment variables
        self._api_key = os.environ.get("RESEND_API_KEY")
        self._sender_email = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
        self._sender_name = os.environ.get("SENDER_NAME", "MathMaster Pro")
        
        if self._api_key:
            resend.api_key = self._api_key
            self._initialized = True
            logger.info("Email service initialized from environment variables")
        else:
            logger.warning("Email service not configured - no API key found")
    
    async def reload_settings(self):
        """Reload settings from database"""
        self._initialized = False
        await self.initialize()
    
    def is_configured(self) -> bool:
        """Check if email service is properly configured"""
        return bool(self._api_key)
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> dict:
        """
        Send an email using Resend
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML body of the email
            text_content: Plain text version (optional)
        
        Returns:
            dict with status and email_id
        """
        await self.initialize()
        
        if not self.is_configured():
            logger.error("Email service not configured")
            return {"status": "error", "message": "Email service not configured"}
        
        from_address = f"{self._sender_name} <{self._sender_email}>"
        
        params = {
            "from": from_address,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        
        if text_content:
            params["text"] = text_content
        
        try:
            # Run sync SDK in thread to keep FastAPI non-blocking
            email = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"Email sent successfully to {to_email}, id: {email.get('id')}")
            return {
                "status": "success",
                "message": f"Email sent to {to_email}",
                "email_id": email.get("id")
            }
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    async def send_password_reset_email(
        self,
        to_email: str,
        reset_token: str,
        user_name: str,
        app_url: str = "https://mathematicsmaster.app"
    ) -> dict:
        """Send password reset email"""
        
        reset_link = f"{app_url}/reset-password?token={reset_token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Återställ lösenord</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px;">Hej <strong>{user_name}</strong>!</p>
                
                <p style="font-size: 16px;">Vi har mottagit en begäran om att återställa lösenordet för ditt MathMaster Pro-konto.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                        Återställ lösenord
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666;">Denna länk är giltig i 1 timme.</p>
                
                <p style="font-size: 14px; color: #666;">Om du inte begärde denna återställning kan du ignorera detta meddelande.</p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                    © 2024 MathMaster Pro<br>
                    Detta är ett automatiskt meddelande.
                </p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Hej {user_name}!
        
        Vi har mottagit en begäran om att återställa lösenordet för ditt MathMaster Pro-konto.
        
        Klicka på följande länk för att återställa ditt lösenord:
        {reset_link}
        
        Denna länk är giltig i 1 timme.
        
        Om du inte begärde denna återställning kan du ignorera detta meddelande.
        
        © 2024 MathMaster Pro
        """
        
        return await self.send_email(
            to_email=to_email,
            subject="Återställ ditt lösenord - MathMaster Pro",
            html_content=html_content,
            text_content=text_content
        )
    
    async def send_welcome_email(
        self,
        to_email: str,
        user_name: str,
        app_url: str = "https://mathematicsmaster.app"
    ) -> dict:
        """Send welcome email to new users"""
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Välkommen till MathMaster Pro!</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px;">Hej <strong>{user_name}</strong>!</p>
                
                <p style="font-size: 16px;">Tack för att du registrerade dig på MathMaster Pro - din nya favorit för att träna matematik!</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #667eea;">🚀 Kom igång:</h3>
                    <ul style="padding-left: 20px;">
                        <li>Välj en kategori (Addition, Subtraktion, Bråk, m.m.)</li>
                        <li>Välj svårighetsgrad</li>
                        <li>Träna och se dina framsteg!</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{app_url}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                        Börja träna nu
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                    © 2024 MathMaster Pro<br>
                    Lycka till med matteträningen!
                </p>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=to_email,
            subject="Välkommen till MathMaster Pro! 🎉",
            html_content=html_content
        )
    
    async def send_test_email(self, to_email: str) -> dict:
        """Send a test email to verify configuration"""
        
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 10px;">
                <h1>✅ Testmail fungerar!</h1>
            </div>
            <div style="padding: 20px; text-align: center;">
                <p>Detta är ett testmeddelande från MathMaster Pro.</p>
                <p>E-postkonfigurationen är korrekt!</p>
                <p style="color: #666; font-size: 12px;">Skickat: """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """</p>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=to_email,
            subject="[TEST] MathMaster Pro - E-postkonfiguration fungerar!",
            html_content=html_content
        )


# Global email service instance
email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """Get the global email service instance"""
    global email_service
    if email_service is None:
        email_service = EmailService()
    return email_service


def init_email_service(db) -> EmailService:
    """Initialize email service with database connection"""
    global email_service
    email_service = EmailService(db)
    return email_service
