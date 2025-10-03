/**
 * MLabs WordPress Tracking Script v1.0
 * 
 * This script provides comprehensive tracking functionality for MLabs WordPress sites.
 * It captures campaign parameters from URLs, stores them in cookies, and includes them
 * in button clicks and form submissions.
 * 
 * Usage: Include this script in your WordPress site and call mlabsTracker.init()
 */

(function() {
    'use strict';

    // Main tracking object
    const mlabsTracker = {
        // Configuration
        config: {
            cookiePrefix: 'mlabs_',
            cookieExpireDays: 30,
            apiEndpoints: {
                production: 'https://core-api.mlabs.io/v1/accounts',
                staging: 'https://homolog-core-api.mlabs.com.br/v1/accounts/'
            },
            recaptchaSiteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Test key - replace with actual
            trackingParams: [
                'utm_source',
                'utm_medium', 
                'utm_campaign',
                'gclid',
                'coupon',
                '_ga',
                '_gl'
            ]
        },

        /**
         * Initialize the tracking system
         */
        init: function() {
            this.captureUrlParameters();
            this.setupButtonTracking();
            this.setupFormTracking();
            this.loadRecaptcha();
            console.log('MLabs Tracker initialized successfully');
        },

        /**
         * Capture parameters from current URL and store in cookies
         */
        captureUrlParameters: function() {
            const urlParams = new URLSearchParams(window.location.search);
            const currentPath = window.location.pathname;
            
            // Always update origin_page with current page
            this.setCookie('origin_page', currentPath);
            
            // Capture and store tracking parameters
            this.config.trackingParams.forEach(param => {
                const value = urlParams.get(param);
                if (value) {
                    this.setCookie(param, value);
                    console.log(`Captured ${param}: ${value}`);
                }
            });

            // Capture GA parameters from existing cookies or generate new ones
            this.captureGoogleAnalyticsParams();
        },

        /**
         * Capture Google Analytics parameters
         */
        captureGoogleAnalyticsParams: function() {
            // Try to get _ga from existing GA cookie
            const gaCookie = this.getCookieByName('_ga');
            if (gaCookie && !this.getCookie('_ga')) {
                this.setCookie('_ga', gaCookie);
            }

            // Try to get _gl from URL or generate
            const urlParams = new URLSearchParams(window.location.search);
            const glParam = urlParams.get('_gl');
            if (glParam) {
                this.setCookie('_gl', glParam);
            } else if (!this.getCookie('_gl') && this.getCookie('gclid')) {
                // Generate _gl parameter if we have gclid but no _gl
                const glValue = this.generateGlParam();
                this.setCookie('_gl', glValue);
            }
        },

        /**
         * Generate _gl parameter for Google Analytics
         */
        generateGlParam: function() {
            const gclid = this.getCookie('gclid');
            if (!gclid) return null;
            
            // Simple _gl parameter generation (in real implementation, this would be more complex)
            const timestamp = Math.floor(Date.now() / 1000);
            return `1*${Math.random().toString(36).substr(2, 9)}*_gcl_aw*${btoa(gclid).replace(/=/g, '')}`;
        },

        /**
         * Setup tracking for buttons (Teste Grátis and Cadastro)
         */
        setupButtonTracking: function() {
            // Track all links that might be "Teste Grátis" or "Cadastro" buttons
            const buttons = document.querySelectorAll('a[href*="accounts.mlabs.io"], a[href*="start"], .btn-teste-gratis, .btn-cadastro, [data-mlabs-track]');
            
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    this.handleButtonClick(e, button);
                });
            });

            // Also track buttons that might be added dynamically
            document.addEventListener('click', (e) => {
                const target = e.target.closest('a, button');
                if (target && this.isTrackableButton(target)) {
                    this.handleButtonClick(e, target);
                }
            });
        },

        /**
         * Check if a button should be tracked
         */
        isTrackableButton: function(element) {
            const href = element.getAttribute('href') || '';
            const className = element.className || '';
            const text = element.textContent || '';
            
            return (
                href.includes('accounts.mlabs.io') ||
                href.includes('start') ||
                className.includes('teste-gratis') ||
                className.includes('cadastro') ||
                text.toLowerCase().includes('teste grátis') ||
                text.toLowerCase().includes('cadastro') ||
                element.hasAttribute('data-mlabs-track')
            );
        },

        /**
         * Handle button click and append tracking parameters
         */
        handleButtonClick: function(e, button) {
            const href = button.getAttribute('href');
            if (!href || href.startsWith('javascript:') || href.startsWith('#')) return;

            e.preventDefault();
            
            const trackingParams = this.getAllTrackingParams();
            const newUrl = this.appendParamsToUrl(href, trackingParams);
            
            console.log('Button clicked, redirecting to:', newUrl);
            
            // Small delay to ensure tracking is captured
            setTimeout(() => {
                window.location.href = newUrl;
            }, 100);
        },

        /**
         * Setup form tracking
         */
        setupFormTracking: function() {
            // Look for registration forms
            const forms = document.querySelectorAll('form[data-mlabs-form], .mlabs-signup-form, form[action*="accounts"]');
            
            forms.forEach(form => {
                form.addEventListener('submit', (e) => {
                    this.handleFormSubmit(e, form);
                });
            });

            // Also handle forms that might be added later
            document.addEventListener('submit', (e) => {
                if (this.isTrackableForm(e.target)) {
                    this.handleFormSubmit(e, e.target);
                }
            });
        },

        /**
         * Check if a form should be tracked
         */
        isTrackableForm: function(form) {
            return (
                form.hasAttribute('data-mlabs-form') ||
                form.classList.contains('mlabs-signup-form') ||
                form.querySelector('input[name="email"]') !== null ||
                (form.getAttribute('action') || '').includes('accounts')
            );
        },

        /**
         * Handle form submission
         */
        handleFormSubmit: function(e, form) {
            e.preventDefault();
            
            const formData = new FormData(form);
            
            // Show loading state
            this.showLoading(form);
            
            // Get reCAPTCHA token first, then build payload
            this.getRecaptchaToken()
                .then(captchaToken => {
                    const data = this.buildFormPayload(formData, captchaToken);
                    
                    // Validate required fields
                    const validation = this.validateFormData(data);
                    if (!validation.valid) {
                        this.showError(validation.message);
                        this.hideLoading(form);
                        return;
                    }

                    // Submit to API
                    return this.submitToApi(data);
                })
                .then(response => {
                    if (response && response.redirect_url) {
                        window.location.href = response.redirect_url;
                    } else {
                        this.showSuccess('Cadastro realizado com sucesso!');
                    }
                })
                .catch(error => {
                    this.showError('Erro ao realizar cadastro. Tente novamente.');
                    console.error('Form submission error:', error);
                })
                .finally(() => {
                    this.hideLoading(form);
                });
        },

        /**
         * Build payload for form submission
         */
        buildFormPayload: function(formData, captchaToken) {
            const trackingParams = this.getAllTrackingParams();
            
            // Handle name field - could be single name field or firstName + lastName
            let fullName = formData.get('name') || '';
            if (!fullName) {
                const firstName = formData.get('firstName') || '';
                const lastName = formData.get('lastName') || '';
                fullName = (firstName + ' ' + lastName).trim();
            }
            
            return {
                name: fullName,
                email: formData.get('email'),
                password: formData.get('password'),
                language: 'pt-BR',
                user_agent: navigator.userAgent,
                captcha: captchaToken,
                gclid: trackingParams.gclid || '',
                utm_source: trackingParams.utm_source || '',
                utm_medium: trackingParams.utm_medium || '',
                utm_campaign: trackingParams.utm_campaign || '',
                origin_page: trackingParams.origin_page || '/',
                origin_click: 'form_site'
            };
        },

        /**
         * Validate form data
         */
        validateFormData: function(data) {
            if (!data.name || data.name.trim().length < 2) {
                return { valid: false, message: 'Nome é obrigatório (mínimo 2 caracteres)' };
            }
            
            if (!data.email || !this.isValidEmail(data.email)) {
                return { valid: false, message: 'Email válido é obrigatório' };
            }
            
            if (!data.password || !this.isValidPassword(data.password)) {
                return { valid: false, message: 'Senha deve ter pelo menos 6 caracteres, incluindo 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial' };
            }
            
            if (!data.captcha) {
                return { valid: false, message: 'Falha na validação do captcha' };
            }
            
            return { valid: true };
        },

        /**
         * Validate email format
         */
        isValidEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        /**
         * Validate password strength
         */
        isValidPassword: function(password) {
            const minLength = 6;
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumbers = /\d/.test(password);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
            
            return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
        },

        /**
         * Submit data to MLabs API
         */
        submitToApi: function(data) {
            const endpoint = this.config.apiEndpoints.production;
            
            return fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            });
        },

        /**
         * Get all tracking parameters from cookies
         */
        getAllTrackingParams: function() {
            const params = {};
            
            // Get origin_page (current page)
            params.origin_page = window.location.pathname;
            
            // Get all stored tracking parameters
            this.config.trackingParams.forEach(param => {
                const value = this.getCookie(param);
                if (value) {
                    params[param] = value;
                }
            });
            
            return params;
        },

        /**
         * Append parameters to URL
         */
        appendParamsToUrl: function(url, params) {
            const urlObj = new URL(url, window.location.origin);
            
            Object.keys(params).forEach(key => {
                if (params[key]) {
                    urlObj.searchParams.set(key, params[key]);
                }
            });
            
            return urlObj.toString();
        },

        /**
         * Set cookie with expiration
         */
        setCookie: function(name, value, days = null) {
            days = days || this.config.cookieExpireDays;
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            
            document.cookie = `${this.config.cookiePrefix}${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
        },

        /**
         * Get cookie value
         */
        getCookie: function(name) {
            const fullName = this.config.cookiePrefix + name;
            return this.getCookieByName(fullName);
        },

        /**
         * Get cookie by exact name
         */
        getCookieByName: function(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) {
                    return decodeURIComponent(c.substring(nameEQ.length, c.length));
                }
            }
            return null;
        },

        /**
         * Load reCAPTCHA v3
         */
        loadRecaptcha: function() {
            if (window.grecaptcha) return;
            
            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=${this.config.recaptchaSiteKey}`;
            document.head.appendChild(script);
        },

        /**
         * Get reCAPTCHA token
         */
        getRecaptchaToken: function() {
            if (window.grecaptcha && window.grecaptcha.ready) {
                return new Promise((resolve) => {
                    window.grecaptcha.ready(() => {
                        window.grecaptcha.execute(this.config.recaptchaSiteKey, { action: 'submit' })
                            .then(token => resolve(token));
                    });
                });
            } else {
                // Fallback for testing - return a promise
                return Promise.resolve('test_token_' + Date.now());
            }
        },

        /**
         * Show loading state
         */
        showLoading: function(form) {
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando...';
            }
        },

        /**
         * Hide loading state
         */
        hideLoading: function(form) {
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Cadastrar';
            }
        },

        /**
         * Show error message
         */
        showError: function(message) {
            this.showMessage(message, 'error');
        },

        /**
         * Show success message
         */
        showSuccess: function(message) {
            this.showMessage(message, 'success');
        },

        /**
         * Show message to user
         */
        showMessage: function(message, type) {
            // Create or update message element
            let messageEl = document.getElementById('mlabs-message');
            if (!messageEl) {
                messageEl = document.createElement('div');
                messageEl.id = 'mlabs-message';
                messageEl.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 5px;
                    color: white;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    z-index: 9999;
                    max-width: 300px;
                `;
                document.body.appendChild(messageEl);
            }
            
            messageEl.textContent = message;
            messageEl.style.backgroundColor = type === 'error' ? '#e74c3c' : '#27ae60';
            messageEl.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        },

        /**
         * Debug function to show current tracking data
         */
        debug: function() {
            const params = this.getAllTrackingParams();
            console.log('Current tracking parameters:', params);
            return params;
        }
    };

    // Make mlabsTracker available globally
    window.mlabsTracker = mlabsTracker;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => mlabsTracker.init());
    } else {
        mlabsTracker.init();
    }

})();