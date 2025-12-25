/* ========================================
   CLEANPRO - RESPONSIVE HELPERS
   JavaScript для адаптивных функций
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {

    /* ==========================================
       1. МОБИЛЬНОЕ МЕНЮ (БУРГЕР-МЕНЮ)
       ========================================== */

    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('nav ul');
    const navLinks = document.querySelectorAll('nav ul li a');

    // Создание структуры бургер-меню если она не существует
    if (mobileMenuBtn && !mobileMenuBtn.querySelector('span')) {
        mobileMenuBtn.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
    }

    // Переключение мобильного меню
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('show');

            // Блокировка прокрутки при открытом меню
            if (navMenu.classList.contains('show')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Закрытие меню при клике на ссылку
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuBtn.classList.remove('active');
                navMenu.classList.remove('show');
                document.body.style.overflow = '';
            });
        });

        // Закрытие меню при клике вне его
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-center') && navMenu.classList.contains('show')) {
                mobileMenuBtn.classList.remove('active');
                navMenu.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    }

    /* ==========================================
       2. ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА
       ========================================== */

    const langBtn = document.getElementById('langBtn') || document.getElementById('adminLangBtn');
    const langOptions = document.getElementById('langOptions') || document.getElementById('adminLangOptions');

    if (langBtn && langOptions) {
        // Переключение выпадающего списка
        langBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            langOptions.classList.toggle('show');
        });

        // Закрытие при клике вне
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.lang-dropdown')) {
                langOptions.classList.remove('show');
            }
        });

        // Выбор языка
        const langOptionBtns = langOptions.querySelectorAll('.lang-option');
        langOptionBtns.forEach(option => {
            option.addEventListener('click', function() {
                // Удаление активного класса со всех опций
                langOptionBtns.forEach(opt => opt.classList.remove('active'));
                // Добавление активного класса к выбранной опции
                this.classList.add('active');

                // Обновление текста кнопки
                const langText = this.textContent.trim();
                const langTextSpan = langBtn.querySelector('#langText') || langBtn.querySelector('#adminLangText');
                if (langTextSpan) {
                    const shortLang = this.getAttribute('data-lang') || 'UZ';
                    langTextSpan.textContent = shortLang.replace('_', ' ').toUpperCase().slice(0, 2);
                }

                // Закрытие выпадающего списка
                langOptions.classList.remove('show');
            });
        });
    }

    /* ==========================================
       3. КНОПКА ПРОКРУТКИ ВВЕРХ
       ========================================== */

    const scrollToTopBtn = document.getElementById('scrollToTop') || document.querySelector('.scroll-to-top');

    if (scrollToTopBtn) {
        // Показ/скрытие кнопки при прокрутке
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });

        // Плавная прокрутка вверх
        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    /* ==========================================
       4. АДАПТИВНЫЕ ТАБЛИЦЫ
       ========================================== */

    // Добавление обертки для прокрутки таблиц на мобильных
    const tables = document.querySelectorAll('table:not(.wrapped)');
    tables.forEach(table => {
        if (!table.parentElement.classList.contains('table-responsive')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
            table.classList.add('wrapped');
        }
    });

    /* ==========================================
       5. АДМИН ПАНЕЛЬ - САЙДБАР
       ========================================== */

    const sidebarToggle = document.getElementById('sidebarToggle');
    const adminSidebar = document.querySelector('.admin-sidebar');

    if (sidebarToggle && adminSidebar) {
        sidebarToggle.addEventListener('click', function() {
            adminSidebar.classList.toggle('show');

            // Блокировка прокрутки при открытом сайдбаре на мобильных
            if (window.innerWidth < 768) {
                if (adminSidebar.classList.contains('show')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            }
        });

        // Закрытие сайдбара при клике вне его на мобильных
        document.addEventListener('click', function(e) {
            if (window.innerWidth < 768 &&
                !e.target.closest('.admin-sidebar') &&
                !e.target.closest('#sidebarToggle') &&
                adminSidebar.classList.contains('show')) {
                adminSidebar.classList.remove('show');
                document.body.style.overflow = '';
            }
        });

        // Закрытие сайдбара при изменении размера окна
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 768) {
                adminSidebar.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    }

    /* ==========================================
       6. ОПТИМИЗАЦИЯ ИЗОБРАЖЕНИЙ
       ========================================== */

    // Ленивая загрузка изображений (Intersection Observer)
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[data-src]');

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    /* ==========================================
       7. TOUCH GESTURES (Свайпы)
       ========================================== */

    // Свайп для закрытия сайдбара
    if (adminSidebar && window.innerWidth < 768) {
        let touchStartX = 0;
        let touchEndX = 0;

        adminSidebar.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        adminSidebar.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            // Свайп влево для закрытия
            if (touchStartX - touchEndX > 50) {
                adminSidebar.classList.remove('show');
                document.body.style.overflow = '';
            }
        }
    }

    /* ==========================================
       8. АДАПТИВНЫЕ ФОРМЫ
       ========================================== */

    // Автоматический фокус на первом поле формы (только на десктопе)
    if (window.innerWidth >= 768) {
        const firstInput = document.querySelector('form input:not([type="hidden"]):first-of-type');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    // Улучшение фокуса на полях формы
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        const input = group.querySelector('input, select, textarea');
        if (input) {
            input.addEventListener('focus', function() {
                group.classList.add('focused');
            });

            input.addEventListener('blur', function() {
                group.classList.remove('focused');
            });
        }
    });

    /* ==========================================
       9. VIEWPORT HEIGHT FIX (для iOS)
       ========================================== */

    // Исправление 100vh на мобильных устройствах
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    /* ==========================================
       10. ACCESSIBILITY IMPROVEMENTS
       ========================================== */

    // Добавление роли и aria-атрибутов для кнопок
    document.querySelectorAll('button:not([role])').forEach(btn => {
        btn.setAttribute('role', 'button');
    });

    // Добавление aria-label для иконочных кнопок
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
        if (btn.querySelector('i') && !btn.textContent.trim()) {
            const icon = btn.querySelector('i');
            const ariaLabel = icon.className.includes('bars') ? 'Toggle menu' :
                            icon.className.includes('close') ? 'Close' :
                            icon.className.includes('search') ? 'Search' : 'Button';
            btn.setAttribute('aria-label', ariaLabel);
        }
    });

    // Клавиатурная навигация для модальных окон
    document.addEventListener('keydown', function(e) {
        // Закрытие модальных окон по ESC
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal[style*="display: flex"], .modal.show');
            openModals.forEach(modal => {
                modal.style.display = 'none';
                modal.classList.remove('show');
            });

            // Закрытие мобильного меню
            if (navMenu && navMenu.classList.contains('show')) {
                mobileMenuBtn.classList.remove('active');
                navMenu.classList.remove('show');
                document.body.style.overflow = '';
            }

            // Закрытие сайдбара
            if (adminSidebar && adminSidebar.classList.contains('show') && window.innerWidth < 768) {
                adminSidebar.classList.remove('show');
                document.body.style.overflow = '';
            }
        }
    });

    /* ==========================================
       11. PERFORMANCE OPTIMIZATION
       ========================================== */

    // Debounce функция для оптимизации событий resize и scroll
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Применение debounce к событиям resize
    const debouncedResize = debounce(() => {
        // Здесь можно добавить дополнительные функции при resize
        setViewportHeight();
    }, 250);

    window.addEventListener('resize', debouncedResize);

    /* ==========================================
       12. BROWSER DETECTION & FIXES
       ========================================== */

    // Определение Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
        document.body.classList.add('is-safari');
    }

    // Определение iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
        document.body.classList.add('is-ios');
    }

    // Определение touch устройства
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
        document.body.classList.add('is-touch');
    }

    /* ==========================================
       13. SMOOTH SCROLL POLYFILL
       ========================================== */

    // Полифил для плавной прокрутки для старых браузеров
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    /* ==========================================
       14. CONSOLE INFO
       ========================================== */

    console.log('%c✓ Responsive Helpers Loaded', 'color: #48bb78; font-weight: bold; font-size: 14px;');
    console.log(`%cScreen: ${window.innerWidth}x${window.innerHeight}`, 'color: #667eea; font-size: 12px;');
    console.log(`%cDevice: ${isTouchDevice ? 'Touch' : 'Desktop'}`, 'color: #667eea; font-size: 12px;');
    console.log(`%cBrowser: ${isIOS ? 'iOS' : isSafari ? 'Safari' : 'Other'}`, 'color: #667eea; font-size: 12px;');

});

/* ==========================================
   15. UTILITY FUNCTIONS (Global)
   ========================================== */

// Функция для показа уведомлений
function showNotification(message, type = 'success', duration = 3000) {
    let notification = document.querySelector('.notification');

    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.className = `notification ${type}`;

    // Показ уведомления
    setTimeout(() => notification.classList.add('show'), 10);

    // Скрытие уведомления
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Функция для блокировки/разблокировки прокрутки
function toggleBodyScroll(lock = true) {
    if (lock) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// Функция для определения размера экрана
function getScreenSize() {
    const width = window.innerWidth;
    if (width < 576) return 'mobile';
    if (width < 768) return 'tablet-sm';
    if (width < 992) return 'tablet';
    if (width < 1200) return 'laptop';
    return 'desktop';
}

// Экспорт функций в глобальную область
window.CleanProHelpers = {
    showNotification,
    toggleBodyScroll,
    getScreenSize
};

console.log('%c✓ CleanPro Helpers Ready', 'color: #2E8B57; font-weight: bold; font-size: 14px;');
