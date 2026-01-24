"""
Views for Swagger UI OAuth2 redirect handling.
"""
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View


@method_decorator(csrf_exempt, name='dispatch')
class SwaggerOAuth2RedirectView(View):
    """
    View that serves the oauth2-redirect.html file for Swagger UI.
    This HTML file handles the OAuth2 callback and communicates with Swagger UI.
    """
    
    def get(self, request):
        """
        Serve the OAuth2 redirect HTML page for Swagger UI.
        This page extracts the authorization code from the URL and sends it to Swagger.
        """
        html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>Swagger OAuth2 Redirect</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
        }
        .container {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .success {
            color: #28a745;
        }
        .error {
            color: #dc3545;
        }
    </style>
</head>
<body>
    <div class="container">
        <p id="message">Processing authorization...</p>
    </div>
    <script>
        'use strict';
        function run() {
            var messageEl = document.getElementById('message');
            var oauth2;
            var sentState;
            var redirectUrl;
            var isValid, qp, arr;

            // Try to get oauth2 from window.opener (popup) or window.parent (iframe)
            if (window.opener && window.opener.swaggerUIRedirectOauth2) {
                oauth2 = window.opener.swaggerUIRedirectOauth2;
            } else if (window.parent && window.parent.swaggerUIRedirectOauth2) {
                oauth2 = window.parent.swaggerUIRedirectOauth2;
            } else if (window.opener) {
                // Try to access via postMessage
                try {
                    window.opener.postMessage({
                        type: 'swagger-ui-oauth2-redirect',
                        code: new URLSearchParams(window.location.search).get('code'),
                        state: new URLSearchParams(window.location.search).get('state'),
                        error: new URLSearchParams(window.location.search).get('error')
                    }, '*');
                    messageEl.textContent = 'Authorization code sent. You can close this window.';
                    messageEl.className = 'success';
                    setTimeout(function() { window.close(); }, 2000);
                    return;
                } catch (e) {
                    messageEl.textContent = 'Error: Unable to communicate with Swagger UI. Please copy the authorization code from the URL and paste it manually.';
                    messageEl.className = 'error';
                    return;
                }
            } else {
                // Fallback: show the code and provide a way to exchange it for a token
                qp = location.search.substring(1);
                var params = new URLSearchParams(qp);
                var code = params.get('code');
                var state = params.get('state');
                if (code) {
                    // Try to get client_id and client_secret from localStorage (if stored)
                    var clientId = localStorage.getItem('swagger_oauth2_client_id');
                    var clientSecret = localStorage.getItem('swagger_oauth2_client_secret');
                    
                    if (clientId && clientSecret) {
                        // Automatically exchange code for token
                        messageEl.innerHTML = '<p>Exchanging authorization code for access token...</p>';
                        exchangeCodeForToken(code, clientId, clientSecret, state);
                    } else {
                        // Show form to exchange code for token
                        messageEl.innerHTML = '<p class="success">Authorization successful!</p>' +
                            '<p>Authorization Code: <strong>' + code + '</strong></p>' +
                            '<div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; max-width: 500px; margin-left: auto; margin-right: auto;">' +
                            '<p><strong>Exchange code for access token:</strong></p>' +
                            '<form id="tokenForm" style="text-align: left;">' +
                            '<div style="margin-bottom: 10px;">' +
                            '<label>Client ID:</label><br>' +
                            '<input type="text" id="clientId" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">' +
                            '</div>' +
                            '<div style="margin-bottom: 10px;">' +
                            '<label>Client Secret:</label><br>' +
                            '<input type="password" id="clientSecret" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">' +
                            '</div>' +
                            '<button type="submit" style="width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">Get Access Token</button>' +
                            '</form>' +
                            '</div>';
                        
                        // Handle form submission
                        document.getElementById('tokenForm').addEventListener('submit', function(e) {
                            e.preventDefault();
                            var clientId = document.getElementById('clientId').value;
                            var clientSecret = document.getElementById('clientSecret').value;
                            if (clientId && clientSecret) {
                                messageEl.innerHTML = '<p>Exchanging authorization code for access token...</p>';
                                exchangeCodeForToken(code, clientId, clientSecret, state);
                            }
                        });
                    }
                } else {
                    var error = params.get('error');
                    var errorDesc = params.get('error_description');
                    messageEl.innerHTML = '<p class="error">Authorization failed</p><p>' + (error || 'Unknown error') + (errorDesc ? ': ' + errorDesc : '') + '</p>';
                }
                return;
            }

            sentState = oauth2.state;
            redirectUrl = oauth2.redirectUrl;

            if (/code|error|error_description/.test(window.location.hash)) {
                qp = window.location.hash.substring(1);
            } else {
                qp = location.search.substring(1);
            }

            arr = qp.split("&");
            arr.forEach(function (v, i, _arr) { _arr[i] = '"' + v + '"'; });
            qp = qp ? JSON.parse(
                '{"' + arr.join('","').replace(/=/g, '":"') + '"}',
                function (key, value) {
                    return key === "" ? value : decodeURIComponent(value);
                }
            ) : {};

            isValid = qp.state === sentState;

            if ((
              oauth2.auth.schema.get("flow") === "accessCode" ||
              oauth2.auth.schema.get("flow") === "authorizationCode" ||
              oauth2.auth.schema.get("flow") === "authorization_code"
            ) && !oauth2.auth.code) {
                if (!isValid) {
                    oauth2.errCb({
                        authId: oauth2.auth.name,
                        source: "auth",
                        level: "warning",
                        err: "Authorization may be unsafe, passed state was changed in server. The passed state wasn't returned from auth server."
                    });
                }

                if (qp.code) {
                    delete oauth2.state;
                    oauth2.auth.code = qp.code;
                    oauth2.callback({auth: oauth2.auth, redirectUrl: redirectUrl});
                    messageEl.textContent = 'Authorization successful! Closing window...';
                    messageEl.className = 'success';
                } else {
                    let oauthErrorMsg = '';
                    if (qp.error) {
                        oauthErrorMsg = qp.error;
                        if (qp.error_description) {
                            oauthErrorMsg += ": " + qp.error_description;
                        }
                    }
                    oauth2.errCb({
                        authId: oauth2.auth.name,
                        source: "auth",
                        level: "error",
                        err: oauthErrorMsg || "[Authorization failed]: no accessCode received from the server"
                    });
                    messageEl.textContent = 'Authorization failed: ' + (oauthErrorMsg || 'No authorization code received');
                    messageEl.className = 'error';
                }
            } else {
                oauth2.callback({auth: oauth2.auth, token: qp, isValid: isValid, redirectUrl: redirectUrl});
                messageEl.textContent = 'Authorization successful! Closing window...';
                messageEl.className = 'success';
            }
            
            // Try to close the window, but don't fail if it can't be closed
            try {
                window.close();
            } catch (e) {
                // Window might not be closable, that's okay
            }
        }

        // Function to exchange authorization code for access token
        function exchangeCodeForToken(code, clientId, clientSecret, state) {
            var formData = new URLSearchParams();
            formData.append('grant_type', 'authorization_code');
            formData.append('code', code);
            formData.append('redirect_uri', window.location.origin + '/swagger/oauth2-redirect.html');
            formData.append('client_id', clientId);
            formData.append('client_secret', clientSecret);
            
            fetch('/o/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                var messageEl = document.getElementById('message');
                if (data.access_token) {
                    messageEl.innerHTML = '<p class="success">Access token obtained!</p>' +
                        '<p>Access Token: <strong style="word-break: break-all;">' + data.access_token + '</strong></p>' +
                        '<div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px;">' +
                        '<p><strong>To use in Swagger:</strong></p>' +
                        '<p>1. Go back to Swagger UI</p>' +
                        '<p>2. Click "Authorize" button</p>' +
                        '<p>3. Select "Bearer" (not OAuth2)</p>' +
                        '<p>4. Paste the access token above</p>' +
                        '<p>5. Click "Authorize"</p>' +
                        '</div>' +
                        '<button onclick="copyToken()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Copy Access Token</button>';
                    window.accessToken = data.access_token;
                } else {
                    messageEl.innerHTML = '<p class="error">Failed to get access token</p><p>' + (data.error || 'Unknown error') + (data.error_description ? ': ' + data.error_description : '') + '</p>';
                }
            })
            .catch(function(error) {
                var messageEl = document.getElementById('message');
                messageEl.innerHTML = '<p class="error">Error exchanging code: ' + error.message + '</p>';
            });
        }
        
        function copyToken() {
            if (window.accessToken) {
                navigator.clipboard.writeText(window.accessToken).then(function() {
                    alert('Access token copied to clipboard!');
                });
            }
        }
        
        if (document.readyState === "complete") {
            run();
        } else {
            window.addEventListener("load", run);
        }
    </script>
</body>
</html>
        """
        return HttpResponse(html_content, content_type='text/html')
