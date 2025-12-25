// ========== ADMIN PANEL TRANSLATIONS ==========
// Независимая система переводов для админ-панели
console.log('📚 adminTranslations.js загружен');

const ADMIN_TRANSLATIONS = {
    uz_latn: {
        // Login page
        login: "Kirish",
        username: "Login",
        password: "Parol",
        adminTitle: "CleanPro Admin",
        professionalAdmin: "Professional ma'muriyat paneli",
        testAccounts: "Test hisoblar:",
        loginButton: "Kirish",
        loginFailed: "Login yoki parol noto'g'ri!",
        serverError: "Server bilan bog'lanishda xatolik!",

        // Menu
        dashboard: "Dashboard",
        orders: "Buyurtmalar",
        reviews: "Fikrlar",
        users: "Foydalanuvchilar",
        stats: "Statistika",
        admins: "Adminlar",
        logout: "Chiqish",

        // Stats cards
        totalOrders: "Jami Buyurtmalar",
        totalReviews: "Jami Fikrlar",
        totalUsers: "Foydalanuvchilar",
        pendingOrders: "Kutilmoqda",

        // Section titles
        allOrders: "Barcha Buyurtmalar",
        allReviews: "Barcha Fikrlar",
        allUsers: "Barcha Foydalanuvchilar",
        adminsManagement: "Adminlar Boshqaruvi",

        // Buttons
        search: "Qidirish...",
        refresh: "Yangilash",
        newAdmin: "Yangi Admin",
        edit: "Tahrirlash",
        delete: "O'chirish",
        save: "Saqlash",
        cancel: "Bekor qilish",
        close: "Yopish",
        test: "Test",
        editBtn: "Tahrirlash",
        deleteBtn: "O'chirish",

        // Status
        status: "Holat",
        statusPending: "Kutilmoqda",
        statusCompleted: "Bajarildi",
        statusCancelled: "Bekor qilindi",
        changeStatus: "Holatni o'zgartirish",
        statusUpdated: "Holat yangilandi!",
        allStatuses: "Barchasi",

        // Table columns
        id: "ID",
        customer: "Mijoz",
        phone: "Telefon",
        service: "Xizmat",
        orderDate: "Sana",
        actions: "Amallar",
        name: "Ism",
        rating: "Reyting",
        review: "Fikr",
        date: "Sana",
        registered: "Ro'yxatdan o'tgan",
        fullName: "To'liq Ism",
        email: "Email",
        role: "Rol",
        created: "Yaratilgan",

        // Roles
        admin: "Admin",
        superAdmin: "Super Admin",
        superAdminOnly: "Faqat super admin!",

        // Statistics
        serviceStats: "Xizmat turlari bo'yicha statistika",
        statusStats: "Buyurtmalar holati bo'yicha statistika",
        statisticsSummary: "Statistika xulosasi",
        totalOrdersLabel: "Jami buyurtmalar:",
        pendingOrdersLabel: "Kutilmoqda:",
        completedOrdersLabel: "Bajarildi:",
        cancelledOrdersLabel: "Bekor qilindi:",
        ordersCount: "Buyurtmalar soni",
        averagePrice: "O'rtacha narx:",
        mostPopularService: "Eng mashhur xizmat:",
        totalAmount: "Umumiy summasi:",

        // Dashboard
        recentOrders: "So'nggi Buyurtmalar",
        weeklyOrders: "So'nggi 7 kunlik buyurtmalar",

        // Admin modal
        addNewAdmin: "Yangi Admin Qo'shish",
        editAdminTitle: "Adminni Tahrirlash",
        usernameRequired: "Username *",
        passwordRequired: "Parol *",
        fullNameRequired: "To'liq Ism *",
        emailOptional: "Email",
        roleLabel: "Rol",
        saveButton: "Saqlash",
        cancelButton: "Bekor qilish",

        // Messages
        loading: "Yuklanmoqda...",
        pleaseWait: "Iltimos kuting...",
        noData: "Ma'lumot yo'q",
        confirmDelete: "O'chirishni tasdiqlaysizmi?",
        noDataYet: "Hozircha ma'lumotlar yo'q",
        noUsersYet: "Hozircha foydalanuvchilar yo'q",
        noOrdersYet: "Hozircha buyurtmalar yo'q",
        noAdminsYet: "Hozircha adminlar yo'q",

        // Language names
        langUzLatn: "O'zbek (Lotin)",
        langUzCyrl: "Ўзбек (Кирилл)",
        langRu: "Русский",

        // Additional translations
        allOrdersHeader: "Barcha Buyurtmalar",
        allReviewsHeader: "Barcha Fikrlar",
        addNewAdminBtn: "Yangi Admin",
        ordersHeader: "Buyurtmalar",
        adminPanelText: "Admin Panel"
    },

    uz_cyrl: {
        // Login page
        login: "Кириш",
        username: "Логин",
        password: "Парол",
        adminTitle: "CleanPro Админ",
        professionalAdmin: "Профессионал маъмурият панели",
        testAccounts: "Тест ҳисоблар:",
        loginButton: "Кириш",
        loginFailed: "Логин ёки парол нотўғри!",
        serverError: "Сервер билан боғланишда хатолик!",

        // Menu
        dashboard: "Дашборд",
        orders: "Буюртмалар",
        reviews: "Фикрлар",
        users: "Фойдаланувчилар",
        stats: "Статистика",
        admins: "Админлар",
        logout: "Чиқиш",

        // Stats cards
        totalOrders: "Жами Буюртмалар",
        totalReviews: "Жами Фикрлар",
        totalUsers: "Фойдаланувчилар",
        pendingOrders: "Кутилмоқда",

        // Section titles
        allOrders: "Барча Буюртмалар",
        allReviews: "Барча Фикрлар",
        allUsers: "Барча Фойдаланувчилар",
        adminsManagement: "Админлар Бошқаруви",

        // Buttons
        search: "Қидириш...",
        refresh: "Янгилаш",
        newAdmin: "Янги Админ",
        edit: "Таҳрирлаш",
        delete: "Ўчириш",
        save: "Сақлаш",
        cancel: "Бекор қилиш",
        close: "Ёпиш",
        test: "Тест",
        editBtn: "Таҳрирлаш",
        deleteBtn: "Ўчириш",

        // Status
        status: "Ҳолат",
        statusPending: "Кутилмоқда",
        statusCompleted: "Бажарилди",
        statusCancelled: "Бекор қилинди",
        changeStatus: "Ҳолатни ўзгартириш",
        statusUpdated: "Ҳолат янгиланди!",
        allStatuses: "Барчаси",

        // Table columns
        id: "ID",
        customer: "Мижоз",
        phone: "Телефон",
        service: "Хизмат",
        orderDate: "Сана",
        actions: "Амаллар",
        name: "Исм",
        rating: "Рейтинг",
        review: "Фикр",
        date: "Сана",
        registered: "Рўйхатдан ўтган",
        fullName: "Тўлиқ Исм",
        email: "Email",
        role: "Рол",
        created: "Яратилган",

        // Roles
        admin: "Админ",
        superAdmin: "Супер Админ",
        superAdminOnly: "Фақат супер админ!",

        // Statistics
        serviceStats: "Хизмат турлари бўйича статистика",
        statusStats: "Буюртмалар ҳолати бўйича статистика",
        statisticsSummary: "Статистика хулосаси",
        totalOrdersLabel: "Жами буюртмалар:",
        pendingOrdersLabel: "Кутилмоқда:",
        completedOrdersLabel: "Бажарилди:",
        cancelledOrdersLabel: "Бекор қилинди:",
        ordersCount: "Буюртмалар сони",
        averagePrice: "Ўртача нарх:",
        mostPopularService: "Энг машҳур хизмат:",
        totalAmount: "Умумий суммаси:",

        // Dashboard
        recentOrders: "Сўнгги Буюртмалар",
        weeklyOrders: "Сўнгги 7 кунлик буюртмалар",

        // Admin modal
        addNewAdmin: "Янги Админ Қўшиш",
        editAdminTitle: "Админни Таҳрирлаш",
        usernameRequired: "Username *",
        passwordRequired: "Парол *",
        fullNameRequired: "Тўлиқ Исм *",
        emailOptional: "Email",
        roleLabel: "Рол",
        saveButton: "Сақлаш",
        cancelButton: "Бекор қилиш",

        // Messages
        loading: "Юкланмоқда...",
        pleaseWait: "Илтимос кутинг...",
        noData: "Маълумот йўқ",
        confirmDelete: "Ўчиришни тасдиқлайсизми?",
        noDataYet: "Ҳозирча маълумотлар йўқ",
        noUsersYet: "Ҳозирча фойдаланувчилар йўқ",
        noOrdersYet: "Ҳозирча буюртмалар йўқ",
        noAdminsYet: "Ҳозирча админлар йўқ",

        // Language names
        langUzLatn: "O'zbek (Lotin)",
        langUzCyrl: "Ўзбек (Кирилл)",
        langRu: "Русский",

        // Additional translations
        allOrdersHeader: "Барча Буюртмалар",
        allReviewsHeader: "Барча Фикрлар",
        addNewAdminBtn: "Янги Админ",
        ordersHeader: "Буюртмалар",
        adminPanelText: "Админ Панель"
    },

    ru: {
        // Login page
        login: "Вход",
        username: "Логин",
        password: "Пароль",
        adminTitle: "CleanPro Админ",
        professionalAdmin: "Профессиональная панель администратора",
        testAccounts: "Тестовые аккаунты:",
        loginButton: "Войти",
        loginFailed: "Логин или пароль неправильный!",
        serverError: "Ошибка соединения с сервером!",

        // Menu
        dashboard: "Панель управления",
        orders: "Заказы",
        reviews: "Отзывы",
        users: "Пользователи",
        stats: "Статистика",
        admins: "Администраторы",
        logout: "Выход",

        // Stats cards
        totalOrders: "Всего Заказов",
        totalReviews: "Всего Отзывов",
        totalUsers: "Пользователей",
        pendingOrders: "В ожидании",

        // Section titles
        allOrders: "Все Заказы",
        allReviews: "Все Отзывы",
        allUsers: "Все Пользователи",
        adminsManagement: "Управление Админами",

        // Buttons
        search: "Поиск...",
        refresh: "Обновить",
        newAdmin: "Новый Админ",
        edit: "Редактировать",
        delete: "Удалить",
        save: "Сохранить",
        cancel: "Отмена",
        close: "Закрыть",
        test: "Тест",
        editBtn: "Редактировать",
        deleteBtn: "Удалить",

        // Status
        status: "Статус",
        statusPending: "В ожидании",
        statusCompleted: "Выполнено",
        statusCancelled: "Отменено",
        changeStatus: "Изменить статус",
        statusUpdated: "Статус обновлен!",
        allStatuses: "Все",

        // Table columns
        id: "ID",
        customer: "Клиент",
        phone: "Телефон",
        service: "Услуга",
        orderDate: "Дата",
        actions: "Действия",
        name: "Имя",
        rating: "Рейтинг",
        review: "Отзыв",
        date: "Дата",
        registered: "Зарегистрирован",
        fullName: "Полное имя",
        email: "Email",
        role: "Роль",
        created: "Создан",

        // Roles
        admin: "Админ",
        superAdmin: "Супер Админ",
        superAdminOnly: "Только супер администратор!",

        // Statistics
        serviceStats: "Статистика по типам услуг",
        statusStats: "Статистика по статусам заказов",
        statisticsSummary: "Сводка статистики",
        totalOrdersLabel: "Всего заказов:",
        pendingOrdersLabel: "В ожидании:",
        completedOrdersLabel: "Выполнено:",
        cancelledOrdersLabel: "Отменено:",
        ordersCount: "Количество заказов",
        averagePrice: "Средняя цена:",
        mostPopularService: "Самая популярная услуга:",
        totalAmount: "Общая сумма:",

        // Dashboard
        recentOrders: "Последние Заказы",
        weeklyOrders: "Заказы за последние 7 дней",

        // Admin modal
        addNewAdmin: "Добавить Админа",
        editAdminTitle: "Редактировать Админа",
        usernameRequired: "Username *",
        passwordRequired: "Пароль *",
        fullNameRequired: "Полное Имя *",
        emailOptional: "Email",
        roleLabel: "Роль",
        saveButton: "Сохранить",
        cancelButton: "Отмена",

        // Messages
        loading: "Загрузка...",
        pleaseWait: "Пожалуйста подождите...",
        noData: "Нет данных",
        confirmDelete: "Подтвердить удаление?",
        noDataYet: "Пока нет данных",
        noUsersYet: "Пока нет пользователей",
        noOrdersYet: "Пока нет заказов",
        noAdminsYet: "Пока нет администраторов",

        // Language names
        langUzLatn: "O'zbek (Lotin)",
        langUzCyrl: "Ўзбек (Кирилл)",
        langRu: "Русский",

        // Additional translations
        allOrdersHeader: "Все Заказы",
        allReviewsHeader: "Все Отзывы",
        addNewAdminBtn: "Новый Админ",
        ordersHeader: "Заказы",
        adminPanelText: "Админ Панель"
    }
};

// Language management for admin panel only
const AdminLanguage = {
    currentLang: localStorage.getItem('adminLanguage') || 'uz_latn',

    get(key) {
        return ADMIN_TRANSLATIONS[this.currentLang][key] || key;
    },

    set(lang) {
        if (ADMIN_TRANSLATIONS[lang]) {
            this.currentLang = lang;
            localStorage.setItem('adminLanguage', lang);
            return true;
        }
        return false;
    },

    getCurrent() {
        return this.currentLang;
    },

    getAll(lang = null) {
        return ADMIN_TRANSLATIONS[lang || this.currentLang] || ADMIN_TRANSLATIONS.uz_latn;
    }
};

// Проверка после загрузки
console.log('✅ AdminLanguage инициализирован:', {
    currentLang: AdminLanguage.currentLang,
    availableLanguages: Object.keys(ADMIN_TRANSLATIONS),
    sampleTranslation: AdminLanguage.get('dashboard')
});
