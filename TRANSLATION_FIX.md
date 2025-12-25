# Исправления системы перевода

## Проблема
Не все элементы страницы переводились при смене языка.

## Причины
1. **Неправильные атрибуты**: В HTML использовались атрибуты `data-translate` с узбекским текстом вместо ключей
2. **Неполная функция translatePage**: Функция обрабатывала только часть элементов и не покрывала всю страницу
3. **Несоответствие ключей localStorage**: Использовались разные ключи (`siteLang` и `language`)

## Исправления

### 1. Обновлена функция translatePage в clean.js
- Изменили атрибут с `data-translate` на `data-translate-key`
- Добавили поддержку всех типов элементов (INPUT, TEXTAREA, OPTION, BUTTON)
- Добавили автоматический перевод placeholders для всех форм
- Убрали хардкод для конкретных элементов - теперь система универсальная

### 2. Обновлены все атрибуты в clean.html
Заменили все `data-translate="Текст"` на `data-translate-key="ключ"`:

**Навигация:**
- `data-translate="Bosh sahifa"` → `data-translate-key="home"`
- `data-translate="Xizmatlar"` → `data-translate-key="services"`
- И т.д.

**Hero секция:**
- `data-translate="Professional Tozalash Xizmatlari"` → `data-translate-key="heroTitle"`
- `data-translate="Tez Buyurtma Qilish"` → `data-translate-key="quickOrder"`

**Формы:**
- `data-translate="Ismingiz"` → `data-translate-key="yourName"`
- `data-translate="Telefon"` → `data-translate-key="phone"`
- `data-translate="Xizmat turi"` → `data-translate-key="serviceType"`

**Услуги:**
- `data-translate="Uy tozalash"` → `data-translate-key="homeCleaning"`
- `data-translate="Buyurtma berish"` → `data-translate-key="orderService"`

**Статистика:**
- `data-translate="Bajargan ishlar"` → `data-translate-key="completedJobs"`
- `data-translate="Xaridorlar"` → `data-translate-key="customers"`

**Отзывы:**
- `data-translate="Mijozlarimizning Fikrlari"` → `data-translate-key="clientReviews"`
- `data-translate="Fikringizni qoldiring"` → `data-translate-key="leaveReview"`

**О нас:**
- `data-translate="Bizning Jamoa"` → `data-translate-key="ourTeam"`
- `data-translate="Nima uchun aynan CleanPro?"` → `data-translate-key="whyCleanPro"`

**Контакты:**
- `data-translate="Biz bilan bog'laning"` → `data-translate-key="contactUs"`
- `data-translate="Telefon"` → `data-translate-key="phoneLabel"`

**Футер:**
- `data-translate="Tez havolalar"` → `data-translate-key="quickLinks"`
- `data-translate="Ish vaqti"` → `data-translate-key="workingHours"`

### 3. Исправлено несоответствие localStorage
- Унифицирован ключ localStorage на `'language'` (вместо `'siteLang'`)

## Как проверить

1. Откройте страницу в браузере: `http://localhost:5006/clean.html`

2. Проверьте переключение языков:
   - Нажмите на кнопку переключения языка (иконка глобуса)
   - Выберите "O'zbek (Lotin)" - все должно быть на узбекском латинице
   - Выберите "Ўзбек (Кирилл)" - все должно перейти на кириллицу
   - Выберите "Русский" - все должно перейти на русский

3. Проверьте, что переводятся:
   - ✅ Навигационное меню (Bosh sahifa, Xizmatlar, etc.)
   - ✅ Заголовки всех секций
   - ✅ Описания услуг
   - ✅ Статистика (1500+ Bajargan ishlar, etc.)
   - ✅ Надписи на кнопках
   - ✅ Labels в формах
   - ✅ Placeholders в input полях
   - ✅ Опции в select'ах
   - ✅ Футер (контакты, время работы)

4. Проверьте сохранение языка:
   - Выберите русский язык
   - Обновите страницу (F5)
   - Язык должен остаться русским

## Файлы изменены
- ✅ `clean.js` - функция `translatePage()`
- ✅ `clean.html` - все атрибуты `data-translate` → `data-translate-key`
- ✅ Создана резервная копия: `clean.html.backup`

## Примечания
- Все ключи перевода берутся из файла `translations.js`
- Система теперь полностью автоматическая - достаточно добавить `data-translate-key="ключ"` к любому элементу
- Placeholders переводятся автоматически для всех input, textarea и select элементов
