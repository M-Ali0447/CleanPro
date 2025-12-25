# Инструкция по настройке PostgreSQL для CleanPro

## 📋 Структура базы данных

Проект использует **4 таблицы**:

### 1. **users** - Пользователи
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR 100) - Имя пользователя
- phone (VARCHAR 20 UNIQUE) - Телефон (уникальный)
- email (VARCHAR 100) - Email (опционально)
- created_at (TIMESTAMP) - Дата регистрации
```

### 2. **orders** - Заказы
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER FK → users.id)
- name (VARCHAR 100) - Имя заказчика
- phone (VARCHAR 20) - Телефон заказчика
- service_type (VARCHAR 100) - Тип услуги
- order_date (DATE) - Дата заказа
- status (VARCHAR 20) - Статус: pending/completed/cancelled
- notes (TEXT) - Заметки
- created_at (TIMESTAMP)
```

### 3. **reviews** - Отзывы
```sql
- id (SERIAL PRIMARY KEY)
- user_name (VARCHAR 100) - Имя автора
- rating (INTEGER CHECK 1-5) - Оценка от 1 до 5
- review_text (TEXT) - Текст отзыва
- created_at (TIMESTAMP)
```

### 4. **admins** - Администраторы
```sql
- id (SERIAL PRIMARY KEY)
- username (VARCHAR 50 UNIQUE) - Логин
- password (VARCHAR 100) - Пароль (plain text!)
- full_name (VARCHAR 100) - Полное имя
- email (VARCHAR 100) - Email
- role (VARCHAR 20) - Роль: admin/super_admin
- created_at (TIMESTAMP)
```

---

## 🔧 Настройка PostgreSQL (Пошагово)

### ШАГ 1: Установка PostgreSQL

```bash
# Для Manjaro/Arch Linux
sudo pacman -S postgresql

# Для Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Для Fedora
sudo dnf install postgresql-server
```

### ШАГ 2: Инициализация базы данных (только для Arch/Manjaro)

```bash
# Инициализировать кластер БД
sudo -u postgres initdb -D /var/lib/postgres/data
```

### ШАГ 3: Запуск службы PostgreSQL

```bash
# Запустить PostgreSQL
sudo systemctl start postgresql

# Добавить в автозагрузку
sudo systemctl enable postgresql

# Проверить статус
sudo systemctl status postgresql
```

### ШАГ 4: Настройка пользователя postgres

```bash
# Войти в PostgreSQL как пользователь postgres
sudo -u postgres psql

# В консоли psql выполнить:
```

```sql
-- Установить пароль для пользователя postgres
ALTER USER postgres PASSWORD '1234';

-- Проверить подключение
\conninfo

-- Выйти
\q
```

### ШАГ 5: Проверка подключения

```bash
# Попробовать подключиться с паролем
psql -U postgres -h localhost -d postgres

# Если просит пароль - введите: 1234
# Если подключилось - всё работает!
```

### ШАГ 6: (Опционально) Настройка pg_hba.conf

Если не можете подключиться, проверьте настройки доступа:

```bash
# Найти файл pg_hba.conf
sudo find /var -name pg_hba.conf

# Открыть для редактирования (обычно здесь):
sudo nano /var/lib/postgres/data/pg_hba.conf
```

Найдите строку:
```
local   all             postgres                                peer
```

Замените на:
```
local   all             postgres                                md5
```

Также убедитесь что есть:
```
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

Перезапустите PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## 🚀 Автоматическая настройка (РЕКОМЕНДУЕТСЯ)

**Хорошая новость:** Ваше приложение настроено на **автоматическое создание таблиц!**

### Просто запустите сервер:

```bash
cd /home/thinklinux/Projects/cleanpro
npm start
```

Сервер автоматически:
- ✅ Создаст все 4 таблицы
- ✅ Создаст админа: **login: admin, password: admin123**
- ✅ Проверит подключение к БД

### Что вы увидите:

```
🔄 Server ishga tushirilmoqda...
✅ DATABASE ULANDI
📦 Jadvallar yaratilmoqda...
✅ Admin yaratildi: admin / admin123
✅ Jadvallar tayyor

═══════════════════════════════════════════════════
🚀 SERVER ISHGA TUSHDI: http://localhost:5006
🏠 CLEAN SITE: http://localhost:5006/clean.html
🔐 ADMIN PANEL: http://localhost:5006/admin.html
═══════════════════════════════════════════════════
```

---

## 🛠️ Ручная настройка (если нужно)

### Вариант 1: Использовать SQL скрипт

```bash
# Перейти в папку проекта
cd /home/thinklinux/Projects/cleanpro

# Выполнить SQL скрипт
psql -U postgres -h localhost -d postgres -f sql/database.sql
```

### Вариант 2: Создать вручную через psql

```bash
# Войти в psql
psql -U postgres -h localhost -d postgres

# Скопировать и выполнить SQL из server.js (строки 59-103)
```

### Вариант 3: Использовать createAdmin.js

Если таблицы уже созданы, но нужен админ:

```bash
node createAdmin.js
```

---

## 🔍 Проверка и тестирование

### 1. Проверить что PostgreSQL запущен:

```bash
sudo systemctl status postgresql
```

### 2. Проверить подключение:

```bash
psql -U postgres -h localhost -d postgres
```

### 3. Посмотреть таблицы:

```sql
-- В psql:
\dt

-- Должны увидеть:
-- admins
-- orders
-- reviews
-- users
```

### 4. Проверить админа:

```sql
SELECT * FROM admins;

-- Должны увидеть:
-- username: admin
-- password: admin123
-- role: super_admin
```

### 5. Тестовый запрос через API:

```bash
# Проверить здоровье сервера
curl http://localhost:5006/api/health

# Должно вернуть:
# {"success":true,"message":"🟢 Server ishdamiqda","database":"✅ Ulandi"}
```

---

## ⚙️ Параметры подключения

### Текущие настройки в server.js:

```javascript
user: 'postgres',
host: 'localhost',
database: 'postgres',
password: '1234',
port: 5432
```

### ⚠️ ВАЖНО: .env файл НЕ используется!

Файл `.env` содержит другие параметры, но **они не применяются** в коде.
Если хотите использовать `.env`, нужно изменить `server.js`:

```javascript
// Вместо:
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '1234',
    port: 5432,
    ssl: false
});

// Использовать:
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    port: parseInt(process.env.DB_PORT) || 5432,
    ssl: false
});
```

---

## 🐛 Решение проблем

### Ошибка: "FATAL: Peer authentication failed"

**Решение:** Измените `pg_hba.conf` (см. ШАГ 6)

### Ошибка: "Connection refused"

**Решение:**
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### Ошибка: "password authentication failed"

**Решение:**
```bash
sudo -u postgres psql
ALTER USER postgres PASSWORD '1234';
\q
```

### Ошибка: "database 'cleanpro' does not exist"

**Решение:** Проект использует базу `postgres` (дефолтная), не `cleanpro`

### Сервер не может создать таблицы

**Решение:**
1. Проверьте права пользователя postgres
2. Создайте таблицы вручную через `sql/database.sql`
3. Проверьте логи: посмотрите вывод сервера при запуске

---

## 📝 Полезные команды PostgreSQL

```sql
-- Войти в psql
psql -U postgres -h localhost -d postgres

-- Показать все базы данных
\l

-- Показать все таблицы
\dt

-- Описание таблицы
\d имя_таблицы
\d users

-- Показать всех пользователей
SELECT * FROM users;

-- Показать все заказы
SELECT * FROM orders;

-- Показать всех админов
SELECT username, role FROM admins;

-- Удалить все данные из таблицы (ОСТОРОЖНО!)
TRUNCATE TABLE orders CASCADE;

-- Удалить таблицу (ОСТОРОЖНО!)
DROP TABLE orders;

-- Выйти
\q
```

---

## 🎯 Быстрый старт (TL;DR)

```bash
# 1. Установить PostgreSQL
sudo pacman -S postgresql

# 2. Инициализировать (только Arch/Manjaro)
sudo -u postgres initdb -D /var/lib/postgres/data

# 3. Запустить службу
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 4. Установить пароль
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '1234';"

# 5. Запустить сервер приложения
cd /home/thinklinux/Projects/cleanpro
npm start

# 6. Готово! Откройте браузер:
# http://localhost:5006/clean.html
# http://localhost:5006/admin.html
```

---

## 🔐 Данные для входа

### Admin Panel:
- **URL:** http://localhost:5006/admin.html
- **Username:** admin
- **Password:** admin123
- **Role:** super_admin

---

## 📊 Схема базы данных (визуально)

```
┌─────────────┐
│    users    │
├─────────────┤
│ id (PK)     │
│ name        │
│ phone (UQ)  │◄────┐
│ email       │     │
│ created_at  │     │
└─────────────┘     │
                    │ FK
┌─────────────┐     │
│   orders    │     │
├─────────────┤     │
│ id (PK)     │     │
│ user_id     │─────┘
│ name        │
│ phone       │
│ service_type│
│ order_date  │
│ status      │
│ notes       │
│ created_at  │
└─────────────┘

┌─────────────┐
│   reviews   │
├─────────────┤
│ id (PK)     │
│ user_name   │
│ rating      │
│ review_text │
│ created_at  │
└─────────────┘

┌─────────────┐
│   admins    │
├─────────────┤
│ id (PK)     │
│ username(UQ)│
│ password    │
│ full_name   │
│ email       │
│ role        │
│ created_at  │
└─────────────┘
```

---

## ✅ Контрольный список

- [ ] PostgreSQL установлен
- [ ] Служба PostgreSQL запущена
- [ ] Пароль для postgres установлен (1234)
- [ ] Подключение к БД работает
- [ ] Сервер Node.js запущен
- [ ] Таблицы созданы автоматически
- [ ] Админ создан (admin/admin123)
- [ ] Сайт открывается: http://localhost:5006
- [ ] API работает: http://localhost:5006/api/health

**Если все пункты выполнены - база данных настроена успешно! 🎉**
