import stripe
from app.core.config import settings

# This can be swapped for SMPK or other providers later.
# For now, it implements the basic Stripe Checkout Session creation as requested.

if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY

def create_checkout_session(user_email: str, credits: int, amount_usd: int, success_url: str, cancel_url: str):
    """
    Creates a checkout session for adding credits.
    Input amount_usd should be in cents if using Stripe, or just a known price ID.
    For MVP fixed packages, we might map credits -> price_id, or construct ad-hoc.
    """
    
    # If keys are missing, return a mock URL for testing flow without Stripe
    if not settings.STRIPE_SECRET_KEY or "placeholder" in settings.STRIPE_SECRET_KEY:
        # Mock flow: straight to success
        return f"{success_url}&mock_payment=true&credits={credits}"

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            customer_email=user_email,
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'{credits} Credits',
                    },
                    'unit_amount': amount_usd * 100, # dollars to cents
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url + "&session_id={CHECKOUT_SESSION_ID}",
            cancel_url=cancel_url,
            metadata={
                "credits": str(credits),
                "type": "credit_topup"
            }
        )
        return session.url
    except Exception as e:
        print(f"Stripe Error: {e}")
        return None
