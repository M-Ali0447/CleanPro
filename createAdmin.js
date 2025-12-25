// Bu fayl faqatgina terminalda ishga tushiriladi: node createAdmin.js
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

async function createAdmin() {
    console.log('🔄 Admin foydalanuvchi tekshirilmoqda...');

    try {
        const client = await pool.connect();

        // Admin bor yo'qligini tekshirish
        const result = await client.query("SELECT * FROM admins WHERE username = 'admin'");

        if (result.rows.length > 0) {
            console.log('✅ Admin allaqachon mavjud:');
            console.log(`   Login: ${result.rows[0].username}`);
            console.log(`   Parol: admin123 (хешировано в базе)`);
            console.log(`   Rol: ${result.rows[0].role}`);
            console.log('');
            console.log('⚠️  Agar parolni o\'zgartirmoqchi bo\'lsangiz, admin paneldan yangilang.');
        } else {
            // Hash password with bcrypt
            const hashedPassword = await bcrypt.hash('admin123', 10);

            // Admin qo'shish
            await client.query(`
                INSERT INTO admins (username, password, full_name, email, role)
                VALUES ('admin', $1, 'Super Administrator', 'admin@cleanpro.uz', 'super_admin')
            `, [hashedPassword]);

            console.log('✅ Admin muvaffaqiyatli yaratildi!');
            console.log('   Login: admin');
            console.log('   Parol: admin123');
            console.log('   Rol: super_admin');
            console.log('');
            console.log('🔐 Parol xavfsiz tarzda хешировано (bcrypt)');
        }

        client.release();
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error.message);
        await pool.end();
        process.exit(1);
    }
}

createAdmin();
