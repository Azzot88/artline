from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, RedisDsn, computed_field
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

    PROJECT_NAME: str = "ArtLine"
    SECRET_KEY: str = "changethis"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_SERVER: str
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return str(PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        ))
    
    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI_SYNC(self) -> str:
        """Sync database URI for Celery tasks (uses psycopg2 instead of asyncpg)"""
        return str(PostgresDsn.build(
            scheme="postgresql+psycopg2",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        ))


    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI_SYNC(self) -> str:
        # Needed for Celery or sync operations if any
        return str(PostgresDsn.build(
            scheme="postgresql",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        ))

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Stripe / Billing (SMPK placeholder)
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None

    # Webhooks
    WEBHOOK_HOST: str = "https://workbench.ink"

    # AWS S3 Storage
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_BUCKET_NAME: Optional[str] = None

    # Email / SMTP (mailU configuration)
    SMTP_HOST: str = "mail.dealvault.club"
    SMTP_PORT: int = 465
    SMTP_USER: Optional[str] = None  # admin@dealvault.club
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: str = "noreply@workbench.ink"
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = True  # Port 465 uses SSL

    # Email Verification Settings
    EMAIL_VERIFICATION_CODE_EXPIRE_MINUTES: int = 30
    EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: int = 60
    ACCOUNT_DELETION_DAYS: int = 30



settings = Settings()
