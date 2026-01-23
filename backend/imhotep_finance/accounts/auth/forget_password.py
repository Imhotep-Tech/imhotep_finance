from django.contrib import messages
from django.contrib.auth.views import PasswordResetView, PasswordResetDoneView, PasswordResetConfirmView, PasswordResetCompleteView
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.template.loader import render_to_string
from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm
from imhotep_finance.settings import SITE_DOMAIN, frontend_url

class CustomPasswordResetView(PasswordResetView):
    template_name = 'password_reset.html'
    form_class = PasswordResetForm
    email_template_name = 'password_reset_email.html'
    html_email_template_name = 'password_reset_email.html'
    
    def form_invalid(self, form):
        for field, errors in form.errors.items():
            for error in errors:
                messages.error(self.request, error)
        return super().form_invalid(form)

    def get_extra_email_context(self):
        context = {}
        context['domain'] = SITE_DOMAIN.replace('http://', '').replace('https://', '')
        context['site_name'] = 'imhotep_finance'
        context['protocol'] = 'https' if 'https://' in SITE_DOMAIN else 'http'
        return context

    def form_valid(self, form):
        """
        Override form_valid to handle email sending ourselves rather than 
        letting Django's built-in functionality handle it.
        """
        # Get user email
        email = form.cleaned_data["email"]
        # Get associated users
        active_users = form.get_users(email)
        
        for user in active_users:
            # Generate token and context
            context = {
                'email': email,
                'domain': SITE_DOMAIN.replace('http://', '').replace('https://', ''),
                'site_name': 'imhotep finance',
                'protocol': 'https' if 'https://' in SITE_DOMAIN else 'http',
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'user': user,
                'token': self.token_generator.make_token(user),
                'frontend_url': frontend_url,
            }
            
            # Render email
            subject = "Reset your imhotep finance password"
            email_message = render_to_string(self.email_template_name, context)
            html_email = render_to_string(self.html_email_template_name, context)
            
            # Send email
            send_mail(
                subject,
                email_message,
                self.from_email or 'imhoteptech1@gmail.com',
                [user.email],
                html_message=html_email,
            )
            
        # Return success response
        return super().form_valid(form)
    
class CustomPasswordResetDoneView(PasswordResetDoneView):
    template_name = 'password_reset_done.html'

class CustomPasswordResetConfirmView(PasswordResetConfirmView):
    template_name = 'password_reset_confirm.html'
    form_class = SetPasswordForm

    def form_invalid(self, form):
        for field, errors in form.errors.items():
            for error in errors:
                messages.error(self.request, error)
        return super().form_invalid(form)

class CustomPasswordResetCompleteView(PasswordResetCompleteView):
    template_name = 'password_reset_complete.html'

