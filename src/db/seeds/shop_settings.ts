import { db } from '@/db';
import { shopSettings } from '@/db/schema';

async function main() {
    const sampleShopSettings = [
        {
            shopName: 'SREE SAI DURGA',
            shopAddress: 'MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE: 607203',
            phoneNumber1: '9790548669',
            phoneNumber2: '9442378669',
            logoUrl: null,
            paymentQrUrl: null,
            language: 'english',
            theme: 'light',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(shopSettings).values(sampleShopSettings);
    
    console.log('✅ Shop settings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});