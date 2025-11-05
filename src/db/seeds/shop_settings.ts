import { db } from '@/db';
import { shopSettings } from '@/db/schema';

async function main() {
    const sampleSettings = [
        {
            shopName: 'SREE SAI DURGA',
            shopAddress: '123 Main Street, Hyderabad, Telangana, India',
            phoneNumber1: '9876543210',
            phoneNumber2: '8765432109',
            logoUrl: null,
            paymentQrUrl: null,
            language: 'english',
            theme: 'light',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(shopSettings).values(sampleSettings);
    
    console.log('✅ Shop settings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});