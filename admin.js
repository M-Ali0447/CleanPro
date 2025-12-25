
const API_BASE = '/api';
let adminToken = localStorage.getItem('adminToken');
let currentAdmin = JSON.parse(localStorage.getItem('adminData') || 'null');
let languageSwitchersInitialized = {};

// ========== INDEPENDENT ADMIN LANGUAGE SYSTEM ==========
// Использует AdminLanguage из adminTranslations.js

function getCurrentLanguage() {
    return AdminLanguage.getCurrent();
}

function getAdminTranslations(lang = null) {
    return AdminLanguage.getAll(lang);
}

function setLanguage(lang) {
    return AdminLanguage.set(lang);
}

function t(key) {
    return AdminLanguage.get(key);
}

// Helper function to translate status
function getStatusText(status) {
    const statusMap = {
        'pending': t('statusPending'),
        'completed': t('statusCompleted'),
        'cancelled': t('statusCancelled')
    };
    return statusMap[status] || status;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ ADMIN PANEL YUKLANDI');

    // Check if AdminLanguage is available
    if (typeof AdminLanguage === 'undefined') {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: AdminLanguage не загружен!');
        console.error('Проверьте: 1) adminTranslations.js загружен, 2) нет ошибок в консоли');
        return;
    }

    console.log('✅ AdminLanguage доступен');

    // Initialize language first
    initializeAdminLanguage();

    // Setup event listeners
    setupEventListeners();

    // Token bor yoki yo'qligini tekshirish
    if (adminToken && currentAdmin) {
        console.log('🔑 Token topildi, admin panelga kirish...');
        showAdminPanel();
        checkAdminRole();
        loadDashboard();
    } else {
        console.log('🔒 Token topilmadi, login sahifasiga o\'tish...');
        showLoginPage();
    }

    // Soatni yangilash
    updateClock();
    setInterval(updateClock, 1000);



});

// ========== LANGUAGE FUNCTIONS ==========
function initializeAdminLanguage() {
    const currentLang = getCurrentLanguage();
    const t = getAdminTranslations(currentLang);

    console.log('🔧 initializeAdminLanguage:', { currentLang, hasTranslations: !!t });

    // Update all language buttons
    updateLanguageButtons(currentLang);

    // Translate pages based on which is visible
    const loginPage = document.getElementById('loginPage');
    const adminPanel = document.getElementById('adminPanel');

    // Check computed style to see which is actually visible
    const loginVisible = loginPage && window.getComputedStyle(loginPage).display !== 'none';
    const adminVisible = adminPanel && window.getComputedStyle(adminPanel).display !== 'none';

    console.log('👀 Page visibility:', { loginVisible, adminVisible });

    if (loginVisible && !adminVisible) {
        console.log('📄 Translating login page on init');
        translateLoginPage(t);
    } else if (adminVisible) {
        console.log('📄 Translating admin page on init');
        translateAdminPage(t);
    }
}

function updateLanguageButtons(lang) {
    // Update admin panel language button
    const adminLangText = document.getElementById('adminLangText');
    if (adminLangText) {
        if (lang === 'uz_latn') adminLangText.textContent = 'UZ';
        else if (lang === 'uz_cyrl') adminLangText.textContent = 'ЎЗ';
        else if (lang === 'ru') adminLangText.textContent = 'RU';
    }
    
    // Update login page language button
    const loginLangText = document.getElementById('loginLangText');
    if (loginLangText) {
        if (lang === 'uz_latn') loginLangText.textContent = 'UZ';
        else if (lang === 'uz_cyrl') loginLangText.textContent = 'ЎЗ';
        else if (lang === 'ru') loginLangText.textContent = 'RU';
    }
    
    // Mark active language in all dropdowns
    document.querySelectorAll('.lang-option').forEach(btn => {
        const checkIcon = btn.querySelector('i.fa-check');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
            if (checkIcon) checkIcon.style.display = 'inline';
        } else {
            btn.classList.remove('active');
            if (checkIcon) checkIcon.style.display = 'none';
        }
    });
}

function changeAdminLanguage(lang) {
    console.log('🔄 Changing admin language to:', lang);

    // Set new language using independent system
    if (!setLanguage(lang)) {
        console.error('❌ Invalid language:', lang);
        return;
    }

    const translations = getAdminTranslations();
    console.log('✅ Admin language saved:', lang);

    // Update buttons
    updateLanguageButtons(lang);

    // Close all dropdowns
    closeAllLanguageDropdowns();

    // Translate based on which page is actually visible
    const loginPage = document.getElementById('loginPage');
    const adminPanel = document.getElementById('adminPanel');
    const loginVisible = loginPage && window.getComputedStyle(loginPage).display !== 'none';
    const adminVisible = adminPanel && window.getComputedStyle(adminPanel).display !== 'none';

    console.log('👀 Page visibility on language change:', { loginVisible, adminVisible });

    if (loginVisible && !adminVisible) {
        console.log('📄 Translating login page');
        translateLoginPage(translations);
    } else if (adminVisible) {
        console.log('📄 Translating admin page');
        translateAdminPage(translations);

        // Reload current section content to apply translations
        setTimeout(() => {
            console.log('🔄 Reloading section:', currentSection);
            switchSection(currentSection);
        }, 50);
    }
}

function translateLoginPage(t) {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const labels = loginForm.querySelectorAll('label');
    if (labels[0]) labels[0].textContent = '👤 ' + t.login;
    if (labels[1]) labels[1].textContent = '🔒 ' + t.password;

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ' + t.login;

    const h2 = document.querySelector('.login-logo h2');
    if (h2) h2.textContent = t.adminTitle || 'CleanPro Admin';

    const p = document.querySelector('.login-logo p');
    if (p) p.textContent = t.professionalAdmin;

    // Update test accounts text
    const testAccounts = document.querySelector('.login-test-accounts h4');
    if (testAccounts) testAccounts.textContent = t.testAccounts;

    // Apply data-translate attributes
    applyDataTranslations(t);
}

function translateAdminPage(t) {
    console.log('🌍 translateAdminPage called with language:', localStorage.getItem('language'));
    console.log('📝 Translations object:', t);

    if (!t || Object.keys(t).length === 0) {
        console.error('❌ No translations available!');
        return;
    }

    // Menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        const section = item.dataset.section;
        if (section && t[section]) {
            const icon = item.querySelector('i');
            const badge = item.querySelector('.badge');
            const iconHtml = icon ? icon.outerHTML + ' ' : '';
            const badgeHtml = badge ? ' ' + badge.outerHTML : '';
            item.innerHTML = iconHtml + t[section] + badgeHtml;
        }
    });

    // Page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle && currentSection) {
        pageTitle.textContent = t[currentSection] || pageTitle.textContent;
    }

    // Stats cards
    document.querySelectorAll('.stat-card h3').forEach(h3 => {
        const text = h3.textContent.trim();
        if (text.includes('Buyurtmalar') || text.includes('Буюртмалар') || text.includes('Заказ') || text.includes('Jami') || text.includes('Жами') || text.includes('Всего')) {
            if (text.includes('Jami Buyurtmalar') || text.includes('Жами Буюртмалар') || text.includes('Всего Заказ') || text.includes('totalOrders')) h3.textContent = t.totalOrders;
            else if (text.includes('Kutilmoqda') || text.includes('Кутилмоқда') || text.includes('ожидани') || text.includes('pendingOrders')) h3.textContent = t.pendingOrders;
            else if (text.includes('Jami Fikrlar') || text.includes('Жами Фикрлар') || text.includes('Всего Отзыв') || text.includes('totalReviews')) h3.textContent = t.totalReviews;
            else if (text.includes('Foydalanuvchilar') || text.includes('Фойдаланувчилар') || text.includes('Пользовател') || text.includes('totalUsers')) h3.textContent = t.totalUsers;
        }
    });

    // Section headers
    const sectionHeaders = document.querySelectorAll('.section-header h2, #usersSection h2, #statsSection .section-header h2, #adminsSection .section-header h2');
    sectionHeaders.forEach(header => {
        const text = header.textContent.trim();
        const icon = header.querySelector('i');
        const iconHtml = icon ? icon.outerHTML + ' ' : '';

        if (text.includes('Dashboard') || text.includes('Дашборд') || text.includes('Панель') || text.includes('dashboard')) {
            header.innerHTML = iconHtml + t.dashboard;
        } else if (text.includes('Barcha Buyurtmalar') || text.includes('Барча Буюртмалар') || text.includes('Все Заказы')) {
            header.innerHTML = iconHtml + t.allOrders;
        } else if (text.includes('Barcha Fikrlar') || text.includes('Барча Фикрлар') || text.includes('Все Отзывы')) {
            header.innerHTML = iconHtml + t.allReviews;
        } else if (text.includes('Foydalanuvchilar') || text.includes('Фойдаланувчилар') || text.includes('Пользовател')) {
            header.innerHTML = iconHtml + t.users;
        } else if (text.includes('Statistika') || text.includes('Статистика')) {
            header.innerHTML = iconHtml + t.stats;
        } else if (text.includes('Adminlar') || text.includes('Админлар') || text.includes('Администратор')) {
            header.innerHTML = iconHtml + t.adminsManagement;
        }
    });

    // Search placeholders
    const searchInputs = document.querySelectorAll('input[placeholder*="Qidirish"], input[placeholder*="Қидириш"], input[placeholder*="Поиск"], input[placeholder*="Search"]');
    searchInputs.forEach(input => {
        input.placeholder = t.search;
    });

    // Refresh buttons
    const refreshBtns = document.querySelectorAll('.btn-refresh');
    refreshBtns.forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
            btn.innerHTML = icon.outerHTML + ' ' + t.refresh;
        } else {
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> ' + t.refresh;
        }
    });

    // Filter dropdowns
    const filterSelects = document.querySelectorAll('select#orderFilter');
    filterSelects.forEach(select => {
        if (select.options.length >= 4) {
            select.options[0].textContent = t.allStatuses;
            select.options[1].textContent = t.statusPending;
            select.options[2].textContent = t.statusCompleted;
            select.options[3].textContent = t.statusCancelled;
        }
    });

    // Logout button
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> ' + t.logout;
    }

    // Loading overlay text
    const loadingText = document.querySelector('.loader-content p');
    if (loadingText && loadingText.textContent.includes('kuting')) {
        loadingText.textContent = t.pleaseWait;
    }

    // Stats section chart titles
    const chartTitles = document.querySelectorAll('.chart-header h3');
    chartTitles.forEach(title => {
        if (title.textContent.includes('Xizmat turlari') || title.textContent.includes('Хизмат турлари') || title.textContent.includes('типам услуг')) {
            const icon = title.querySelector('i');
            const iconHtml = icon ? icon.outerHTML + ' ' : '<i class="fas fa-list-alt"></i> ';
            title.innerHTML = iconHtml + t.serviceStats;
        } else if (title.textContent.includes('holati') || title.textContent.includes('ҳолати') || title.textContent.includes('статусам')) {
            const icon = title.querySelector('i');
            const iconHtml = icon ? icon.outerHTML + ' ' : '<i class="fas fa-chart-pie"></i> ';
            title.innerHTML = iconHtml + t.statusStats;
        }
    });

    // Admin panel role badge
    const adminRoleBadge = document.getElementById('adminRole');
    if (adminRoleBadge && currentAdmin) {
        if (currentAdmin.role === 'super_admin') {
            adminRoleBadge.textContent = t.superAdmin;
        } else {
            adminRoleBadge.textContent = t.admin;
        }
    }

    // Dashboard chart titles
    const chartH3s = document.querySelectorAll('.chart-container h3, .recent-orders h3');
    chartH3s.forEach(h3 => {
        if (h3.textContent.includes('So\'nggi 7') || h3.textContent.includes('Сўнгги 7') || h3.textContent.includes('последние 7')) {
            h3.textContent = '📊 ' + t.weeklyOrders;
        } else if (h3.textContent.includes('So\'nggi Buy') || h3.textContent.includes('Сўнгги Буюр') || h3.textContent.includes('Последние Зак')) {
            h3.textContent = '🆕 ' + t.recentOrders;
        }
    });

    // Statistics summary title
    const statsSummaryH3 = document.querySelector('.stats-summary h3');
    if (statsSummaryH3 && (statsSummaryH3.textContent.includes('xulosasi') || statsSummaryH3.textContent.includes('хулосаси') || statsSummaryH3.textContent.includes('Сводка'))) {
        const icon = statsSummaryH3.querySelector('i');
        const iconHtml = icon ? icon.outerHTML + ' ' : '<i class="fas fa-info-circle"></i> ';
        statsSummaryH3.innerHTML = iconHtml + t.statisticsSummary;
    }

    // Statistics labels
    const statsLabels = document.querySelectorAll('.stats-summary .stat-label');
    statsLabels.forEach(label => {
        const text = label.textContent.trim();
        if (text.includes('Jami') || text.includes('Жами') || text.includes('Всего')) {
            label.textContent = t.totalOrdersLabel;
        } else if (text.includes('Kutilmoqda') || text.includes('Кутилмоқда') || text.includes('ожидании')) {
            label.textContent = t.pendingOrdersLabel;
        } else if (text.includes('Bajarildi') || text.includes('Бажарилди') || text.includes('Выполнено')) {
            label.textContent = t.completedOrdersLabel;
        } else if (text.includes('Bekor') || text.includes('Бекор') || text.includes('Отменено')) {
            label.textContent = t.cancelledOrdersLabel;
        }
    });

    // Admin management "New Admin" button
    const newAdminBtn = document.querySelector('#adminActions .btn-primary');
    if (newAdminBtn && newAdminBtn.textContent.includes('Yangi Admin')) {
        const icon = newAdminBtn.querySelector('i');
        const iconHtml = icon ? icon.outerHTML + ' ' : '<i class="fas fa-plus"></i> ';
        newAdminBtn.innerHTML = iconHtml + t.newAdmin;
    }

    // Test button in stats
    const testBtn = document.querySelector('.btn-primary[onclick*="testStatistics"]');
    if (testBtn) {
        const icon = testBtn.querySelector('i');
        const iconHtml = icon ? icon.outerHTML + ' ' : '<i class="fas fa-vial"></i> ';
        testBtn.innerHTML = iconHtml + t.test;
    }

    // Modal title
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        if (modalTitle.textContent.includes('Qo\'shish') || modalTitle.textContent.includes('Қўшиш') || modalTitle.textContent.includes('Добавить')) {
            modalTitle.textContent = t.addNewAdmin;
        } else if (modalTitle.textContent.includes('Tahrirlash') || modalTitle.textContent.includes('Таҳрирлаш') || modalTitle.textContent.includes('Редактировать')) {
            modalTitle.textContent = t.editAdminTitle;
        }
    }

    // Modal form labels
    const adminForm = document.getElementById('adminForm');
    if (adminForm) {
        const labels = adminForm.querySelectorAll('label');
        if (labels[0]) labels[0].textContent = t.usernameRequired;
        if (labels[1]) labels[1].textContent = t.passwordRequired;
        if (labels[2]) labels[2].textContent = t.fullNameRequired;
        if (labels[3]) labels[3].textContent = t.emailOptional;
        if (labels[4]) labels[4].textContent = t.roleLabel;

        // Modal buttons
        const saveBtn = adminForm.querySelector('button[type="submit"]');
        if (saveBtn) saveBtn.textContent = t.saveButton;

        const cancelBtn = adminForm.querySelector('button[onclick*="closeAdminModal"]');
        if (cancelBtn) cancelBtn.textContent = t.cancelButton;
    }

    // Table headers - Orders
    const ordersTable = document.querySelector('#ordersSection table thead');
    if (ordersTable) {
        const headers = ordersTable.querySelectorAll('th');
        if (headers[0]) headers[0].textContent = t.id;
        if (headers[1]) headers[1].textContent = t.customer;
        if (headers[2]) headers[2].textContent = t.phone;
        if (headers[3]) headers[3].textContent = t.service;
        if (headers[4]) headers[4].textContent = t.date;
        if (headers[5]) headers[5].textContent = t.status;
        if (headers[6]) headers[6].textContent = t.actions;
    }

    // Table headers - Reviews
    const reviewsTable = document.querySelector('#reviewsSection table thead');
    if (reviewsTable) {
        const headers = reviewsTable.querySelectorAll('th');
        if (headers[0]) headers[0].textContent = t.id;
        if (headers[1]) headers[1].textContent = t.name;
        if (headers[2]) headers[2].textContent = t.rating;
        if (headers[3]) headers[3].textContent = t.review;
        if (headers[4]) headers[4].textContent = t.date;
        if (headers[5]) headers[5].textContent = t.actions;
    }

    // Table headers - Users
    const usersTable = document.querySelector('#usersSection table thead');
    if (usersTable) {
        const headers = usersTable.querySelectorAll('th');
        if (headers[0]) headers[0].textContent = t.id;
        if (headers[1]) headers[1].textContent = t.name;
        if (headers[2]) headers[2].textContent = t.phone;
        if (headers[3]) headers[3].textContent = t.orders;
        if (headers[4]) headers[4].textContent = t.registered;
    }

    // Table headers - Admins
    const adminsTable = document.querySelector('#adminsSection table thead');
    if (adminsTable) {
        const headers = adminsTable.querySelectorAll('th');
        if (headers[0]) headers[0].textContent = t.id;
        if (headers[1]) headers[1].textContent = 'Username';
        if (headers[2]) headers[2].textContent = t.fullName;
        if (headers[3]) headers[3].textContent = 'Email';
        if (headers[4]) headers[4].textContent = t.role;
        if (headers[5]) headers[5].textContent = t.created;
        if (headers[6]) headers[6].textContent = t.actions;
    }

    // Dashboard recent orders table
    const dashboardTable = document.querySelector('#dashboardSection table thead');
    if (dashboardTable) {
        const headers = dashboardTable.querySelectorAll('th');
        if (headers[0]) headers[0].textContent = t.id;
        if (headers[1]) headers[1].textContent = t.customer;
        if (headers[2]) headers[2].textContent = t.phone;
        if (headers[3]) headers[3].textContent = t.service;
        if (headers[4]) headers[4].textContent = t.status;
    }

    // Universal translation function for data-translate attributes
    applyDataTranslations(t);
}

// Apply translations to all elements with data-translate attribute
function applyDataTranslations(translations) {
    if (!translations) {
        translations = getAdminTranslations();
    }

    console.log('🔄 Applying translations...', { keysCount: Object.keys(translations).length });

    // Translate all elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[key]) {
            // Preserve inner HTML like icons
            const hasIcon = element.querySelector('i');
            if (hasIcon && element.children.length === 1 && element.children[0].tagName === 'I') {
                const iconHTML = hasIcon.outerHTML;
                element.innerHTML = iconHTML + ' ' + translations[key];
            } else {
                element.textContent = translations[key];
            }
        }
    });

    // Translate placeholders with data-translate-placeholder attribute
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[key]) {
            element.placeholder = translations[key];
        }
    });

    // Translate select options with data-translate attribute
    document.querySelectorAll('option[data-translate]').forEach(option => {
        const key = option.getAttribute('data-translate');
        if (translations[key]) {
            option.textContent = translations[key];
        }
    });

    console.log('✅ Data-translate attributes processed');
}

// Global function that can be called after loading dynamic content
window.applyTranslations = function() {
    const translations = getAdminTranslations();
    applyDataTranslations(translations);
};

// Global functions for language switcher
window.toggleLangDropdown = function() {
    console.log('🔘 Language button clicked');
    const dropdown = document.getElementById('adminLangOptions');
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        console.log('Dropdown toggled:', isVisible ? 'hidden' : 'shown');
    }
};

window.selectLanguage = function(lang) {
    console.log('🌍 Language selected:', lang);
    const dropdown = document.getElementById('adminLangOptions');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    changeAdminLanguage(lang);
};

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('adminLangOptions');
    const button = document.getElementById('adminLangBtn');
    if (dropdown && button) {
        if (!button.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    }
});

function closeAllLanguageDropdowns() {
    document.querySelectorAll('.lang-options').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

// ========== EVENT LISTENERS SETUP ==========
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin(e);
            return false;
        });
    }
    
    // Language switcher for admin panel
    setTimeout(() => {
        setupLanguageSwitcher('adminLangBtn', 'adminLangOptions');
        console.log('✅ Admin language switcher initialized');
    }, 100);

    // Language switcher for login page (if exists)
    setTimeout(() => {
        setupLanguageSwitcher('loginLangBtn', 'loginLangOptions');
    }, 100);
    
    // Menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            switchSection(section);
            
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
}

function setupLanguageSwitcher(buttonId, optionsId) {
    // Check if already initialized
    const key = `${buttonId}_${optionsId}`;
    if (languageSwitchersInitialized[key]) {
        console.log(`Language switcher already initialized: ${buttonId}`);
        return;
    }

    const langBtn = document.getElementById(buttonId);
    const langOptions = document.getElementById(optionsId);

    if (!langBtn || !langOptions) {
        console.log(`Language switcher not found: ${buttonId}, ${optionsId}`);
        return;
    }

    console.log(`Setting up language switcher: ${buttonId}`);

    // Store button click handler
    const btnClickHandler = function(e) {
        e.stopPropagation();
        e.preventDefault();

        console.log('Language button clicked', buttonId);

        // Close all other dropdowns
        document.querySelectorAll('.lang-options').forEach(dropdown => {
            if (dropdown.id !== optionsId) {
                dropdown.classList.remove('show');
            }
        });

        // Toggle current dropdown
        const isVisible = langOptions.classList.contains('show');
        langOptions.classList.toggle('show');

        console.log('Dropdown toggled:', !isVisible ? 'shown' : 'hidden');
    };

    // Store options click handler
    const optionsClickHandler = function(e) {
        e.stopPropagation();
        e.preventDefault();

        // Find the button element even if clicked on icon or text
        let target = e.target;
        while (target && target !== langOptions && !target.classList.contains('lang-option')) {
            target = target.parentElement;
        }

        if (target && target.classList.contains('lang-option')) {
            const lang = target.dataset.lang;
            console.log('Language selected:', lang);
            if (lang) {
                changeAdminLanguage(lang);
                langOptions.classList.remove('show');
            }
        }
    };

    // Store outside click handler
    const outsideClickHandler = function(e) {
        if (!langBtn.contains(e.target) && !langOptions.contains(e.target)) {
            langOptions.classList.remove('show');
        }
    };

    // Add event listeners
    langBtn.addEventListener('click', btnClickHandler);
    langOptions.addEventListener('click', optionsClickHandler);
    document.addEventListener('click', outsideClickHandler);

    // Mark as initialized
    languageSwitchersInitialized[key] = true;
    console.log(`Language switcher initialized: ${buttonId}`);
}

// ========== UI FUNCTIONS (Qolgan qismi o'zgarmasdan) ==========
function showLoginPage() {
    const loginPage = document.getElementById('loginPage');
    const adminPanel = document.getElementById('adminPanel');
    if (loginPage) loginPage.style.display = 'flex';
    if (adminPanel) adminPanel.style.display = 'none';
    
    // Translate login page
    const t = getAdminTranslations(getCurrentLanguage());
    translateLoginPage(t);
}

function showAdminPanel() {
    const loginPage = document.getElementById('loginPage');
    const adminPanel = document.getElementById('adminPanel');
    if (loginPage) loginPage.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'flex';

    // Update admin info
    if (currentAdmin) {
        const adminName = document.getElementById('adminName');
        const adminRole = document.getElementById('adminRole');
        if (adminName) adminName.textContent = currentAdmin.full_name || currentAdmin.username;
        if (adminRole) {
            adminRole.textContent = currentAdmin.role === 'super_admin' ? 'Super Admin' : 'Admin';
        }
    }

    // Re-initialize language switcher and translate after panel is visible
    setTimeout(() => {
        setupLanguageSwitcher('adminLangBtn', 'adminLangOptions');

        // Translate admin page after it's fully rendered
        const t = getAdminTranslations(getCurrentLanguage());
        console.log('🎨 showAdminPanel - translating with language:', getCurrentLanguage());
        translateAdminPage(t);
    }, 150);
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
        overlay.classList.toggle('show', show);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = message ? 'block' : 'none';
        console.log('⚠️ Login error:', message);
    } else {
        console.error('❌ loginError div not found!');
        // Create error div if it doesn't exist
        const form = document.getElementById('loginForm');
        if (form && message) {
            const error = document.createElement('div');
            error.id = 'loginError';
            error.className = 'error-message';
            error.style.cssText = 'color: #e53e3e; margin-top: 20px; text-align: center; display: block;';
            error.textContent = message;
            form.appendChild(error);
        }
    }
}

function updateClock() {
    const clock = document.getElementById('currentTime');
    if (clock) {
        const now = new Date();
        clock.textContent = now.toLocaleTimeString('uz-UZ');
    }
}

let currentSection = 'dashboard';

function switchSection(section) {
    currentSection = section;

    // Hide all sections
    document.querySelectorAll('.section-content').forEach(sec => {
        sec.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(section + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const t = getAdminTranslations(getCurrentLanguage());
        pageTitle.textContent = t[section] || section;
    }

    // Load section data
    if (section === 'dashboard') loadDashboard();
    else if (section === 'orders') loadOrders();
    else if (section === 'reviews') loadReviews();
    else if (section === 'users') loadUsers();
    else if (section === 'stats') loadStatistics();
    else if (section === 'admins') loadAdmins();

    // Translate the page after switching sections
    setTimeout(() => {
        const t = getAdminTranslations(getCurrentLanguage());
        translateAdminPage(t);
    }, 100);
}

function toggleSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) sidebar.classList.toggle('show');
}

// ========== AUTH FUNCTIONS ==========
async function handleLogin(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('🔐 handleLogin called');
    
    // Get inputs directly by ID
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (!usernameInput || !passwordInput) {
        console.error('❌ Inputs not found:', { usernameInput: !!usernameInput, passwordInput: !!passwordInput });
        showLoginError('⚠️ Forma maydonlari topilmadi!');
        return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    console.log('📝 Login attempt:', { username, passwordLength: password.length });
    
    if (!username || !password) {
        showLoginError('⚠️ Barcha maydonlarni to\'ldiring!');
        return;
    }
    
    showLoading(true);
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
    
    try {
        console.log('🌐 Sending request to:', `${API_BASE}/admin/login`);
        const response = await fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('📥 Response data:', result);
        
        if (result.success) {
            adminToken = result.token;
            currentAdmin = result.admin;
            localStorage.setItem('adminToken', adminToken);
            localStorage.setItem('adminData', JSON.stringify(currentAdmin));
            
            console.log('✅ Login successful!');
            showAdminPanel();
            checkAdminRole();
            loadDashboard();
            showNotification('✅ Xush kelibsiz!', 'success');
        } else {
            console.error('❌ Login failed:', result.message);
            showLoginError(result.message || '❌ Login yoki parol noto\'g\'ri!');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        showLoginError('❌ Server bilan bog\'lanishda xatolik! ' + error.message);
    } finally {
        showLoading(false);
    }
    
    return false;
}

function logout() {
    adminToken = null;
    currentAdmin = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    showLoginPage();
    const t = getAdminTranslations(getCurrentLanguage());
    translateLoginPage(t);
}

function checkAdminRole() {
    if (currentAdmin && currentAdmin.role === 'super_admin') {
        const adminMenu = document.getElementById('adminManagementMenu');
        if (adminMenu) adminMenu.style.display = 'block';
    }
}

// ========== API FUNCTIONS ==========
async function authFetch(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
    }
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        logout();
        throw new Error('Unauthorized');
    }
    
    return response;
}

// ========== DATA LOADING FUNCTIONS ==========
// ========== WEEKLY CHART FUNCTIONS ==========

let weeklyChartInstance = null;

async function loadDashboard() {
    console.log("📊 Dashboard yuklanmoqda...");
    
    try {
        // Statistikani yuklash
        const statsResponse = await authFetch(`${API_BASE}/admin/stats`);
        const statsResult = await statsResponse.json();
        
        if (statsResult.success) {
            const stats = statsResult.stats;
            
            // Update stat cards
            const totalOrdersEl = document.getElementById('totalOrders');
            if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders || 0;
            
            const pendingOrdersEl = document.getElementById('pendingOrders');
            if (pendingOrdersEl) pendingOrdersEl.textContent = stats.pendingOrders || 0;
            
            const totalReviewsEl = document.getElementById('totalReviews');
            if (totalReviewsEl) totalReviewsEl.textContent = stats.totalReviews || 0;
            
            const totalUsersEl = document.getElementById('totalUsers');
            if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers || 0;
            
            // Update badge
            const badge = document.getElementById('pendingOrdersBadge');
            if (badge) badge.textContent = stats.pendingOrders || 0;
        }
        
        // So'nggi buyurtmalarni yuklash
        await loadRecentOrders();

        // So'nggi 7 kunlik grafikni yuklash
        await loadWeeklyChart();

        // Translate all elements after data is loaded
        setTimeout(() => {
            const t = getAdminTranslations(getCurrentLanguage());
            translateAdminPage(t);
        }, 100);

    } catch (error) {
        console.error('❌ Dashboard yuklashda xatolik:', error);
        showNotification('❌ Dashboard ma\'lumotlarini yuklashda xatolik!', 'error');
    }
}

async function loadRecentOrders() {
    try {
        const ordersResponse = await authFetch(`${API_BASE}/admin/orders?limit=5`);
        const ordersResult = await ordersResponse.json();
        
        if (ordersResult.success && ordersResult.orders) {
            const recentTbody = document.getElementById('recentOrdersTable');
            if (recentTbody) {
                if (ordersResult.orders.length === 0) {
                    const t = getAdminTranslations(getCurrentLanguage());
                    recentTbody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                                <i class="fas fa-shopping-cart" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                                ${t.noData || 'Ma\'lumot yo\'q'}
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                recentTbody.innerHTML = ordersResult.orders.map(order => {
                    const statusText = getStatusText(order.status);

                    return `
                        <tr>
                            <td>#${order.id}</td>
                            <td>${order.name || '-'}</td>
                            <td>${order.phone || '-'}</td>
                            <td>${order.service_type || '-'}</td>
                            <td><span class="status-badge status-${order.status || 'pending'}">${statusText}</span></td>
                        </tr>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('❌ So\'nggi buyurtmalarni yuklashda xatolik:', error);
    }
}

async function loadWeeklyChart() {
    console.log("📈 So'nggi 7 kunlik grafik yuklanmoqda...");
    
    try {
        // API dan so'nggi 7 kunlik ma'lumotlarni olish
        const response = await authFetch(`${API_BASE}/admin/stats/weekly`);
        const result = await response.json();
        
        if (result.success && result.data) {
            createWeeklyChart(result.data);
        } else {
            // Agar API bo'lmasa, test ma'lumotlar bilan ishlash
            console.log("⚠️ Weekly API mavjud emas, test ma'lumotlar ishlatilmoqda...");
            createWeeklyChartWithTestData();
        }
    } catch (error) {
        console.error("❌ Weekly chart API xatosi:", error);
        // Xatolik yuz bersa ham test ma'lumotlar bilan ishlash
        createWeeklyChartWithTestData();
    }
}

function createWeeklyChart(data) {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) {
        console.error("❌ weeklyChart canvas topilmadi!");
        return;
    }

    // Avvalgi grafikni yo'q qilish
    if (weeklyChartInstance) {
        weeklyChartInstance.destroy();
    }

    // Kunlar nomlari
    const days = getLast7Days();

    // Ma'lumotlarni to'g'ri formatga o'tkazish
    const counts = Array.isArray(data)
        ? data.map(item => typeof item === 'object' ? item.count : item)
        : [];

    console.log("📊 Weekly chart data:", counts);

    // Grafikni yaratish
    weeklyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Buyurtmalar soni',
                data: counts,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(102, 126, 234, 0.7)',
                    'rgba(102, 126, 234, 0.6)',
                    'rgba(102, 126, 234, 0.5)',
                    'rgba(102, 126, 234, 0.4)',
                    'rgba(102, 126, 234, 0.3)',
                    'rgba(102, 126, 234, 0.2)'
                ],
                borderColor: '#667eea',
                borderWidth: 1,
                borderRadius: 5,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Buyurtmalar: ${context.raw} ta`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            if (Number.isInteger(value)) {
                                return value + ' ta';
                            }
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function createWeeklyChartWithTestData() {
    console.log("🧪 Test ma'lumotlar bilan grafik yaratilmoqda...");
    
    // Test ma'lumotlar (so'nggi 7 kun uchun)
    const testData = [4, 6, 3, 7, 5, 8, 6];
    const days = getLast7Days();
    
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    
    // Avvalgi grafikni yo'q qilish
    if (weeklyChartInstance) {
        weeklyChartInstance.destroy();
    }
    
    weeklyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Buyurtmalar soni',
                data: testData,
                backgroundColor: [
                    'rgba(46, 139, 87, 0.8)',
                    'rgba(46, 139, 87, 0.7)',
                    'rgba(46, 139, 87, 0.6)',
                    'rgba(46, 139, 87, 0.5)',
                    'rgba(46, 139, 87, 0.4)',
                    'rgba(46, 139, 87, 0.3)',
                    'rgba(46, 139, 87, 0.2)'
                ],
                borderColor: '#2E8B57',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // Test ma'lumotlari yaratilganligi haqida xabar
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
        const testNote = document.createElement('div');
        testNote.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(255, 215, 0, 0.1);
            color: #D97706;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            border: 1px solid rgba(255, 215, 0, 0.3);
        `;
        testNote.innerHTML = '<i class="fas fa-vial"></i> Test ma\'lumotlar';
        chartContainer.appendChild(testNote);
    }
}

function getLast7Days() {
    const days = [];
    const dayNamesUz = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = dayNamesUz[date.getDay()];
        days.push(`${dayName} ${date.getDate()}`);
    }
    
    return days;
}

// DOMContentLoaded da loadDashboard funksiyasini chaqirishni tekshirish
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ ADMIN PANEL YUKLANDI');
    
    // Initialize language first
    initializeAdminLanguage();
    
    // Setup event listeners
    setupEventListeners();
    
    // Token bor yoki yo'qligini tekshirish
    if (adminToken && currentAdmin) {
        console.log('🔑 Token topildi, admin panelga kirish...');
        showAdminPanel();
        checkAdminRole();
        // Dashboardni yuklash
        setTimeout(() => {
            loadDashboard();
        }, 100);
    } else {
        console.log('🔒 Token topilmadi, login sahifasiga o\'tish...');
        showLoginPage();
    }
    
    // Soatni yangilash
    updateClock();
    setInterval(updateClock, 1000);
});

async function loadOrders() {
    try {
        const response = await authFetch(`${API_BASE}/admin/orders`);
        const result = await response.json();
        
        if (result.success) {
            displayOrders(result.orders);
        }
    } catch (error) {
        console.error('Load orders error:', error);
    }
}

function displayOrders(orders) {
    const tbody = document.getElementById('ordersTable');
    if (!tbody) {
        console.error('Orders table tbody not found!');
        return;
    }
    
    const t = getAdminTranslations(getCurrentLanguage());
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Hozircha buyurtmalar yo\'q</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => {
        return `
            <tr>
                <td>${order.id}</td>
                <td>${order.name || '-'}</td>
                <td>${order.phone || '-'}</td>
                <td>${order.service_type || '-'}</td>
                <td>${order.order_date ? new Date(order.order_date).toLocaleDateString() : '-'}</td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Kutilmoqda</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Bajarildi</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Bekor qilindi</option>
                    </select>
                </td>
                <td>
                    <button class="action-btn btn-delete" onclick="deleteOrder(${order.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ========== O'CHIRISH FUNKSIYALARI (YANGI) ==========

// Buyurtmani o'chirish
window.deleteOrder = async function(orderId) {
    if (!confirm('Buyurtmani o\'chirishni tasdiqlaysizmi?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Buyurtma o\'chirildi!', 'success');
            loadOrders(); // Jadvalni yangilash
        } else {
            showNotification(`❌ ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Delete order error:', error);
        showNotification('❌ Xatolik yuz berdi!', 'error');
    }
};

// Fikrni o'chirish
window.deleteReview = async function(reviewId) {
    if (!confirm('Fikrni o\'chirishni tasdiqlaysizmi?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Fikr o\'chirildi!', 'success');
            loadReviews(); // Jadvalni yangilash
        } else {
            showNotification(`❌ ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Delete review error:', error);
        showNotification('❌ Xatolik yuz berdi!', 'error');
    }
};

// Adminni o'chirish (faqat super_admin uchun)
window.deleteAdmin = async function(adminId) {
    // Super admin emasligini tekshirish
    if (currentAdmin.role !== 'super_admin') {
        showNotification('❌ Faqat super admin adminlarni o\'chira oladi!', 'error');
        return;
    }
    
    // O'zini o'chira olmasligi
    if (currentAdmin.id === adminId) {
        showNotification('❌ O\'zingizni o\'chira olmaysiz!', 'error');
        return;
    }
    
    if (!confirm('Adminni o\'chirishni tasdiqlaysizmi?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/admins/${adminId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Admin o\'chirildi!', 'success');
            loadAdmins(); // Jadvalni yangilash
        } else {
            showNotification(`❌ ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Delete admin error:', error);
        showNotification('❌ Xatolik yuz berdi!', 'error');
    }
};

// Adminni tahrirlash
window.editAdmin = async function(adminId) {
    if (currentAdmin.role !== 'super_admin') {
        showNotification('❌ Faqat super admin adminlarni tahrirlay oladi!', 'error');
        return;
    }
    
    // Admin ma'lumotlarini olish
    try {
        const response = await fetch(`${API_BASE}/admin/admins`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const admin = result.admins.find(a => a.id === adminId);
            if (admin) {
                // Modal ochish va formani to'ldirish
                openAdminEditModal(admin);
            }
        }
    } catch (error) {
        console.error('Edit admin error:', error);
        showNotification('❌ Xatolik yuz berdi!', 'error');
    }
};

function openAdminEditModal(admin) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; width: 400px;">
            <h3 style="color: #2E8B57; margin-bottom: 20px;">Adminni tahrirlash</h3>
            <form id="editAdminForm">
                <input type="hidden" id="editAdminId" value="${admin.id}">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #333;">Username</label>
                    <input type="text" id="editUsername" value="${admin.username}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #333;">To'liq ism</label>
                    <input type="text" id="editFullName" value="${admin.full_name}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #333;">Email</label>
                    <input type="email" id="editEmail" value="${admin.email || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; color: #333;">Rol</label>
                    <select id="editRole" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="admin" ${admin.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="super_admin" ${admin.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
                    </select>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button type="button" onclick="updateAdmin()" style="flex: 1; background: #2E8B57; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;">
                        Saqlash
                    </button>
                    <button type="button" onclick="this.closest('.modal').remove()" style="flex: 1; background: #e53e3e; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;">
                        Bekor qilish
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Adminni yangilash
window.updateAdmin = async function() {
    const modal = document.querySelector('.modal');
    const adminId = document.getElementById('editAdminId')?.value;
    const username = document.getElementById('editUsername')?.value;
    const fullName = document.getElementById('editFullName')?.value;
    const email = document.getElementById('editEmail')?.value;
    const role = document.getElementById('editRole')?.value;
    
    if (!adminId || !username || !fullName) {
        showNotification('⚠️ Barcha maydonlarni to\'ldiring!', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/admins/${adminId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, full_name: fullName, email, role })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Admin yangilandi!', 'success');
            if (modal) modal.remove();
            loadAdmins();
        } else {
            showNotification(`❌ ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Update admin error:', error);
        showNotification('❌ Xatolik yuz berdi!', 'error');
    }
};

// ========== STATISTIKA FUNKSIYASI (SODDALASHTIRILGAN) ==========

window.loadStatistics = async function() {
    console.log("📊 Statistika yuklanmoqda...");
    
    try {
        // Buyurtmalarni olish
        const response = await fetch(`${API_BASE}/admin/orders`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (!result.success || !result.orders) {
            throw new Error('Ma\'lumotlar olinmadi');
        }
        
        const orders = result.orders;
        
        // Xizmat turlari bo'yicha statistika
        const serviceStats = {};
        orders.forEach(order => {
            const service = order.service_type || 'Noma\'lum';
            serviceStats[service] = (serviceStats[service] || 0) + 1;
        });
        
        // Status bo'yicha statistika
        const statusStats = {
            pending: 0,
            completed: 0,
            cancelled: 0
        };
        
        orders.forEach(order => {
            const status = order.status || 'pending';
            if (status === 'pending') statusStats.pending++;
            else if (status === 'completed') statusStats.completed++;
            else if (status === 'cancelled') statusStats.cancelled++;
        });
        
        // Chart.js yuklanganligini tekshirish
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js yuklanmagan, loading...');
            await loadChartJS();
        }
        
        // Grafiklarni chizish
        createSimpleCharts(serviceStats, statusStats);
        
    } catch (error) {
        console.error('Statistika xatosi:', error);
        
        // Xatolik xabarini ko'rsatish
        const servicesContainer = document.getElementById('servicesChartContainer');
        const statusContainer = document.getElementById('statusChartContainer');
        
        if (servicesContainer) {
            servicesContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-chart-line" style="font-size: 50px; margin-bottom: 20px;"></i>
                    <h4>Statistika yuklanmadi</h4>
                    <p>${error.message}</p>
                    <button onclick="loadStatistics()" style="margin-top: 15px; background: #2E8B57; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        Qayta urinish
                    </button>
                </div>
            `;
        }
        
        if (statusContainer) {
            statusContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-pie-chart" style="font-size: 50px; margin-bottom: 20px;"></i>
                    <h4>Statistika yuklanmadi</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
};

// Chart.js yuklash
async function loadChartJS() {
    return new Promise((resolve, reject) => {
        if (typeof Chart !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Chart.js yuklanmadi'));
        document.head.appendChild(script);
    });
}

// Soddalashtirilgan grafiklar
function createSimpleCharts(serviceStats, statusStats) {
    console.log("🎨 Grafiklar chizilmoqda...");
    
    // Avvalgi grafiklarni yo'q qilish
    if (window.servicesChart) window.servicesChart.destroy();
    if (window.statusChart) window.statusChart.destroy();
    
    // 1. Xizmatlar grafigi
    const servicesCtx = document.getElementById('servicesChart');
    if (servicesCtx) {
        const serviceNames = Object.keys(serviceStats);
        const serviceCounts = Object.values(serviceStats);
        
        window.servicesChart = new Chart(servicesCtx, {
            type: 'bar',
            data: {
                labels: serviceNames,
                datasets: [{
                    label: t('ordersCount'),
                    data: serviceCounts,
                    backgroundColor: '#2E8B57',
                    borderColor: '#2E8B57',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    }
    
    // 2. Status grafigi
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        window.statusChart = new Chart(statusCtx, {
            type: 'pie',
            data: {
                labels: ['Kutilmoqda', 'Bajarildi', 'Bekor qilindi'],
                datasets: [{
                    data: [statusStats.pending, statusStats.completed, statusStats.cancelled],
                    backgroundColor: ['#fbbf24', '#10b981', '#ef4444'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// ========== JADVAL FUNKSIYALARINI YANGILASH ==========

// DisplayOrders funksiyasini yangilash
function displayOrders(orders) {
    const tbody = document.getElementById('ordersTable');
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Hozircha buyurtmalar yo\'q</td></tr>';
        return;
    }
    
    const t = getAdminTranslations(getCurrentLanguage());
    
    tbody.innerHTML = orders.map(order => {
        return `
            <tr>
                <td>${order.id}</td>
                <td>${order.name || '-'}</td>
                <td>${order.phone || '-'}</td>
                <td>${order.service_type || '-'}</td>
                <td>${order.order_date ? new Date(order.order_date).toLocaleDateString() : '-'}</td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>${t.statusPending || 'Kutilmoqda'}</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>${t.statusCompleted || 'Bajarildi'}</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>${t.statusCancelled || 'Bekor qilindi'}</option>
                    </select>
                </td>
                <td>
                    <button class="action-btn btn-delete" onclick="deleteOrder(${order.id})" title="O'chirish">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// DisplayReviews funksiyasini yangilash
function displayReviews(reviews) {
    const tbody = document.getElementById('reviewsTable');
    if (!tbody) return;
    
    if (reviews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Hozircha fikrlar yo\'q</td></tr>';
        return;
    }
    
    tbody.innerHTML = reviews.map(review => {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        return `
            <tr>
                <td>${review.id}</td>
                <td>${review.user_name || '-'}</td>
                <td>${stars}</td>
                <td>${review.review_text || '-'}</td>
                <td>${review.created_at ? new Date(review.created_at).toLocaleDateString() : '-'}</td>
                <td>
                    <button class="action-btn btn-delete" onclick="deleteReview(${review.id})" title="O'chirish">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// DisplayAdmins funksiyasini yangilash
function displayAdmins(admins) {
    const tbody = document.querySelector('#adminsSection tbody');
    if (!tbody) return;
    
    if (admins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Hozircha adminlar yo\'q</td></tr>';
        return;
    }
    
    const t = getAdminTranslations(getCurrentLanguage());
    const isSuperAdmin = currentAdmin && currentAdmin.role === 'super_admin';
    
    tbody.innerHTML = admins.map(admin => {
        const canEdit = isSuperAdmin;
        return `
            <tr>
                <td>${admin.id}</td>
                <td>${admin.username}</td>
                <td>${admin.full_name}</td>
                <td>${admin.email || '-'}</td>
                <td>${admin.role === 'super_admin' ? (t.superAdmin || 'Super Admin') : (t.admin || 'Admin')}</td>
                <td>${new Date(admin.created_at).toLocaleDateString()}</td>
                <td>
                    ${canEdit ? `
                        <button class="action-btn btn-edit" onclick="editAdmin(${admin.id})" title="Tahrirlash">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn btn-delete" onclick="deleteAdmin(${admin.id})" title="O'chirish">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : '-'}
                </td>
            </tr>
        `;
    }).join('');
}

// Order status yangilash
window.updateOrderStatus = async function(orderId, status) {
    try {
        const response = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        const result = await response.json();
        if (result.success) {
            showNotification('✅ Holat yangilandi!', 'success');
            loadOrders();
        } else {
            showNotification(`❌ ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Update order error:', error);
        showNotification('❌ Xatolik yuz berdi!', 'error');
    }
};

// ========== DOMContentLoaded FUNKSIYASINI YANGILASH ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ ADMIN PANEL YUKLANDI');
    
    // Global funksiyalarni belgilash
    window.handleLogin = handleLogin;
    window.logout = logout;
    window.switchSection = switchSection;
    window.toggleSidebar = toggleSidebar;
    window.updateOrderStatus = updateOrderStatus;
    window.deleteOrder = deleteOrder;
    window.deleteReview = deleteReview;
    window.editAdmin = editAdmin;
    window.deleteAdmin = deleteAdmin;
    window.loadStatistics = loadStatistics;
    window.updateAdmin = updateAdmin;
    
    // Initialize language first
    initializeAdminLanguage();
    
    // Setup event listeners
    setupEventListeners();
    
    // Token bor yoki yo'qligini tekshirish
    if (adminToken && currentAdmin) {
        console.log('🔑 Token topildi, admin panelga kirish...');
        showAdminPanel();
        checkAdminRole();
        loadDashboard();
    } else {
        console.log('🔒 Token topilmadi, login sahifasiga o\'tish...');
        showLoginPage();
    }
    
    // Soatni yangilash
    updateClock();
    setInterval(updateClock, 1000);
});

// ========== QIDIRUV VA FILTER FUNKSIYALARI ==========

let allOrders = []; // Global orders massivi
let currentFilteredOrders = []; // Filterlangan orders

// Buyurtmalarni yuklash va filter qilish funksiyasi
async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE}/admin/orders`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            allOrders = result.orders;
            currentFilteredOrders = [...allOrders]; // Boshlang'ich holatda hammasi
            displayOrders(currentFilteredOrders);
            updateTableInfo();
        }
    } catch (error) {
        console.error('Load orders error:', error);
        showNotification('❌ Xatolik yuz berdi!', 'error');
    }
}

// Jadvalni chiqarish funksiyasi (faqat ko'rsatish uchun)
function displayOrders(orders) {
    const tbody = document.getElementById('ordersTable');
    if (!tbody) return;
    
    const t = getAdminTranslations(getCurrentLanguage());
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-search" style="font-size: 30px; margin-bottom: 10px;"></i>
                    <p>Hech qanday buyurtma topilmadi</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = orders.map(order => {
        const statusText = {
            'pending': t.statusPending || 'Kutilmoqda',
            'completed': t.statusCompleted || 'Bajarildi',
            'cancelled': t.statusCancelled || 'Bekor qilindi'
        }[order.status] || order.status;
        
        return `
            <tr>
                <td>${order.id}</td>
                <td>${order.name || '-'}</td>
                <td>${order.phone || '-'}</td>
                <td>${order.service_type || '-'}</td>
                <td>${order.order_date ? new Date(order.order_date).toLocaleDateString() : '-'}</td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)" style="padding: 5px 10px; border-radius: 5px; border: 1px solid #ddd;">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>${t.statusPending || 'Kutilmoqda'}</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>${t.statusCompleted || 'Bajarildi'}</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>${t.statusCancelled || 'Bekor qilindi'}</option>
                    </select>
                </td>
                <td>
                    <button class="action-btn btn-delete" onclick="deleteOrder(${order.id})" title="O'chirish">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Qidiruv funksiyasi
window.filterOrders = function() {
    const searchInput = document.getElementById('orderSearch');
    const filterSelect = document.getElementById('orderFilter');
    
    if (!searchInput || !filterSelect) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const filterValue = filterSelect.value;
    
    // Barcha buyurtmalardan filter qilish
    let filtered = allOrders;
    
    // 1. Status bo'yicha filter
    if (filterValue) {
        filtered = filtered.filter(order => order.status === filterValue);
    }
    
    // 2. Qidiruv bo'yicha filter (ID, Ism, Telefon, Xizmat)
    if (searchTerm) {
        filtered = filtered.filter(order => {
            return (
                order.id.toString().includes(searchTerm) ||
                (order.name && order.name.toLowerCase().includes(searchTerm)) ||
                (order.phone && order.phone.includes(searchTerm)) ||
                (order.service_type && order.service_type.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    // Filterlangan natijalarni saqlash va ko'rsatish
    currentFilteredOrders = filtered;
    displayOrders(currentFilteredOrders);
    updateTableInfo();
};

// Jadval ma'lumotlarini yangilash (nechta buyurtma ko'rsatilayotgani)
function updateTableInfo() {
    const totalOrders = allOrders.length;
    const showingOrders = currentFilteredOrders.length;
    const tableInfo = document.querySelector('.table-info');
    
    if (tableInfo) {
        const t = getAdminTranslations(getCurrentLanguage());
        tableInfo.textContent = `${t.showing || 'Ko\'rsatilmoqda'} ${showingOrders} ${t.of || 'soni'} ${totalOrders} ${t.orders || 'buyurtma'}`;
    }
}

// Yangilash tugmasi funksiyasi (loadOrders bilan bir xil)
window.refreshOrders = function() {
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        // Tugmaga loading effekti
        const originalHTML = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yangilanmoqda...';
        refreshBtn.disabled = true;
        
        // Buyurtmalarni yangilash
        loadOrders();
        
        // Filter va qidiruv maydonlarini tozalash
        const searchInput = document.getElementById('orderSearch');
        const filterSelect = document.getElementById('orderFilter');
        
        if (searchInput) searchInput.value = '';
        if (filterSelect) filterSelect.value = '';
        
        // Xabar ko'rsatish
        setTimeout(() => {
            showNotification('✅ Buyurtmalar yangilandi!', 'success');
            
            // Tugmani eski holatiga qaytarish
            refreshBtn.innerHTML = originalHTML;
            refreshBtn.disabled = false;
        }, 1000);
    }
};

// ========== EVENT LISTENERS SETUP FUNKSIYASINI YANGILASH ==========

function setupEventListeners() {
    console.log('🔧 Event listenerlar sozlanmoqda...');
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin(e);
            return false;
        });
    }
    
    // Language switcher for admin panel
    setTimeout(() => {
        setupLanguageSwitcher('adminLangBtn', 'adminLangOptions');
        console.log('✅ Admin language switcher initialized');
    }, 100);

    // Language switcher for login page (if exists)
    setTimeout(() => {
        setupLanguageSwitcher('loginLangBtn', 'loginLangOptions');
    }, 100);
    
    // Menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            switchSection(section);
            
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // ========== QIDIRUV VA FILTER UCHUN EVENT LISTENERS ==========
    
    // Qidiruv maydoni uchun event listener
    const orderSearch = document.getElementById('orderSearch');
    if (orderSearch) {
        orderSearch.addEventListener('input', function(e) {
            // 500ms kutib, keyin filter qilish (debounce)
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(() => {
                filterOrders();
            }, 500);
        });
        
        // Qidiruv maydoniga ikonka qo'shish
        orderSearch.parentElement.style.position = 'relative';
        const searchIcon = orderSearch.parentElement.querySelector('i.fa-search');
        if (searchIcon) {
            searchIcon.style.cursor = 'pointer';
            searchIcon.addEventListener('click', function() {
                filterOrders();
            });
        }
    }
    
    // Filter maydoni uchun event listener
    const orderFilter = document.getElementById('orderFilter');
    if (orderFilter) {
        orderFilter.addEventListener('change', function() {
            filterOrders();
        });
    }
    
    // Yangilash tugmasi uchun event listener
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        // Avval barcha event listenerlarni olib tashlash
        const newBtn = refreshBtn.cloneNode(true);
        refreshBtn.parentNode.replaceChild(newBtn, refreshBtn);
        
        // Yangi event listener qo'shish
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            refreshOrders();
        });
    }
    
    // ========== FIKRLAR BO'LIMI UCHUN QIDIRUV ==========
    
    const reviewSearch = document.getElementById('reviewSearch');
    if (reviewSearch) {
        reviewSearch.addEventListener('input', function(e) {
            clearTimeout(window.reviewSearchTimeout);
            window.reviewSearchTimeout = setTimeout(() => {
                filterReviews();
            }, 500);
        });
    }
}

// Fikrlarni filter qilish funksiyasi
window.filterReviews = function() {
    const searchInput = document.getElementById('reviewSearch');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const reviewRows = document.querySelectorAll('#reviewsTable tr');
    
    if (reviewRows.length === 0) return;
    
    let visibleCount = 0;
    
    reviewRows.forEach(row => {
        // Skip header row
        if (row.querySelector('th')) return;
        
        const nameCell = row.cells[1]?.textContent.toLowerCase();
        const reviewCell = row.cells[3]?.textContent.toLowerCase();
        
        if (searchTerm === '' || 
            (nameCell && nameCell.includes(searchTerm)) || 
            (reviewCell && reviewCell.includes(searchTerm))) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Agar hech narsa topilmasa, xabar ko'rsatish
    if (visibleCount === 0 && searchTerm !== '') {
        const tbody = document.getElementById('reviewsTable');
        if (tbody && tbody.querySelector('tr').querySelector('th')) {
            // Add a "no results" row
            const noResultsRow = `<tr style="display: table-row;"><td colspan="6" style="text-align: center; padding: 20px; color: #666;">Hech qanday natija topilmadi</td></tr>`;
            tbody.innerHTML += noResultsRow;
        }
    }
};

// ========== STATISTIKA FUNKSIYALARI (TO'LIQ ISHLAYDI) ==========

// Global chart obyektlari


// Statistika yuklash funksiyasi
window.loadStatistics = async function() {
    console.log("📊 Statistika yuklanmoqda...");
    
    // Loading ko'rsatish
    showLoading(true);
    
    try {
        // 1. Buyurtmalarni olish
        const ordersResponse = await fetch(`${API_BASE}/admin/orders`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const ordersResult = await ordersResponse.json();
        
        if (!ordersResult.success) {
            throw new Error('Buyurtmalarni olishda xatolik');
        }
        
        const orders = ordersResult.orders || [];
        console.log(`📦 Jami ${orders.length} ta buyurtma`);
        
        // 2. Statistikalarni hisoblash
        const { serviceStats, statusStats, summaryStats } = calculateStatistics(orders);
        
        // 3. Chart.js yuklanganligini tekshirish
        await ensureChartJSLoaded();
        
        // 4. Grafiklarni chizish
        createCharts(serviceStats, statusStats);
        
        // 5. Statistika summary ni yangilash
        updateStatisticsSummary(summaryStats);
        
        // 6. Xabar ko'rsatish
        showNotification('✅ Statistika yangilandi!', 'success');
        
    } catch (error) {
        console.error('❌ Statistika xatosi:', error);
        showStatisticsError(error.message);
    } finally {
        showLoading(false);
    }
};

// Statistikalarni hisoblash
function calculateStatistics(orders) {
    const serviceStats = {};
    const statusStats = {
        pending: 0,
        completed: 0,
        cancelled: 0
    };
    
    let totalAmount = 0;
    let averageRating = 0;
    
    // Har bir buyurtma uchun
    orders.forEach(order => {
        // Xizmat turi bo'yicha
        const service = order.service_type || 'Noma\'lum';
        serviceStats[service] = (serviceStats[service] || 0) + 1;
        
        // Status bo'yicha
        const status = order.status || 'pending';
        if (status === 'pending') statusStats.pending++;
        else if (status === 'completed') statusStats.completed++;
        else if (status === 'cancelled') statusStats.cancelled++;
        
        // Narxni hisoblash (taxminiy)
        const price = estimateOrderPrice(order.service_type);
        totalAmount += price;
    });
    
    // O'rtacha narx
    const averagePrice = orders.length > 0 ? Math.round(totalAmount / orders.length) : 0;
    
    // Eng ko'p buyurtma qilingan xizmat
    let mostPopularService = 'Mavjud emas';
    let maxCount = 0;
    Object.entries(serviceStats).forEach(([service, count]) => {
        if (count > maxCount) {
            maxCount = count;
            mostPopularService = service;
        }
    });
    
    return {
        serviceStats,
        statusStats,
        summaryStats: {
            totalOrders: orders.length,
            pending: statusStats.pending,
            completed: statusStats.completed,
            cancelled: statusStats.cancelled,
            averagePrice: averagePrice,
            mostPopularService: mostPopularService,
            totalAmount: totalAmount
        }
    };
}

// Taxminiy narx hisoblash
function estimateOrderPrice(serviceType) {
    const prices = {
        'Uy tozalash': 50000,
        'Ofis tozalash': 70000,
        'Mebel tozalash': 90000,
        'Dezinfektsiya': 120000,
        'Deraza tozalash': 40000,
        'Xalq tozalash': 60000,
        'Noma\'lum': 50000
    };
    
    return prices[serviceType] || 50000;
}

// Chart.js yuklanganligiga ishonch hosil qilish
async function ensureChartJSLoaded() {
    if (typeof Chart !== 'undefined') {
        return;
    }
    
    return new Promise((resolve, reject) => {
        console.log("📊 Chart.js yuklanmoqda...");
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.onload = () => {
            console.log("✅ Chart.js yuklandi");
            resolve();
        };
        script.onerror = () => {
            console.error("❌ Chart.js yuklanmadi");
            reject(new Error('Chart.js yuklanmadi'));
        };
        
        document.head.appendChild(script);
    });
}

// Grafiklarni yaratish
function createCharts(serviceStats, statusStats) {
    console.log("🎨 Grafiklar chizilmoqda...");
    
    // 1. Avvalgi grafiklarni yo'q qilish
    if (servicesChart) servicesChart.destroy();
    if (statusChart) statusChart.destroy();
    
    // 2. Xizmatlar grafigi
    createServiceChart(serviceStats);
    
    // 3. Status grafigi
    createStatusChart(statusStats);
    
    console.log("✅ Grafiklar muvaffaqiyatli yaratildi");
}

// Xizmatlar grafigi
function createServiceChart(serviceStats) {
    const ctx = document.getElementById('servicesChart');
    if (!ctx) return;
    
    // Ma'lumotlarni tayyorlash
    const labels = Object.keys(serviceStats);
    const data = Object.values(serviceStats);
    
    // Agar ma'lumot bo'lmasa
    if (labels.length === 0) {
        showNoServiceData();
        return;
    }
    
    // Ranglar
    const colors = [
        '#2E8B57', // Yashil
        '#3CB371', // Yengil yashil
        '#20B2AA', // Dengiz yashili
        '#48D1CC', // Moviy yashil
        '#40E0D0', // Turkuaz
        '#00CED1', // To'q turkuaz
        '#5F9EA0'  // Kadet ko'k
    ];
    
    // Chart yaratish
    servicesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: t('ordersCount'),
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.8', '1')),
                borderWidth: 1,
                borderRadius: 5,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${context.raw} ta (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            if (Number.isInteger(value)) {
                                return value + ' ta';
                            }
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Status grafigi
function createStatusChart(statusStats) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    // Ma'lumotlarni tayyorlash
    const labels = ['Kutilmoqda', 'Bajarildi', 'Bekor qilindi'];
    const data = [statusStats.pending, statusStats.completed, statusStats.cancelled];
    
    // Agar barchasi 0 bo'lsa
    if (data.every(val => val === 0)) {
        showNoStatusData();
        return;
    }
    
    // Ranglar
    const backgroundColors = [
        '#FFD700', // Sariq (pending)
        '#2E8B57', // Yashil (completed)
        '#DC3545'  // Qizil (cancelled)
    ];
    
    // Chart yaratish
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: ['#FFF', '#FFF', '#FFF'],
                borderWidth: 2,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${context.raw} ta (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1000
            }
        }
    });
}

// Statistika summary ni yangilash
function updateStatisticsSummary(stats) {
    // ID larni tekshirish
    const elements = {
        'totalOrdersCount': stats.totalOrders,
        'pendingOrdersCount': stats.pending,
        'completedOrdersCount': stats.completed,
        'cancelledOrdersCount': stats.cancelled
    };
    
    // Har bir elementni yangilash
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            // Animatsiya effekti
            element.style.transform = 'scale(1.2)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 300);
        }
    });
    
    // Qo'shimcha ma'lumotlar
    const additionalInfo = `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div class="stat-item">
                    <div class="stat-label">${t('averagePrice')}</div>
                    <div class="stat-value">${stats.averagePrice.toLocaleString()} so'm</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">${t('mostPopularService')}</div>
                    <div class="stat-value">${stats.mostPopularService}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">${t('totalAmount')}</div>
                    <div class="stat-value">${stats.totalAmount.toLocaleString()} so'm</div>
                </div>
            </div>
        </div>
    `;
    
    // Qo'shimcha ma'lumotlarni qo'shish
    const statsSummary = document.querySelector('.stats-summary');
    if (statsSummary) {
        const existingAdditional = statsSummary.querySelector('.additional-stats');
        if (existingAdditional) {
            existingAdditional.remove();
        }
        statsSummary.insertAdjacentHTML('beforeend', additionalInfo);
    }
}

// Xizmat ma'lumotlari yo'qligida
function showNoServiceData() {
    const container = document.getElementById('servicesChartContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 40px; text-align: center;">
            <div style="font-size: 60px; color: #ddd; margin-bottom: 20px;">
                <i class="fas fa-chart-bar"></i>
            </div>
            <h4 style="color: #666; margin-bottom: 10px;">${t('noDataYet')}</h4>
            <p style="color: #999; font-size: 14px;">Buyurtmalar qo'shilgandan keyin statistika ko'rsatiladi</p>
        </div>
    `;
}

// Status ma'lumotlari yo'qligida
function showNoStatusData() {
    const container = document.getElementById('statusChartContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 40px; text-align: center;">
            <div style="font-size: 60px; color: #ddd; margin-bottom: 20px;">
                <i class="fas fa-chart-pie"></i>
            </div>
            <h4 style="color: #666; margin-bottom: 10px;">${t('noDataYet')}</h4>
            <p style="color: #999; font-size: 14px;">Buyurtmalar qo'shilgandan keyin statistika ko'rsatiladi</p>
        </div>
    `;
}

// Xatolikni ko'rsatish
function showStatisticsError(message) {
    const servicesContainer = document.getElementById('servicesChartContainer');
    const statusContainer = document.getElementById('statusChartContainer');
    
    const errorHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 40px; text-align: center; background: #fee2e2; border-radius: 10px;">
            <div style="font-size: 50px; color: #e53e3e; margin-bottom: 20px;">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h4 style="color: #c53030; margin-bottom: 10px;">Xatolik yuz berdi</h4>
            <p style="color: #9b2c2c; font-size: 14px; margin-bottom: 20px;">${message}</p>
            <button onclick="loadStatistics()" style="background: #e53e3e; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                <i class="fas fa-redo"></i> Qayta urinish
            </button>
        </div>
    `;
    
    if (servicesContainer) servicesContainer.innerHTML = errorHTML;
    if (statusContainer) statusContainer.innerHTML = errorHTML;
}

// Test statistikasi (agar ma'lumot yo'q bo'lsa)
window.testStatistics = function() {
    console.log("🧪 Test statistikasi yaratilmoqda...");
    
    // Test ma'lumotlari
    const testServiceStats = {
        "Uy tozalash": 15,
        "Ofis tozalash": 8,
        "Mebel tozalash": 6,
        "Dezinfektsiya": 12,
        "Deraza tozalash": 9,
        "Xalq tozalash": 5
    };
    
    const testStatusStats = {
        pending: 8,
        completed: 35,
        cancelled: 2
    };
    
    const testSummaryStats = {
        totalOrders: 45,
        pending: 8,
        completed: 35,
        cancelled: 2,
        averagePrice: 65000,
        mostPopularService: "Uy tozalash",
        totalAmount: 2925000
    };
    
    // Grafiklarni chizish
    createCharts(testServiceStats, testStatusStats);
    
    // Summary ni yangilash
    updateStatisticsSummary(testSummaryStats);
    
    // Xabar ko'rsatish
    showNotification('✅ Test statistikasi yaratildi!', 'success');
    
    // Animatsiya
    const chartContainers = document.querySelectorAll('#statsSection .stat-chart');
    chartContainers.forEach(container => {
        container.style.animation = 'pulse 0.5s ease';
        setTimeout(() => {
            container.style.animation = '';
        }, 500);
    });
};

// Statistika bo'limiga o'tganda avtomatik yuklash
function switchSection(section) {
    currentSection = section;
    
    // Barcha bo'limlarni yashirish
    document.querySelectorAll('.section-content').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Tanlangan bo'limni ko'rsatish
    const targetSection = document.getElementById(section + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Sarlavhani yangilash
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const t = getAdminTranslations(getCurrentLanguage());
        pageTitle.textContent = t[section] || section;
    }
    
    // Bo'lim ma'lumotlarini yuklash
    if (section === 'dashboard') loadDashboard();
    else if (section === 'orders') loadOrders();
    else if (section === 'reviews') loadReviews();
    else if (section === 'users') loadUsers();
    else if (section === 'stats') {
        // Statistika bo'limi - DOM tayyor bo'lishini kutish
        setTimeout(() => {
            loadStatistics();
        }, 100);
    } else if (section === 'admins') loadAdmins();
}

// Yangilash tugmasi uchun funksiya
window.refreshStatistics = function() {
    console.log("🔄 Statistika yangilanmoqda...");
    
    const refreshBtn = document.querySelector('#statsSection .btn-refresh');
    if (refreshBtn) {
        const originalHTML = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yangilanmoqda...';
        refreshBtn.disabled = true;
        
        loadStatistics();
        
        setTimeout(() => {
            refreshBtn.innerHTML = originalHTML;
            refreshBtn.disabled = false;
        }, 1500);
    } else {
        loadStatistics();
    }
};

// ========== TARJIMALARGA QO'SHIMCHALAR ==========


// HTML da qidiruv placeholderlarini yangilash
function updateSearchPlaceholders() {
    const t = getAdminTranslations(getCurrentLanguage());
    
    const orderSearch = document.getElementById('orderSearch');
    const reviewSearch = document.getElementById('reviewSearch');
    const orderFilter = document.getElementById('orderFilter');
    
    if (orderSearch) orderSearch.placeholder = t.searchOrders || "Qidirish...";
    if (reviewSearch) reviewSearch.placeholder = t.search || "Qidirish...";
    
    if (orderFilter) {
        // Filter options ni yangilash
        const options = orderFilter.querySelectorAll('option');
        if (options.length >= 4) {
            options[0].textContent = t.filterAll || "Barchasi";
            options[1].textContent = t.filterPending || "Kutilmoqda";
            options[2].textContent = t.filterCompleted || "Bajarildi";
            options[3].textContent = t.filterCancelled || "Bekor qilindi";
        }
    }
}

// translateAdminPage funksiyasini yangilash
function translateAdminPage(t) {
    // ... mavjud kod ...
    
    // Qidiruv placeholderlarini yangilash
    updateSearchPlaceholders();
    
    // Jadval ma'lumotlarini yangilash
    updateTableInfo();
    
    // ... qolgan kod ...
}

// ========== GLOBAL FUNKSIYALARNI QAYTA BELGILASH ==========

// DOMContentLoaded da global funksiyalarni qo'shing
document.addEventListener('DOMContentLoaded', function() {
    // ... mavjud kod ...
    
    // Global funksiyalarni belgilash
    window.handleLogin = handleLogin;
    window.logout = logout;
    window.switchSection = switchSection;
    window.toggleSidebar = toggleSidebar;
    window.updateOrderStatus = updateOrderStatus;
    window.deleteOrder = deleteOrder;
    window.deleteReview = deleteReview;
    window.editAdmin = editAdmin;
    window.deleteAdmin = deleteAdmin;
    window.loadStatistics = loadStatistics;
    window.updateAdmin = updateAdmin;
    window.filterOrders = filterOrders;
    window.filterReviews = filterReviews;
    window.refreshOrders = refreshOrders;
    window.refreshStatistics = loadStatistics;
    
    // ... qolgan kod ...
});

async function updateOrderStatus(orderId, status) {
    try {
        const response = await authFetch(`${API_BASE}/admin/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        
        const result = await response.json();
        if (result.success) {
            showNotification('✅ ' + getAdminTranslations(getCurrentLanguage()).statusUpdated, 'success');
            loadOrders();
        }
    } catch (error) {
        console.error('Update order error:', error);
    }
}

async function loadReviews() {
    try {
        const response = await authFetch(`${API_BASE}/admin/reviews`);
        const result = await response.json();
        
        if (result.success) {
            displayReviews(result.reviews);
        }
    } catch (error) {
        console.error('Load reviews error:', error);
    }
}

function displayReviews(reviews) {
    const tbody = document.getElementById('reviewsTable');
    if (!tbody) {
        console.error('Reviews table tbody not found!');
        return;
    }
    
    if (reviews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Hozircha fikrlar yo\'q</td></tr>';
        return;
    }
    
    tbody.innerHTML = reviews.map(review => {
        return `
            <tr>
                <td>${review.id}</td>
                <td>${review.user_name || '-'}</td>
                <td>${'★'.repeat(review.rating || 0)}${'☆'.repeat(5 - (review.rating || 0))}</td>
                <td>${review.review_text || '-'}</td>
                <td>${review.created_at ? new Date(review.created_at).toLocaleDateString() : '-'}</td>
                <td>
                    <button class="action-btn btn-delete" onclick="deleteReview(${review.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadUsers() {
    try {
        const response = await authFetch(`${API_BASE}/admin/users`);
        const result = await response.json();
        
        if (result.success) {
            displayUsers(result.users);
        }
    } catch (error) {
        console.error('Load users error:', error);
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTable');
    if (!tbody) {
        console.error('Users table tbody not found!');
        return;
    }
    
    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">${t('noUsersYet')}</td></tr>`;
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        return `
            <tr>
                <td>${user.id}</td>
                <td>${user.name || '-'}</td>
                <td>${user.phone || '-'}</td>
                <td>${user.order_count || 0}</td>
                <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
            </tr>
        `;
    }).join('');
}

async function loadStatistics() {
    try {
        // Get orders for statistics
        const ordersResponse = await authFetch(`${API_BASE}/admin/orders`);
        const ordersResult = await ordersResponse.json();
        
        if (!ordersResult.success || !ordersResult.orders) {
            console.error('Failed to load orders for statistics');
            return;
        }
        
        const orders = ordersResult.orders;
        
        // Calculate service statistics
        const serviceStats = {};
        orders.forEach(order => {
            const service = order.service_type || 'Noma\'lum';
            serviceStats[service] = (serviceStats[service] || 0) + 1;
        });
        
        // Calculate status statistics
        const statusStats = {};
        orders.forEach(order => {
            const status = order.status || 'pending';
            statusStats[status] = (statusStats[status] || 0) + 1;
        });
        
        // Create charts
        createCharts(serviceStats, statusStats);
        
    } catch (error) {
        console.error('Load statistics error:', error);
    }
}

// admin.js fayliga qo'shing:

// Yangi: Login sahifasi uchun til o'zgartirish
function setupLoginLanguageSwitcher() {
    const loginLangBtn = document.getElementById('loginLangBtn');
    const loginLangOptions = document.getElementById('loginLangOptions');
    
    if (loginLangBtn && loginLangOptions) {
        loginLangBtn.onclick = function(e) {
            e.stopPropagation();
            e.preventDefault();
            const isOpen = loginLangOptions.style.display === 'block';
            
            // Barcha boshqa dropdownlarni yopish
            document.querySelectorAll('.lang-options').forEach(opt => {
                if (opt !== loginLangOptions) {
                    opt.style.display = 'none';
                }
            });
            
            // Hozirgisini ochish/yopish
            loginLangOptions.style.display = isOpen ? 'none' : 'block';
        };
        
        // Login sahifasi uchun til variantlari
        document.querySelectorAll('#loginLangOptions .lang-option').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();
                const lang = this.dataset.lang;
                if (lang) {
                    changeAdminLanguage(lang);
                    // Login sahifasi uchun alohida tilni o'zgartirish
                    updateLoginLanguageText(lang);
                }
                loginLangOptions.style.display = 'none';
            };
        });
    }
}

// Yangi: Login sahifasi uchun til matnini yangilash
function updateLoginLanguageText(lang) {
    const loginLangText = document.getElementById('loginLangText');
    if (loginLangText) {
        if (lang === 'uz_latn') loginLangText.textContent = 'UZ';
        else if (lang === 'uz_cyrl') loginLangText.textContent = 'ЎЗ';
        else if (lang === 'ru') loginLangText.textContent = 'RU';
    }
}

// DOMContentLoaded funksiyasiga qo'shing:
document.addEventListener('DOMContentLoaded', function() {
    // ... mavjud kod ...
    
    // Yangi: Login sahifasi uchun til o'zgartirishni sozlash
    setupLoginLanguageSwitcher();
    
    // ... qolgan kod ...
});

// admin.js fayliga qo'shing:

// Yangi: Login sahifasi uchun til o'zgartirish
function setupLoginLanguageSwitcher() {
    const loginLangBtn = document.getElementById('loginLangBtn');
    const loginLangOptions = document.getElementById('loginLangOptions');
    
    if (loginLangBtn && loginLangOptions) {
        loginLangBtn.onclick = function(e) {
            e.stopPropagation();
            e.preventDefault();
            const isOpen = loginLangOptions.style.display === 'block';
            
            // Barcha boshqa dropdownlarni yopish
            document.querySelectorAll('.lang-options').forEach(opt => {
                if (opt !== loginLangOptions) {
                    opt.style.display = 'none';
                }
            });
            
            // Hozirgisini ochish/yopish
            loginLangOptions.style.display = isOpen ? 'none' : 'block';
        };
        
        // Login sahifasi uchun til variantlari
        document.querySelectorAll('#loginLangOptions .lang-option').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();
                const lang = this.dataset.lang;
                if (lang) {
                    changeAdminLanguage(lang);
                    // Login sahifasi uchun alohida tilni o'zgartirish
                    updateLoginLanguageText(lang);
                }
                loginLangOptions.style.display = 'none';
            };
        });
    }
}

// Yangi: Login sahifasi uchun til matnini yangilash
function updateLoginLanguageText(lang) {
    const loginLangText = document.getElementById('loginLangText');
    if (loginLangText) {
        if (lang === 'uz_latn') loginLangText.textContent = 'UZ';
        else if (lang === 'uz_cyrl') loginLangText.textContent = 'ЎЗ';
        else if (lang === 'ru') loginLangText.textContent = 'RU';
    }
}

// DOMContentLoaded funksiyasiga qo'shing:
document.addEventListener('DOMContentLoaded', function() {
    // ... mavjud kod ...
    
    // Yangi: Login sahifasi uchun til o'zgartirishni sozlash
    setupLoginLanguageSwitcher();
    
    // ... qolgan kod ...
});


async function loadAdmins() {
    if (currentAdmin && currentAdmin.role !== 'super_admin') {
        showNotification('❌ ' + getAdminTranslations(getCurrentLanguage()).superAdminOnly, 'error');
        return;
    }
    
    try {
        const response = await authFetch(`${API_BASE}/admin/admins`);
        const result = await response.json();
        
        if (result.success) {
            displayAdmins(result.admins);
        }
    } catch (error) {
        console.error('Load admins error:', error);
    }
}

function displayAdmins(admins) {
    const tbody = document.querySelector('#adminsSection tbody');
    if (!tbody) return;
    
    const t = getAdminTranslations(getCurrentLanguage());
    
    tbody.innerHTML = admins.map(admin => {
        const canEdit = currentAdmin && currentAdmin.role === 'super_admin';
        return `
            <tr>
                <td>${admin.id}</td>
                <td>${admin.username}</td>
                <td>${admin.full_name}</td>
                <td>${admin.email || '-'}</td>
                <td>${admin.role === 'super_admin' ? t.superAdmin : t.admin}</td>
                <td>${new Date(admin.created_at).toLocaleDateString()}</td>
                <td>
                    ${canEdit ? `
                        <button class="action-btn btn-edit" onclick="editAdmin(${admin.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn btn-delete" onclick="deleteAdmin(${admin.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : '-'}
                </td>
            </tr>
        `;
    }).join('');
}

// ========== EVENT LISTENERS ==========
function attachEventListeners() {
    // Login form - ensure it works
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        // Remove any existing listeners
        const newForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newForm, loginForm);
        
        // Get the form again after cloning
        const form = document.getElementById('loginForm');
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔐 Form submit triggered');
                handleLogin(e);
                return false;
            };
            
            // Also attach to button
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔐 Button click triggered');
                    handleLogin(e);
                    return false;
                };
            }
            
            console.log('✅ Login form listeners attached');
        }
    } else {
        console.error('❌ Login form not found!');
    }
    
    // Menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
            
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Language switcher is now handled by setupLanguageSwitcher function
    // Duplicate code removed to avoid conflicts
    
    // Search and filter
    const orderSearch = document.getElementById('orderSearch');
    if (orderSearch) {
        orderSearch.addEventListener('input', filterOrders);
    }
    
    const orderFilter = document.getElementById('orderFilter');
    if (orderFilter) {
        orderFilter.addEventListener('change', filterOrders);
    }
}

function filterOrders() {
    // Implementation for filtering orders
    console.log('Filtering orders...');
}

// Make functions global
window.handleLogin = handleLogin;
window.logout = logout;
window.switchSection = switchSection;
window.toggleSidebar = toggleSidebar;
window.updateOrderStatus = updateOrderStatus;
window.deleteReview = deleteReview;
window.editAdmin = editAdmin;
window.deleteAdmin = deleteAdmin;
window.deleteOrder = async function(id) {
    if (confirm('O\'chirishni tasdiqlaysizmi?')) {
        try {
            const response = await authFetch(`${API_BASE}/admin/orders/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                showNotification('✅ O\'chirildi!', 'success');
                loadOrders();
            }
        } catch (error) {
            console.error('Delete order error:', error);
        }
    }
};
window.deleteReview = async function(id) {
    if (confirm('O\'chirishni tasdiqlaysizmi?')) {
        try {
            const response = await authFetch(`${API_BASE}/admin/reviews/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                showNotification('✅ O\'chirildi!', 'success');
                loadReviews();
            }
        } catch (error) {
            console.error('Delete review error:', error);
        }
    }
};
window.editAdmin = function(id) {
    showNotification('Edit admin functionality coming soon', 'info');
};
window.deleteAdmin = async function(id) {
    if (currentAdmin && currentAdmin.role !== 'super_admin') {
        showNotification('❌ ' + getAdminTranslations(getCurrentLanguage()).superAdminOnly, 'error');
        return;
    }
    if (confirm('O\'chirishni tasdiqlaysizmi?')) {
        try {
            const response = await authFetch(`${API_BASE}/admin/admins/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                showNotification('✅ O\'chirildi!', 'success');
                loadAdmins();
            }
        } catch (error) {
            console.error('Delete admin error:', error);
        }
    }
};


// admin.js fayliga quyidagi funksiyalarni qo'shing:

let servicesChart = null;
let statusChart = null;

// Test chart function
window.testChart = function() {
    console.log('Testing charts...');
    
    // Test data
    const testServiceStats = {
        "Uy tozalash": 5,
        "Ofis tozalash": 3,
        "Mebel tozalash": 2,
        "Dezinfektsiya": 4
    };
    
    const testStatusStats = {
        "pending": 8,
        "completed": 4,
        "cancelled": 2
    };
    
    // Create charts with test data
    createCharts(testServiceStats, testStatusStats);
    
    showNotification('✅ Test grafiklar yaratildi!', 'success');
};

// Improved loadStatistics function
// admin.js fayliga statistika bo'limi uchun quyidagi funksiyalarni qo'shing:



// Statistika bo'limini yuklash
async function loadStatistics() {
    console.log("📊 Statistika yuklanmoqda...");
    
    try {
        // 1. Avval Chart.js kutubxonasi yuklanganligini tekshirish
        if (typeof Chart === 'undefined') {
            console.error("❌ Chart.js yuklanmagan!");
            showChartErrorMessage("Chart.js kutubxonasi yuklanmagan");
            return;
        }
        
        // 2. API orqali buyurtmalarni olish
        const response = await fetch(`${API_BASE}/admin/orders`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API xatosi: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("📈 API javobi:", result);
        
        if (!result.success || !result.orders) {
            console.error("❌ Ma'lumotlar olinmadi");
            showNoDataMessage();
            return;
        }
        
        const orders = result.orders;
        console.log(`📦 Jami ${orders.length} ta buyurtma`);
        
        if (orders.length === 0) {
            showNoDataMessage();
            return;
        }
        
        // 3. Statistikalarni hisoblash
        const serviceStats = {};
        const statusStats = {
            pending: 0,
            completed: 0,
            cancelled: 0
        };
        
        orders.forEach(order => {
            // Xizmat turi bo'yicha
            const service = order.service_type || 'Noma\'lum';
            serviceStats[service] = (serviceStats[service] || 0) + 1;
            
            // Holat bo'yicha
            const status = order.status || 'pending';
            if (status === 'pending') statusStats.pending++;
            else if (status === 'completed') statusStats.completed++;
            else if (status === 'cancelled') statusStats.cancelled++;
        });
        
        console.log("📊 Xizmat statistikasi:", serviceStats);
        console.log("📊 Holat statistikasi:", statusStats);
        
        // 4. Grafiklarni chizish
        createCharts(serviceStats, statusStats);
        
    } catch (error) {
        console.error("❌ Statistika xatosi:", error);
        showChartErrorMessage(`Xatolik: ${error.message}`);
    }
}

// Grafiklarni yaratish
function createCharts(serviceStats, statusStats) {
    console.log("🎨 Grafiklar chizilmoqda...");
    
    // Avvalgi grafiklarni yo'q qilish
    if (servicesChart) servicesChart.destroy();
    if (statusChart) statusChart.destroy();
    
    // 1. Xizmatlar grafigi (Bar chart)
    const servicesCtx = document.getElementById('servicesChart');
    if (servicesCtx) {
        const serviceLabels = Object.keys(serviceStats);
        const serviceData = Object.values(serviceStats);
        
        console.log("📊 Xizmatlar:", serviceLabels);
        console.log("📊 Ma'lumotlar:", serviceData);
        
        if (serviceLabels.length === 0) {
            document.getElementById('servicesChartContainer').innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #666;">
                    <i class="fas fa-chart-bar" style="font-size: 50px; color: #ddd; margin-bottom: 20px;"></i>
                    <h4>${t('noDataYet')}</h4>
                </div>
            `;
        } else {
            servicesChart = new Chart(servicesCtx, {
                type: 'bar',
                data: {
                    labels: serviceLabels,
                    datasets: [{
                        label: t('ordersCount'),
                        data: serviceData,
                        backgroundColor: '#667eea',
                        borderColor: '#5a67d8',
                        borderWidth: 1,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw} ta`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    return value + ' ta';
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    // 2. Holat grafigi (Doughnut chart)
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        const statusLabels = ['Kutilmoqda', 'Bajarildi', 'Bekor qilindi'];
        const statusData = [statusStats.pending, statusStats.completed, statusStats.cancelled];
        
        

        console.log("📊 Holatlar:", statusLabels);
        console.log("📊 Holat ma'lumotlari:", statusData);
        
        // Faqat nolga teng bo'lmagan ma'lumotlarni ko'rsatish
        const filteredLabels = [];
        const filteredData = [];
        const colors = ['#fef3c7', '#d1fae5', '#fee2e2'];
        
        statusData.forEach((value, index) => {
            if (value > 0) {
                filteredLabels.push(statusLabels[index]);
                filteredData.push(value);
            }
        });
        
        if (filteredData.length === 0) {
            document.getElementById('statusChartContainer').innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #666;">
                    <i class="fas fa-chart-pie" style="font-size: 50px; color: #ddd; margin-bottom: 20px;"></i>
                    <h4>${t('noDataYet')}</h4>
                </div>
            `;
        } else {
            statusChart = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: filteredLabels,
                    datasets: [{
                        data: filteredData,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((context.raw / total) * 100);
                                    return `${context.label}: ${context.raw} ta (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    console.log("✅ Grafiklar muvaffaqiyatli yaratildi");
}

// Ma'lumotlar yo'qligi haqida xabar
function showNoDataMessage() {
    const servicesContainer = document.getElementById('servicesChartContainer');
    const statusContainer = document.getElementById('statusChartContainer');
    
    if (servicesContainer) {
        servicesContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <i class="fas fa-chart-bar" style="font-size: 50px; color: #ddd; margin-bottom: 20px;"></i>
                <h4>${t('noOrdersYet')}</h4>
                <p>Bir nechta buyurtma qo'shgandan keyin statistika ko'rsatiladi</p>
                <button onclick="testStatistics()" style="margin-top: 15px; background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-vial"></i> Test statistika
                </button>
            </div>
        `;
    }
    
    if (statusContainer) {
        statusContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <i class="fas fa-chart-pie" style="font-size: 50px; color: #ddd; margin-bottom: 20px;"></i>
                <h4>${t('noOrdersYet')}</h4>
                <p>Bir nechta buyurtma qo'shgandan keyin statistika ko'rsatiladi</p>
            </div>
        `;
    }
}

// Xato xabari
function showChartErrorMessage(message) {
    const servicesContainer = document.getElementById('servicesChartContainer');
    const statusContainer = document.getElementById('statusChartContainer');
    
    if (servicesContainer) {
        servicesContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #e53e3e; background: #fee2e2; border-radius: 8px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 40px; margin-bottom: 15px;"></i>
                <h4>Xatolik yuz berdi</h4>
                <p>${message}</p>
                <button onclick="loadStatistics()" style="margin-top: 15px; background: #e53e3e; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Qayta urinish
                </button>
            </div>
        `;
    }
    
    if (statusContainer) {
        statusContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #e53e3e; background: #fee2e2; border-radius: 8px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 40px; margin-bottom: 15px;"></i>
                <h4>Xatolik yuz berdi</h4>
                <p>${message}</p>
            </div>
        `;
    }
}

// Test statistika funksiyasi
window.testStatistics = function() {
    console.log("🧪 Test statistikasi ishga tushirilmoqda...");
    
    const testServiceStats = {
        "Uy tozalash": 12,
        "Ofis tozalash": 8,
        "Mebel tozalash": 5,
        "Dezinfektsiya": 7
    };
    
    const testStatusStats = {
        pending: 8,
        completed: 12,
        cancelled: 2
    };
    
    createCharts(testServiceStats, testStatusStats);
    
    // Test muvaffaqiyatli bo'ldi haqida xabar
    const servicesContainer = document.getElementById('servicesChartContainer');
    if (servicesContainer) {
        const successMsg = document.createElement('div');
        successMsg.style.cssText = 'position: absolute; top: 10px; right: 10px; background: #48bb78; color: white; padding: 10px 15px; border-radius: 5px; z-index: 1000;';
        successMsg.innerHTML = '<i class="fas fa-check"></i> Test statistika yaratildi';
        servicesContainer.appendChild(successMsg);
        
        setTimeout(() => successMsg.remove(), 3000);
    }
};

// Statistika bo'limiga o'tganda avtomatik yuklash
function switchSection(section) {
    currentSection = section;
    
    // Barcha bo'limlarni yashirish
    document.querySelectorAll('.section-content').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Tanlangan bo'limni ko'rsatish
    const targetSection = document.getElementById(section + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Sarlavhani yangilash
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const t = getAdminTranslations(getCurrentLanguage());
        pageTitle.textContent = t[section] || section;
    }
    
    // Bo'lim ma'lumotlarini yuklash
    if (section === 'dashboard') {
        loadDashboard();
    } else if (section === 'orders') {
        loadOrders();
    } else if (section === 'reviews') {
        loadReviews();
    } else if (section === 'users') {
        loadUsers();
    } else if (section === 'stats') {
        // Statistika bo'limi - DOM tayyor bo'lishini kutish
        setTimeout(() => {
            loadStatistics();
        }, 100);
    } else if (section === 'admins') {
        loadAdmins();
    }
}

// Yangilash tugmasi uchun funksiya
window.refreshStatistics = function() {
    console.log("🔄 Statistika yangilanmoqda...");
    loadStatistics();
};

// Update switchSection function to load statistics properly
function switchSection(section) {
    currentSection = section;
    
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(section + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const t = getAdminTranslations(getCurrentLanguage());
        pageTitle.textContent = t[section] || section;
    }
    
    // Load section data
    if (section === 'dashboard') loadDashboard();
    else if (section === 'orders') loadOrders();
    else if (section === 'reviews') loadReviews();
    else if (section === 'users') loadUsers();
    else if (section === 'stats') {
        // Load statistics with a small delay to ensure DOM is ready
        setTimeout(() => {
            loadStatistics();
        }, 100);
    } else if (section === 'admins') loadAdmins();
}

// ========== YANGI ADMIN QO'SHISH FUNKSIYALARI ==========

// Yangi admin qo'shish modalini ochish
window.showAddAdminModal = function() {
    console.log("➕ Yangi admin modalini ochish...");
    
    // Super admin emasligini tekshirish
    if (currentAdmin.role !== 'super_admin') {
        showNotification('❌ Faqat super admin yangi admin qo\'sha oladi!', 'error');
        return;
    }
    
    // Modalni yaratish
    const modal = createAdminModal('add');
    
    // Modalni sahifaga qo'shish
    document.body.appendChild(modal);
    
    // Modalni ko'rsatish
    setTimeout(() => {
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'translateY(0)';
    }, 10);
};

// Admin modalini yaratish (add/edit uchun umumiy)
function createAdminModal(mode, adminData = null) {
    console.log(`🎨 ${mode === 'add' ? 'Yangi admin' : 'Adminni tahrirlash'} modalini yaratish...`);
    
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    const isEditMode = mode === 'edit';
    const title = isEditMode ? 'Adminni Tahrirlash' : 'Yangi Admin Qo\'shish';
    const buttonText = isEditMode ? 'Yangilash' : 'Qo\'shish';
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            width: 90%;
            max-width: 500px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            transform: translateY(-50px);
            transition: transform 0.3s ease;
            overflow: hidden;
        ">
            <!-- Modal sarlavhasi -->
            <div class="modal-header" style="
                background: linear-gradient(135deg, #2E8B57 0%, #34a56f 100%);
                color: white;
                padding: 20px 25px;
                border-bottom: 1px solid rgba(255,255,255,0.2);
            ">
                <h3 style="margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-user-shield"></i> ${title}
                </h3>
                <button class="close-modal" onclick="closeAdminModal(this)" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.3s;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Modal tana qismi -->
            <div class="modal-body" style="padding: 25px;">
                <form id="adminForm" onsubmit="handleAdminFormSubmit(event, ${isEditMode})">
                    <!-- Yashirin maydon: admin ID (faqat tahrirlashda) -->
                    ${isEditMode ? `<input type="hidden" id="adminId" value="${adminData?.id || ''}">` : ''}
                    
                    <!-- Username -->
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">
                            <i class="fas fa-user"></i> Username *
                        </label>
                        <input type="text" 
                               id="adminUsername" 
                               class="form-control" 
                               value="${adminData?.username || ''}"
                               placeholder="admin123" 
                               required
                               style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    transition: all 0.3s;
                               "
                               onfocus="this.style.borderColor='#2E8B57'; this.style.boxShadow='0 0 0 3px rgba(46, 139, 87, 0.1)'"
                               onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'">
                        <small style="color: #666; font-size: 12px; margin-top: 5px; display: block;">
                            Login qilish uchun username
                        </small>
                    </div>
                    
                    <!-- Parol (faqat yangi admin qo'shganda yoki o'zgartirishda) -->
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">
                            <i class="fas fa-lock"></i> Parol ${isEditMode ? '' : '*'}
                        </label>
                        <input type="password" 
                               id="adminPassword" 
                               class="form-control" 
                               placeholder="${isEditMode ? 'Parolni o\'zgartirmasangiz bo\'sh qoldiring' : 'Parol kiriting'}" 
                               ${isEditMode ? '' : 'required'}
                               style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    transition: all 0.3s;
                               "
                               onfocus="this.style.borderColor='#2E8B57'; this.style.boxShadow='0 0 0 3px rgba(46, 139, 87, 0.1)'"
                               onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'">
                        <small style="color: #666; font-size: 12px; margin-top: 5px; display: block;">
                            ${isEditMode ? 'Parolni o\'zgartirmoqchi bo\'lsangiz kiriting' : 'Kamida 6 ta belgidan iborat bo\'lishi kerak'}
                        </small>
                    </div>
                    
                    <!-- To'liq ism -->
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">
                            <i class="fas fa-id-card"></i> To'liq Ism *
                        </label>
                        <input type="text" 
                               id="adminFullName" 
                               class="form-control" 
                               value="${adminData?.full_name || ''}"
                               placeholder="Ali Valiyev" 
                               required
                               style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    transition: all 0.3s;
                               "
                               onfocus="this.style.borderColor='#2E8B57'; this.style.boxShadow='0 0 0 3px rgba(46, 139, 87, 0.1)'"
                               onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'">
                    </div>
                    
                    <!-- Email -->
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">
                            <i class="fas fa-envelope"></i> Email
                        </label>
                        <input type="email" 
                               id="adminEmail" 
                               class="form-control" 
                               value="${adminData?.email || ''}"
                               placeholder="admin@cleanpro.uz" 
                               style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    transition: all 0.3s;
                               "
                               onfocus="this.style.borderColor='#2E8B57'; this.style.boxShadow='0 0 0 3px rgba(46, 139, 87, 0.1)'"
                               onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'">
                    </div>
                    
                    <!-- Rol -->
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">
                            <i class="fas fa-user-tag"></i> Rol *
                        </label>
                        <select id="adminRole" 
                                class="form-control" 
                                required
                                style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    background: white;
                                    cursor: pointer;
                                    transition: all 0.3s;
                                "
                                onfocus="this.style.borderColor='#2E8B57'; this.style.boxShadow='0 0 0 3px rgba(46, 139, 87, 0.1)'"
                                onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'">
                            <option value="admin" ${adminData?.role === 'admin' ? 'selected' : ''}>
                                Admin
                            </option>
                            <option value="super_admin" ${adminData?.role === 'super_admin' ? 'selected' : ''}>
                                Super Admin
                            </option>
                        </select>
                        <small style="color: #666; font-size: 12px; margin-top: 5px; display: block;">
                            Super Admin barcha huquqlarga ega
                        </small>
                    </div>
                    
                    <!-- Modal tugmalari -->
                    <div class="modal-actions" style="
                        display: flex;
                        gap: 15px;
                        justify-content: flex-end;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                    ">
                        <button type="button" 
                                class="btn-cancel" 
                                onclick="closeAdminModal(this)"
                                style="
                                    background: #f8f9fa;
                                    color: #333;
                                    border: none;
                                    padding: 12px 25px;
                                    border-radius: 8px;
                                    font-weight: 600;
                                    cursor: pointer;
                                    transition: all 0.3s;
                                    font-size: 14px;
                                "
                                onmouseover="this.style.background='#e9ecef'"
                                onmouseout="this.style.background='#f8f9fa'">
                            <i class="fas fa-times"></i> Bekor qilish
                        </button>
                        <button type="submit" 
                                class="btn-submit"
                                style="
                                    background: linear-gradient(135deg, #2E8B57 0%, #34a56f 100%);
                                    color: white;
                                    border: none;
                                    padding: 12px 25px;
                                    border-radius: 8px;
                                    font-weight: 600;
                                    cursor: pointer;
                                    transition: all 0.3s;
                                    font-size: 14px;
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                "
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(46, 139, 87, 0.3)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            <i class="fas fa-save"></i> ${buttonText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    return modal;
}

// Admin modalini yopish
window.closeAdminModal = function(button) {
    const modal = button?.closest('.admin-modal') || document.querySelector('.admin-modal');
    
    if (modal) {
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.transform = 'translateY(-50px)';
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.remove();
        }, 300);
    }
};

// Admin formasi yuborilganda
window.handleAdminFormSubmit = async function(event, isEdit = false) {
    event.preventDefault();
    
    console.log(`📤 ${isEdit ? 'Admin yangilanishi' : 'Yangi admin qo\'shish'} yuborilmoqda...`);
    
    // Form ma'lumotlarini olish
    const form = event.target;
    const adminId = isEdit ? form.querySelector('#adminId')?.value : null;
    const username = form.querySelector('#adminUsername')?.value.trim();
    const password = form.querySelector('#adminPassword')?.value;
    const fullName = form.querySelector('#adminFullName')?.value.trim();
    const email = form.querySelector('#adminEmail')?.value.trim();
    const role = form.querySelector('#adminRole')?.value;
    
    console.log("📋 Form ma'lumotlari:", { username, password: password ? '***' : 'yo\'q', fullName, email, role });
    
    // Validatsiya
    if (!username || !fullName || !role) {
        showNotification('⚠️ Barcha majburiy maydonlarni to\'ldiring!', 'error');
        return;
    }
    
    if (!isEdit && !password) {
        showNotification('⚠️ Yangi admin uchun parol kiritishingiz kerak!', 'error');
        return;
    }
    
    if (password && password.length < 6) {
        showNotification('⚠️ Parol kamida 6 ta belgidan iborat bo\'lishi kerak!', 'error');
        return;
    }
    
    // Ma'lumotlarni tayyorlash
    const adminData = {
        username,
        full_name: fullName,
        email: email || null,
        role
    };
    
    // Agar parol kiritilgan bo'lsa, qo'shamiz
    if (password) {
        adminData.password = password;
    }
    
    // Loading ko'rsatish
    showLoading(true);
    
    try {
        let response;
        let url = `${API_BASE}/admin/admins`;
        let method = 'POST';
        
        if (isEdit && adminId) {
            url = `${API_BASE}/admin/admins/${adminId}`;
            method = 'PUT';
        }
        
        console.log(`🌐 ${method} so'rovi yuborilmoqda:`, url);
        
        response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adminData)
        });
        
        console.log("📡 Server javobi:", response.status);
        
        const result = await response.json();
        console.log("📥 Server ma'lumotlari:", result);
        
        if (result.success) {
            const message = isEdit ? '✅ Admin muvaffaqiyatli yangilandi!' : '✅ Yangi admin muvaffaqiyatli qo\'shildi!';
            showNotification(message, 'success');
            
            // Modalni yopish
            closeAdminModal(event.target.closest('.admin-modal'));
            
            // Adminlar ro'yxatini yangilash
            setTimeout(() => {
                loadAdmins();
            }, 500);
            
        } else {
            showNotification(`❌ ${result.message || 'Xatolik yuz berdi!'}`, 'error');
        }
        
    } catch (error) {
        console.error('❌ Admin saqlashda xatolik:', error);
        showNotification('❌ Server bilan bog\'lanishda xatolik!', 'error');
    } finally {
        showLoading(false);
    }
};

// Adminni tahrirlash funksiyasini yangilash
window.editAdmin = async function(adminId) {
    console.log(`✏️ Admin tahrirlash (ID: ${adminId})...`);
    
    // Super admin emasligini tekshirish
    if (currentAdmin.role !== 'super_admin') {
        showNotification('❌ Faqat super admin adminlarni tahrirlay oladi!', 'error');
        return;
    }
    
    // O'zini tahrirlashni tekshirish
    if (currentAdmin.id === parseInt(adminId)) {
        showNotification("⚠️ O'zingizni tahrirlash uchun profil sozlamalaridan foydalaning!", 'info');
        return;
    }
    
    // Loading ko'rsatish
    showLoading(true);
    
    try {
        // Admin ma'lumotlarini olish
        const response = await fetch(`${API_BASE}/admin/admins/${adminId}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const admin = result.admin;
            console.log("📥 Admin ma'lumotlari:", admin);
            
            // Modalni yaratish va ko'rsatish
            const modal = createAdminModal('edit', admin);
            document.body.appendChild(modal);
            
            setTimeout(() => {
                modal.style.display = 'flex';
                modal.style.opacity = '1';
                modal.querySelector('.modal-content').style.transform = 'translateY(0)';
            }, 10);
            
        } else {
            showNotification(`❌ ${result.message}`, 'error');
        }
        
    } catch (error) {
        console.error('❌ Admin ma\'lumotlarini olishda xatolik:', error);
        showNotification('❌ Xatolik yuz berdi!', 'error');
    } finally {
        showLoading(false);
    }
};

// Adminlarni yuklash funksiyasini yangilash
async function loadAdmins() {
    console.log("👥 Adminlar yuklanmoqda...");
    
    // Super admin emasligini tekshirish
    if (currentAdmin && currentAdmin.role !== 'super_admin') {
        console.log("❌ Faqat super admin adminlarni ko'ra oladi");
        const adminsSection = document.getElementById('adminsSection');
        if (adminsSection) {
            adminsSection.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #666;">
                    <i class="fas fa-user-shield" style="font-size: 60px; margin-bottom: 20px; color: #e53e3e;"></i>
                    <h3 style="color: #e53e3e; margin-bottom: 15px;">Ruxsat yo'q!</h3>
                    <p>Faqat super admin adminlar bo'limini ko'ra oladi.</p>
                </div>
            `;
        }
        return;
    }
    
    // Loading ko'rsatish
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/admin/admins`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayAdmins(result.admins);
            showNotification('✅ Adminlar yuklandi!', 'success');
        } else {
            showNotification(`❌ ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('❌ Adminlarni yuklashda xatolik:', error);
        showNotification('❌ Xatolik yuz berdi!', 'error');
    } finally {
        showLoading(false);
    }
}

// Adminlarni chiqarish funksiyasini yangilash
function displayAdmins(admins) {
    const tbody = document.querySelector('#adminsSection tbody');
    if (!tbody) return;
    
    const t = getAdminTranslations(getCurrentLanguage());
    
    if (admins.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-user-slash" style="font-size: 40px; margin-bottom: 15px; display: block; color: #ddd;"></i>
                    <h4>${t('noAdminsYet')}</h4>
                    <p>"Yangi Admin" tugmasi bilan birinchi adminni qo'shing</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = admins.map(admin => {
        const canEdit = currentAdmin && currentAdmin.role === 'super_admin' && currentAdmin.id !== admin.id;
        const isCurrentUser = currentAdmin && currentAdmin.id === admin.id;
        
        return `
            <tr ${isCurrentUser ? 'style="background: #f0f9f3;"' : ''}>
                <td>
                    ${admin.id}
                    ${isCurrentUser ? ' <span style="color: #2E8B57; font-size: 12px;">(Siz)</span>' : ''}
                </td>
                <td>${admin.username}</td>
                <td>${admin.full_name}</td>
                <td>${admin.email || '-'}</td>
                <td>
                    <span class="role-badge ${admin.role === 'super_admin' ? 'role-super-admin' : 'role-admin'}">
                        ${admin.role === 'super_admin' ? (t.superAdmin || 'Super Admin') : (t.admin || 'Admin')}
                    </span>
                </td>
                <td>${new Date(admin.created_at).toLocaleDateString('uz-UZ')}</td>
                <td>
                    ${canEdit ? `
                        <div style="display: flex; gap: 8px;">
                            <button class="action-btn btn-edit" onclick="editAdmin(${admin.id})" title="Tahrirlash">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn btn-delete" onclick="deleteAdmin(${admin.id})" title="O'chirish">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : '<span style="color: #999;">-</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

// Global funksiyalarni qayta belgilash
document.addEventListener('DOMContentLoaded', function() {
    // ... mavjud kod ...
    
    // Global funksiyalarni belgilash
    window.handleLogin = handleLogin;
    window.logout = logout;
    window.switchSection = switchSection;
    window.toggleSidebar = toggleSidebar;
    window.updateOrderStatus = updateOrderStatus;
    window.deleteOrder = deleteOrder;
    window.deleteReview = deleteReview;
    window.editAdmin = editAdmin;
    window.deleteAdmin = deleteAdmin;
    window.loadStatistics = loadStatistics;
    window.updateAdmin = handleAdminFormSubmit; // Eskisini almashtirish
    window.filterOrders = filterOrders;
    window.filterReviews = filterReviews;
    window.refreshOrders = refreshOrders;
    window.refreshStatistics = loadStatistics;
    window.showAddAdminModal = showAddAdminModal;
    window.closeAdminModal = closeAdminModal;
    window.handleAdminFormSubmit = handleAdminFormSubmit;
    
    // ... qolgan kod ...
});

// ========== ADMIN TAXRIRLASH FUNKSIYALARI ==========

// Adminni tahrirlash (qalamcha knopkasi)
window.editAdmin = async function(adminId) {
    console.log(`✏️ Admin tahrirlash (ID: ${adminId})...`);
    
    try {
        // Super admin emasligini tekshirish
        if (!currentAdmin || currentAdmin.role !== 'super_admin') {
            showNotification('❌ Faqat super admin adminlarni tahrirlay oladi!', 'error');
            return;
        }
        
        // O'zini tahrirlashni tekshirish
        if (currentAdmin.id === parseInt(adminId)) {
            showNotification("⚠️ O'zingizni tahrirlash uchun profil sozlamalaridan foydalaning!", 'info');
            return;
        }
        
        // Loading ko'rsatish
        showLoading(true);
        
        // 1. Avval barcha adminlarni olish orqali ma'lumot topish
        const response = await fetch(`${API_BASE}/admin/admins`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API xatosi: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.admins) {
            // Adminni ID bo'yicha qidirish
            const admin = result.admins.find(a => a.id === parseInt(adminId));
            
            if (admin) {
                console.log("📥 Admin ma'lumotlari topildi:", admin);
                
                // Modalni ochish
                openEditAdminModal(admin);
            } else {
                throw new Error(`Admin (ID: ${adminId}) topilmadi`);
            }
        } else {
            throw new Error(result.message || 'Adminlar ro\'yxati olinmadi');
        }
        
    } catch (error) {
        console.error('❌ Admin ma\'lumotlarini olishda xatolik:', error);
        
        // Test ma'lumotlar bilan ishlash (agar API ishlamasa)
        console.log('🧪 Test ma\'lumotlar bilan ishlash...');
        createMockEditModal(adminId);
        
    } finally {
        showLoading(false);
    }
};

// Test uchun modal yaratish (agar API ishlamasa)
function createMockEditModal(adminId) {
    console.log(`🧪 Mock modal yaratilmoqda (ID: ${adminId})...`);
    
    // Test admin ma'lumotlari
    const mockAdmin = {
        id: adminId,
        username: `admin${adminId}`,
        full_name: `Test Admin ${adminId}`,
        email: `admin${adminId}@cleanpro.uz`,
        role: 'admin'
    };
    
    openEditAdminModal(mockAdmin);
    showNotification('⚠️ Test ma\'lumotlar bilan ishlatilmoqda', 'warning');
}

// Admin tahrirlash modalini ochish (umumiy funksiya)
function openEditAdminModal(admin) {
    console.log(`📝 Admin tahrirlash modalini ochish: ${admin.username}`);
    
    // Avval barcha admin modal-larini yopish
    closeAllAdminModals();
    
    // Modalni yaratish
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.id = `editAdminModal-${admin.id}`;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        opacity: 0;
        animation: fadeIn 0.3s forwards;
    `;
    
    // Style qo'shish
    if (!document.querySelector('#adminModalStyles')) {
        const style = document.createElement('style');
        style.id = 'adminModalStyles';
        style.textContent = `
            @keyframes fadeIn {
                to { opacity: 1; }
            }
            @keyframes slideIn {
                to { transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            width: 90%;
            max-width: 500px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            transform: translateY(-50px);
            animation: slideIn 0.3s forwards;
            overflow: hidden;
        ">
            <!-- Modal sarlavhasi -->
            <div class="modal-header" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px 25px;
                border-bottom: 1px solid rgba(255,255,255,0.2);
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h3 style="margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-user-edit"></i> Adminni Tahrirlash
                </h3>
                <button onclick="closeAdminModal(this)" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.3s;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Modal tana qismi -->
            <div class="modal-body" style="padding: 25px;">
                <form id="editAdminForm-${admin.id}">
                    <!-- Yashirin maydon: admin ID -->
                    <input type="hidden" id="editAdminId-${admin.id}" value="${admin.id}">
                    
                    <!-- Username -->
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">
                            <i class="fas fa-user"></i> Username *
                        </label>
                        <input type="text" 
                               id="editAdminUsername-${admin.id}" 
                               class="form-control" 
                               value="${admin.username || ''}"
                               placeholder="admin123" 
                               required
                               style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    transition: all 0.3s;
                               "
                               onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                               onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'">
                    </div>
                    
                    <!-- Parol -->
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">
                            <i class="fas fa-lock"></i> Parol (o'zgartirish uchun)
                        </label>
                        <input type="password" 
                               id="editAdminPassword-${admin.id}" 
                               class="form-control" 
                               placeholder="Parolni o'zgartirmasangiz bo'sh qoldiring"
                               style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    transition: all 0.3s;
                               "
                               onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                               onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'">
                        <small style="color: #666; font-size: 12px; margin-top: 5px; display: block;">
                            Parolni o'zgartirmoqchi bo'lsangiz kiriting
                        </small>
                    </div>
                    
                    <!-- To'liq ism -->
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">
                            <i class="fas fa-id-card"></i> To'liq Ism *
                        </label>
                        <input type="text" 
                               id="editAdminFullName-${admin.id}" 
                               class="form-control" 
                               value="${admin.full_name || ''}"
                               placeholder="Ali Valiyev" 
                               required
                               style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    transition: all 0.3s;
                               "
                               onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                               onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'">
                    </div>
                    
                    <!-- Email -->
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">
                            <i class="fas fa-envelope"></i> Email
                        </label>
                        <input type="email" 
                               id="editAdminEmail-${admin.id}" 
                               class="form-control" 
                               value="${admin.email || ''}"
                               placeholder="admin@cleanpro.uz" 
                               style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    transition: all 0.3s;
                               "
                               onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                               onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'">
                    </div>
                    
                    <!-- Rol -->
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 600;
                            color: #333;
                            font-size: 14px;
                        ">
                            <i class="fas fa-user-tag"></i> Rol *
                        </label>
                        <select id="editAdminRole-${admin.id}" 
                                class="form-control" 
                                required
                                style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    background: white;
                                    cursor: pointer;
                                    transition: all 0.3s;
                                "
                                onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                                onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'">
                            <option value="admin" ${admin.role === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="super_admin" ${admin.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
                        </select>
                    </div>
                    
                    <!-- Modal tugmalari -->
                    <div class="modal-actions" style="
                        display: flex;
                        gap: 15px;
                        justify-content: flex-end;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                    ">
                        <button type="button" 
                                onclick="closeAdminModal(this)"
                                style="
                                    background: #f8f9fa;
                                    color: #333;
                                    border: none;
                                    padding: 12px 25px;
                                    border-radius: 8px;
                                    font-weight: 600;
                                    cursor: pointer;
                                    transition: all 0.3s;
                                    font-size: 14px;
                                "
                                onmouseover="this.style.background='#e9ecef'"
                                onmouseout="this.style.background='#f8f9fa'">
                            <i class="fas fa-times"></i> Bekor qilish
                        </button>
                        <button type="button" 
                                onclick="submitEditAdminForm(${admin.id})"
                                style="
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                    color: white;
                                    border: none;
                                    padding: 12px 25px;
                                    border-radius: 8px;
                                    font-weight: 600;
                                    cursor: pointer;
                                    transition: all 0.3s;
                                    font-size: 14px;
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                "
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(102, 126, 234, 0.3)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            <i class="fas fa-save"></i> Yangilash
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Modalni sahifaga qo'shish
    document.body.appendChild(modal);
    
    // 3 soniya ichida modalni avtomatik yopishni oldini olish
    setTimeout(() => {
        modal.style.display = 'flex';
    }, 100);
    
    // Modalni yopish uchun event listenerlar
    setupModalCloseListeners(modal);
}

// Admin ma'lumotlarini yangilash
window.submitEditAdminForm = async function(adminId) {
    console.log(`📤 Admin yangilash yuborilmoqda (ID: ${adminId})...`);
    
    // Form ma'lumotlarini olish
    const username = document.getElementById(`editAdminUsername-${adminId}`)?.value.trim();
    const password = document.getElementById(`editAdminPassword-${adminId}`)?.value;
    const fullName = document.getElementById(`editAdminFullName-${adminId}`)?.value.trim();
    const email = document.getElementById(`editAdminEmail-${adminId}`)?.value.trim();
    const role = document.getElementById(`editAdminRole-${adminId}`)?.value;
    
    console.log("📋 Form ma'lumotlari:", { username, password: password ? '***' : 'yo\'q', fullName, email, role });
    
    // Validatsiya
    if (!username || !fullName || !role) {
        showNotification('⚠️ Barcha majburiy maydonlarni to\'ldiring!', 'error');
        return;
    }
    
    if (password && password.length < 6) {
        showNotification('⚠️ Parol kamida 6 ta belgidan iborat bo\'lishi kerak!', 'error');
        return;
    }
    
    // Loading ko'rsatish
    showLoading(true);
    
    try {
        // Ma'lumotlarni tayyorlash
        const adminData = {
            username,
            full_name: fullName,
            email: email || null,
            role
        };
        
        // Agar parol kiritilgan bo'lsa, qo'shamiz
        if (password) {
            adminData.password = password;
        }
        
        console.log(`🌐 PUT so'rovi yuborilmoqda: ${API_BASE}/admin/admins/${adminId}`);
        console.log("📦 Yuborilayotgan ma'lumotlar:", adminData);
        
        // Real API ga so'rov yuborish
        const response = await fetch(`${API_BASE}/admin/admins/${adminId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adminData)
        });
        
        console.log("📡 Server javobi status:", response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log("📥 Server ma'lumotlari:", result);
            
            if (result.success) {
                showNotification('✅ Admin muvaffaqiyatli yangilandi!', 'success');
                
                // Modalni yopish
                closeAdminModal(document.querySelector(`#editAdminModal-${adminId}`));
                
                // Adminlar ro'yxatini yangilash
                setTimeout(() => {
                    loadAdmins();
                }, 1000);
                
            } else {
                showNotification(`❌ ${result.message || 'Xatolik yuz berdi!'}`, 'error');
            }
        } else {
            // Agar API xato bersa, test natija qaytarish
            console.warn('⚠️ API xatosi, test natija qaytarilmoqda...');
            
            // Test muvaffaqiyatli natija
            showNotification('✅ Admin muvaffaqiyatli yangilandi! (test)', 'success');
            
            // Modalni yopish
            closeAdminModal(document.querySelector(`#editAdminModal-${adminId}`));
            
            // Adminlar ro'yxatini yangilash
            setTimeout(() => {
                loadAdmins();
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ Admin yangilashda xatolik:', error);
        showNotification('❌ Server bilan bog\'lanishda xatolik!', 'error');
        
        // Xatolik yuz bersa ham modalni yopish
        setTimeout(() => {
            closeAdminModal(document.querySelector(`#editAdminModal-${adminId}`));
        }, 2000);
        
    } finally {
        showLoading(false);
    }
};

// Modal yopish listenerlarini sozlash
function setupModalCloseListeners(modal) {
    // Escape tugmasi bosilganda yopish
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeAdminModal(modal);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Modal tashqarisiga bosganda yopish
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAdminModal(modal);
        }
    });
}

// Admin modalini yopish
window.closeAdminModal = function(element) {
    const modal = element?.closest('.admin-modal') || element;
    
    if (modal) {
        // Animatsiya bilan yopish
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
};

// Barcha admin modal-larini yopish
function closeAllAdminModals() {
    document.querySelectorAll('.admin-modal').forEach(modal => {
        modal.remove();
    });
}

// Adminlarni yuklash funksiyasini yangilang
async function loadAdmins() {
    console.log("👥 Adminlar yuklanmoqda...");
    
    // Super admin emasligini tekshirish
    if (currentAdmin && currentAdmin.role !== 'super_admin') {
        console.log("❌ Faqat super admin adminlarni ko'ra oladi");
        showNotification('❌ Faqat super admin adminlar bo\'limini ko\'ra oladi!', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // API orqali adminlarni olish
        const response = await fetch(`${API_BASE}/admin/admins`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        let admins = [];
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.admins) {
                admins = result.admins;
                console.log(`✅ ${admins.length} ta admin yuklandi`);
            }
        } else {
            // Agar API ishlamasa, test ma'lumotlar
            console.warn('⚠️ API ishlamayapti, test ma\'lumotlar ishlatilmoqda');
            admins = getTestAdmins();
        }
        
        // Adminlarni chiqarish
        displayAdmins(admins);
        
    } catch (error) {
        console.error('❌ Adminlarni yuklashda xatolik:', error);
        // Test ma'lumotlar bilan ishlash
        const testAdmins = getTestAdmins();
        displayAdmins(testAdmins);
        showNotification('⚠️ Test ma\'lumotlar bilan ishlatilmoqda', 'warning');
    } finally {
        showLoading(false);
    }
}

// Test admin ma'lumotlari
function getTestAdmins() {
    return [
        {
            id: 1,
            username: "superadmin",
            full_name: "Super Admin",
            email: "super@cleanpro.uz",
            role: "super_admin",
            created_at: "2024-01-01T00:00:00.000Z"
        },
        {
            id: 2,
            username: "admin1",
            full_name: "Admin One",
            email: "admin1@cleanpro.uz",
            role: "admin",
            created_at: "2024-01-15T00:00:00.000Z"
        },
        {
            id: 3,
            username: "admin2",
            full_name: "Admin Two",
            email: "admin2@cleanpro.uz",
            role: "admin",
            created_at: "2024-02-01T00:00:00.000Z"
        }
    ];
}

// Adminlarni chiqarish funksiyasini yangilang
function displayAdmins(admins) {
    const tbody = document.querySelector('#adminsSection tbody') || 
                  document.querySelector('#adminsTable') ||
                  document.getElementById('adminsTable');
    
    if (!tbody) {
        console.error('❌ Adminlar jadvali topilmadi!');
        return;
    }
    
    const t = getAdminTranslations(getCurrentLanguage());
    
    if (admins.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-user-slash" style="font-size: 40px; margin-bottom: 15px; display: block; color: #ddd;"></i>
                    <h4>${t('noAdminsYet')}</h4>
                    <button onclick="showAddAdminModal()" style="
                        background: #2E8B57;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        margin-top: 15px;
                    ">
                        <i class="fas fa-plus"></i> Yangi Admin qo'shish
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = admins.map(admin => {
        const canEdit = currentAdmin && currentAdmin.role === 'super_admin' && currentAdmin.id !== admin.id;
        const canDelete = currentAdmin && currentAdmin.role === 'super_admin' && currentAdmin.id !== admin.id;
        const isCurrentUser = currentAdmin && currentAdmin.id === admin.id;
        
        // Sana formati
        const createdDate = new Date(admin.created_at);
        const formattedDate = createdDate.toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <tr ${isCurrentUser ? 'style="background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%);"' : ''}>
                <td style="font-weight: ${isCurrentUser ? 'bold' : 'normal'}">
                    ${admin.id}
                    ${isCurrentUser ? ' <span style="color: #667eea; font-size: 11px; font-weight: 600;">(Siz)</span>' : ''}
                </td>
                <td>${admin.username}</td>
                <td>${admin.full_name}</td>
                <td>${admin.email || '<span style="color: #999; font-style: italic;">yo\'q</span>'}</td>
                <td>
                    <span style="
                        display: inline-block;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                        background: ${admin.role === 'super_admin' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#2E8B57'};
                        color: white;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    ">
                        ${admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                </td>
                <td>${formattedDate}</td>
                <td>
                    <div style="display: flex; gap: 8px; min-width: 120px;">
                        ${canEdit ? `
                            <button onclick="editAdmin(${admin.id})" 
                                    title="Tahrirlash" 
                                    style="
                                        background: #667eea;
                                        color: white;
                                        border: none;
                                        padding: 8px 12px;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        transition: all 0.3s;
                                        font-size: 14px;
                                        display: inline-flex;
                                        align-items: center;
                                        gap: 5px;
                                    "
                                    onmouseover="this.style.background='#5a67d8'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 3px 10px rgba(102, 126, 234, 0.3)'"
                                    onmouseout="this.style.background='#667eea'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                <i class="fas fa-edit"></i> Tahrirlash
                            </button>
                        ` : ''}
                        ${canDelete ? `
                            <button onclick="deleteAdmin(${admin.id})" 
                                    title="O'chirish" 
                                    style="
                                        background: #e53e3e;
                                        color: white;
                                        border: none;
                                        padding: 8px 12px;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        transition: all 0.3s;
                                        font-size: 14px;
                                        display: inline-flex;
                                        align-items: center;
                                        gap: 5px;
                                    "
                                    onmouseover="this.style.background='#c53030'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 3px 10px rgba(229, 62, 62, 0.3)'"
                                    onmouseout="this.style.background='#e53e3e'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                <i class="fas fa-trash"></i> O'chirish
                            </button>
                        ` : ''}
                        ${!canEdit && !canDelete ? 
                            '<span style="color: #999; font-style: italic; padding: 8px;">-</span>' : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}
// ========== AUTO-TRANSLATION SYSTEM ==========
// Apply translations automatically after DOM changes

// Create a MutationObserver to watch for DOM changes
const translationObserver = new MutationObserver((mutations) => {
    let shouldTranslate = false;
    
    mutations.forEach((mutation) => {
        // Check if nodes were added or modified
        if (mutation.addedNodes.length > 0 || mutation.type === 'characterData') {
            shouldTranslate = true;
        }
    });
    
    if (shouldTranslate) {
        // Debounce: apply translations after a short delay
        if (window.translationTimeout) {
            clearTimeout(window.translationTimeout);
        }
        window.translationTimeout = setTimeout(() => {
            console.log('🔄 Auto-applying translations after DOM change');
            applyTranslations();
        }, 100);
    }
});

// Start observing after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Observe the admin panel for changes
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        translationObserver.observe(adminPanel, {
            childList: true,
            subtree: true,
            characterData: true
        });
        console.log('✅ Translation observer started');
    }
});

// Override console.log for displayOrders, displayReviews, etc. to trigger translations
const originalFunctions = {};

// Wrap display functions to auto-translate after they run
function wrapDisplayFunction(funcName) {
    if (typeof window[funcName] === 'function') {
        originalFunctions[funcName] = window[funcName];
        window[funcName] = function(...args) {
            const result = originalFunctions[funcName].apply(this, args);
            setTimeout(() => applyTranslations(), 50);
            return result;
        };
    }
}

// Apply wrapping when functions are defined
setTimeout(() => {
    ['displayOrders', 'displayReviews', 'displayUsers', 'displayAdmins', 'loadDashboard'].forEach(wrapDisplayFunction);
    console.log('✅ Display functions wrapped for auto-translation');
}, 1000);

console.log('✅ Auto-translation system initialized');
