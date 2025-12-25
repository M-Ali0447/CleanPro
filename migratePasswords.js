// Скрипт для миграции существующих паролей в bcrypt
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function migratePasswords() {
    console.log('🔄 Начинаем миграцию паролей...\n');

    try {
        const client = await pool.connect();

        // Получаем всех админов
        const result = await client.query('SELECT id, username, password FROM admins');

        console.log(`📊 Найдено админов: ${result.rows.length}\n`);

        for (const admin of result.rows) {
            // Проверяем, не хеширован ли уже пароль (bcrypt хеши начинаются с $2b$)
            if (admin.password.startsWith('$2b$') || admin.password.startsWith('$2a$')) {
                console.log(`✅ ${admin.username}: пароль уже хеширован, пропускаем`);
                continue;
            }

            // Хешируем пароль
            const hashedPassword = await bcrypt.hash(admin.password, 10);

            // Обновляем в БД
            await client.query(
                'UPDATE admins SET password = $1 WHERE id = $2',
                [hashedPassword, admin.id]
            );

            console.log(`✅ ${admin.username}: пароль обновлен (старый пароль был: "${admin.password}")`);
        }

        console.log('\n✅ Миграция завершена успешно!');
        console.log('🔐 Все пароли теперь хешированы с помощью bcrypt');
        console.log('📝 Учетные данные для входа остались прежними\n');

        client.release();
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Ошибка при миграции:', error.message);
        await pool.end();
        process.exit(1);
    }
}

migratePasswords();
