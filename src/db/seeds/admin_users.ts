import { db } from '@/db';
import { adminUsers } from '@/db/schema';

async function main() {
    const sampleAdminUsers = [
        {
            username: 'MOGHITH',
            password: '289236173476',
            name: 'MOGHITH',
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(adminUsers).values(sampleAdminUsers);
    
    console.log('✅ Admin users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});