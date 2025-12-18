(function() {
    'use strict';

    window.__app = window.__app || {};

    const CONFIG = {
        HEADER_HEIGHT: 72,
        ANIMATION_DURATION: 600,
        SCROLL_OFFSET: 120,
        DEBOUNCE_DELAY: 150,
        THROTTLE_DELAY: 100
    };

    function debounce(func, wait) {
        let timeout;
        return function executedFunction() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    class AOSManager {
        constructor() {
            if (window.__app.aosInit) return;
            window.__app.aosInit = true;
            this.init();
        }

        init() {
            if (typeof window.AOS === 'undefined') return;

            const avoidLayoutElements = document.querySelectorAll('[data-aos][data-avoid-layout="true"]');
            avoidLayoutElements.forEach(el => el.removeAttribute('data-aos'));

            window.AOS.init({
                once: false,
                duration: CONFIG.ANIMATION_DURATION,
                easing: 'ease-out',
                offset: CONFIG.SCROLL_OFFSET,
                mirror: false,
                disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
            });

            window.__app.refreshAOS = () => {
                try {
                    if (typeof window.AOS !== 'undefined') {
                        window.AOS.refresh();
                    }
                } catch(e) {}
            };
        }
    }

    class NavigationManager {
        constructor() {
            if (window.__app.navInit) return;
            window.__app.navInit = true;

            this.nav = document.querySelector('.c-nav#main-nav');
            this.toggle = document.querySelector('.c-nav__toggle');
            this.navList = document.querySelector('.c-nav__list');
            this.body = document.body;

            if (!this.nav || !this.toggle || !this.navList) return;

            this.bindEvents();
        }

        bindEvents() {
            this.toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMenu();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.nav.classList.contains('is-open')) {
                    this.closeMenu();
                    this.toggle.focus();
                }
            });

            document.addEventListener('click', (e) => {
                if (this.nav.classList.contains('is-open') && !this.nav.contains(e.target)) {
                    this.closeMenu();
                }
            });

            const navLinks = this.nav.querySelectorAll('.c-nav__link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => this.closeMenu());
            });

            window.addEventListener('resize', () => {
                if (window.innerWidth >= 1024 && this.nav.classList.contains('is-open')) {
                    this.closeMenu();
                }
            });
        }

        toggleMenu() {
            if (this.nav.classList.contains('is-open')) {
                this.closeMenu();
            } else {
                this.openMenu();
            }
        }

        openMenu() {
            this.nav.classList.add('is-open');
            this.toggle.setAttribute('aria-expanded', 'true');
            this.body.classList.add('u-no-scroll');
            this.trapFocus();
        }

        closeMenu() {
            this.nav.classList.remove('is-open');
            this.toggle.setAttribute('aria-expanded', 'false');
            this.body.classList.remove('u-no-scroll');
        }

        trapFocus() {
            const focusableElements = this.navList.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (firstElement) firstElement.focus();

            this.navList.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            });
        }
    }

    class SmoothScrollManager {
        constructor() {
            if (window.__app.anchorsInit) return;
            window.__app.anchorsInit = true;

            this.isHomepage = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');
            this.init();
        }

        init() {
            if (!this.isHomepage) {
                const sectionLinks = document.querySelectorAll('a[href^="#"]');
                sectionLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href !== '#' && href !== '#!') {
                        link.setAttribute('href', '/' + href);
                    }
                });
            }

            document.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (!link) return;

                const href = link.getAttribute('href');
                if (href && href.startsWith('#') && href !== '#' && href !== '#!') {
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId);

                    if (targetElement) {
                        e.preventDefault();
                        const header = document.querySelector('.l-header');
                        const offset = header ? header.offsetHeight : CONFIG.HEADER_HEIGHT;
                        const targetPosition = targetElement.offsetTop - offset;

                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        }
    }

    class ActiveMenuManager {
        constructor() {
            if (window.__app.activeMenuInit) return;
            window.__app.activeMenuInit = true;
            this.updateActiveState();
        }

        updateActiveState() {
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll('.c-nav__link');

            navLinks.forEach(link => {
                link.removeAttribute('aria-current');
                link.classList.remove('active');

                const href = link.getAttribute('href');

                if ((currentPath === '/' || currentPath.endsWith('/index.html')) &&
                    (href === '/' || href === './index.html' || href === 'index.html')) {
                    link.setAttribute('aria-current', 'page');
                    link.classList.add('active');
                } else if (href && currentPath.endsWith(href)) {
                    link.setAttribute('aria-current', 'page');
                    link.classList.add('active');
                }
            });
        }
    }

    class ImageManager {
        constructor() {
            if (window.__app.imagesInit) return;
            window.__app.imagesInit = true;
            this.init();
        }

        init() {
            const images = document.querySelectorAll('img');

            images.forEach(img => {
                if (!img.hasAttribute('loading') &&
                    !img.classList.contains('c-logo__img') &&
                    !img.hasAttribute('data-critical')) {
                    img.setAttribute('loading', 'lazy');
                }

                if (!img.classList.contains('img-fluid')) {
                    img.classList.add('img-fluid');
                }

                img.addEventListener('error', function() {
                    const fallbackSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" fill="#e9ecef"><rect width="100%" height="100%" fill="#e9ecef"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#6c757d" text-anchor="middle" dy=".3em">Image not available</text></svg>';
                    const dataUri = 'data:image/svg+xml;base64,' + btoa(fallbackSvg);

                    this.src = dataUri;
                    this.style.objectFit = 'contain';

                    if (this.classList.contains('c-logo__img')) {
                        this.style.maxHeight = '40px';
                    }
                });
            });
        }
    }

    class FormValidator {
        constructor() {
            if (window.__app.formsInit) return;
            window.__app.formsInit = true;

            this.patterns = {
                name: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
                email: /^[^s@]+@[^s@]+.[^s@]+$/,
                phone: /^[+-ds()]{10,20}$/,
                message: /.{10,}/
            };

            this.errorMessages = {
                name: 'Имя должно содержать от 2 до 50 символов и может включать буквы, пробелы, дефисы и апострофы',
                email: 'Пожалуйста, введите корректный email адрес',
                phone: 'Номер телефона должен содержать от 10 до 20 цифр',
                message: 'Сообщение должно содержать минимум 10 символов',
                privacy: 'Необходимо согласие с политикой конфиденциальности',
                required: 'Это поле обязательно для заполнения'
            };

            this.init();
        }

        init() {
            this.createNotificationContainer();
            this.bindForms();
        }

        createNotificationContainer() {
            const container = document.createElement('div');
            container.className = 'position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);

            window.__app.notify = (message, type = 'info') => {
                const toast = document.createElement('div');
                toast.className = `toast align-items-center text-white bg-${type} border-0`;
                toast.setAttribute('role', 'alert');
                toast.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;

                container.appendChild(toast);

                if (typeof bootstrap !== 'undefined') {
                    const bsToast = new bootstrap.Toast(toast);
                    bsToast.show();
                }

                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 5000);
            };
        }

        bindForms() {
            const contactForm = document.querySelector('.c-form');
            if (!contactForm) return;

            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (this.validateForm(contactForm)) {
                    this.submitForm(contactForm);
                }
            });

            const inputs = contactForm.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearError(input));
            });
        }

        validateForm(form) {
            let isValid = true;
            const fields = form.querySelectorAll('input, textarea, select');

            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                window.__app.notify('Пожалуйста, исправьте ошибки в форме', 'warning');
            }

            return isValid;
        }

        validateField(field) {
            const fieldId = field.id;
            const fieldValue = field.value.trim();
            const fieldType = field.type;
            let errorMessage = '';

            this.clearError(field);

            if (field.hasAttribute('required') && !fieldValue) {
                errorMessage = this.errorMessages.required;
            } else if (fieldValue) {
                if (fieldId.includes('name')) {
                    if (!this.patterns.name.test(fieldValue)) {
                        errorMessage = this.errorMessages.name;
                    }
                } else if (fieldId.includes('email') || fieldType === 'email') {
                    if (!this.patterns.email.test(fieldValue)) {
                        errorMessage = this.errorMessages.email;
                    }
                } else if (fieldId.includes('phone') || fieldType === 'tel') {
                    if (!this.patterns.phone.test(fieldValue)) {
                        errorMessage = this.errorMessages.phone;
                    }
                } else if (fieldId.includes('message')) {
                    if (!this.patterns.message.test(fieldValue)) {
                        errorMessage = this.errorMessages.message;
                    }
                }
            }

            if (fieldType === 'checkbox' && field.hasAttribute('required') && !field.checked) {
                errorMessage = this.errorMessages.privacy;
            }

            if (errorMessage) {
                this.showError(field, errorMessage);
                return false;
            }

            return true;
        }

        showError(field, message) {
            field.classList.add('is-invalid');

            const errorId = field.getAttribute('aria-describedby');
            let errorElement = errorId ? document.getElementById(errorId) : null;

            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'invalid-feedback';
                errorElement.style.display = 'block';
                field.parentNode.appendChild(errorElement);
            }

            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }

        clearError(field) {
            field.classList.remove('is-invalid');

            const errorId = field.getAttribute('aria-describedby');
            const errorElement = errorId ? document.getElementById(errorId) : field.parentNode.querySelector('.invalid-feedback');

            if (errorElement) {
                errorElement.style.display = 'none';
                errorElement.textContent = '';
            }
        }

        submitForm(form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Отправка...';

            const formData = new FormData(form);
            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }

            setTimeout(() => {
                window.__app.notify('Сообщение успешно отправлено!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'thank_you.html';
                }, 1500);
            }, 1000);
        }
    }

    class ScrollAnimationManager {
        constructor() {
            if (window.__app.scrollAnimInit) return;
            window.__app.scrollAnimInit = true;
            this.init();
        }

        init() {
            this.observeElements();
            this.initCounters();
        }

        observeElements() {
            const options = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                    }
                });
            }, options);

            const animatedElements = document.querySelectorAll('.card, .c-card, img, .hero-content, .hero-image');
            animatedElements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                observer.observe(el);
            });

            const style = document.createElement('style');
            style.textContent = `
                .is-visible {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }
            `;
            document.head.appendChild(style);
        }

        initCounters() {
            const counters = document.querySelectorAll('.stat-number');
            if (!counters.length) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                        this.animateCounter(entry.target);
                        entry.target.classList.add('counted');
                    }
                });
            }, { threshold: 0.5 });

            counters.forEach(counter => observer.observe(counter));
        }

        animateCounter(element) {
            const target = parseInt(element.textContent.replace(/D/g, ''));
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    element.textContent = target.toLocaleString();
                    clearInterval(timer);
                } else {
                    element.textContent = Math.floor(current).toLocaleString();
                }
            }, 16);
        }
    }

    class MicroInteractionManager {
        constructor() {
            if (window.__app.microInteractionsInit) return;
            window.__app.microInteractionsInit = true;
            this.init();
        }

        init() {
            this.addButtonEffects();
            this.addCardEffects();
            this.addRippleEffect();
        }

        addButtonEffects() {
            const buttons = document.querySelectorAll('.c-button, .btn');
            buttons.forEach(button => {
                button.addEventListener('mouseenter', (e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                });

                button.addEventListener('mouseleave', (e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                });
            });
        }

        addCardEffects() {
            const cards = document.querySelectorAll('.card, .c-card, .brand-item');
            cards.forEach(card => {
                card.addEventListener('mouseenter', (e) => {
                    e.currentTarget.style.transition = 'transform 0.3s ease-out';
                });
            });
        }

        addRippleEffect() {
            const buttons = document.querySelectorAll('.c-button--primary, .btn-primary');
            buttons.forEach(button => {
                button.addEventListener('click', function(e) {
                    const ripple = document.createElement('span');
                    const rect = this.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;

                    ripple.style.width = ripple.style.height = size + 'px';
                    ripple.style.left = x + 'px';
                    ripple.style.top = y + 'px';
                    ripple.classList.add('ripple');

                    this.appendChild(ripple);

                    setTimeout(() => ripple.remove(), 600);
                });
            });

            const style = document.createElement('style');
            style.textContent = `
                .ripple {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    transform: scale(0);
                    animation: ripple-animation 0.6s ease-out;
                    pointer-events: none;
                }
                @keyframes ripple-animation {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    class AccordionManager {
        constructor() {
            if (window.__app.accordionInit) return;
            window.__app.accordionInit = true;
            this.init();
        }

        init() {
            const accordionButtons = document.querySelectorAll('.accordion-button');
            accordionButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const target = button.getAttribute('data-bs-target');
                    const collapse = document.querySelector(target);
                    
                    if (collapse) {
                        const isExpanded = button.getAttribute('aria-expanded') === 'true';
                        button.setAttribute('aria-expanded', !isExpanded);
                        button.classList.toggle('collapsed');
                        collapse.classList.toggle('show');
                    }
                });
            });
        }
    }

    class ScrollToTopManager {
        constructor() {
            if (window.__app.scrollToTopInit) return;
            window.__app.scrollToTopInit = true;
            this.init();
        }

        init() {
            const button = document.createElement('button');
            button.className = 'scroll-to-top';
            button.innerHTML = '↑';
            button.setAttribute('aria-label', 'Scroll to top');
            document.body.appendChild(button);

            const style = document.createElement('style');
            style.textContent = `
                .scroll-to-top {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    width: 50px;
                    height: 50px;
                    background: var(--color-primary);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    font-size: 24px;
                    cursor: pointer;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    z-index: 1000;
                    box-shadow: var(--shadow-md);
                }
                .scroll-to-top.visible {
                    opacity: 1;
                    visibility: visible;
                }
                .scroll-to-top:hover {
                    transform: translateY(-5px);
                    box-shadow: var(--shadow-lg);
                }
            `;
            document.head.appendChild(style);

            window.addEventListener('scroll', throttle(() => {
                if (window.pageYOffset > 300) {
                    button.classList.add('visible');
                } else {
                    button.classList.remove('visible');
                }
            }, CONFIG.THROTTLE_DELAY));

            button.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }

    class AppInitializer {
        constructor() {
            this.init();
        }

        init() {
            new AOSManager();
            new NavigationManager();
            new SmoothScrollManager();
            new ActiveMenuManager();
            new ImageManager();
            new FormValidator();
            new ScrollAnimationManager();
            new MicroInteractionManager();
            new AccordionManager();
            new ScrollToTopManager();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new AppInitializer());
    } else {
        new AppInitializer();
    }

})();
