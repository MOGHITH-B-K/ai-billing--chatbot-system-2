import { db } from '@/db';
import { products } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const sampleProducts = [
        // Sales Products
        {
            name: 'Steel Plates Set',
            rate: 500,
            category: 'Kitchen',
            productType: 'sales',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Pressure Cooker',
            rate: 1200,
            category: 'Kitchen',
            productType: 'sales',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Ceiling Fan',
            rate: 1800,
            category: 'Electronics',
            productType: 'sales',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Mixer Grinder',
            rate: 2500,
            category: 'Kitchen',
            productType: 'sales',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Water Purifier',
            rate: 8000,
            category: 'Home Appliances',
            productType: 'sales',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Induction Cooktop',
            rate: 3500,
            category: 'Kitchen',
            productType: 'sales',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Electric Kettle',
            rate: 800,
            category: 'Kitchen',
            productType: 'sales',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Room Heater',
            rate: 2200,
            category: 'Electronics',
            productType: 'sales',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Iron Box',
            rate: 900,
            category: 'Home Appliances',
            productType: 'sales',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'LED Bulbs Pack',
            rate: 400,
            category: 'Electronics',
            productType: 'sales',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        // Rental Products
        {
            name: 'Plastic Chairs',
            rate: 15,
            category: 'Furniture',
            productType: 'rental',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Banquet Tables',
            rate: 50,
            category: 'Furniture',
            productType: 'rental',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Wedding Tent',
            rate: 2000,
            category: 'Events',
            productType: 'rental',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Sound System',
            rate: 1500,
            category: 'Audio/Video',
            productType: 'rental',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'DJ Equipment',
            rate: 3000,
            category: 'Audio/Video',
            productType: 'rental',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'LED Stage Lights',
            rate: 800,
            category: 'Events',
            productType: 'rental',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Projector & Screen',
            rate: 1200,
            category: 'Audio/Video',
            productType: 'rental',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Buffet Counter',
            rate: 500,
            category: 'Events',
            productType: 'rental',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Sofa Set',
            rate: 300,
            category: 'Furniture',
            productType: 'rental',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            name: 'Canopy Tent',
            rate: 1000,
            category: 'Events',
            productType: 'rental',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
    ];

    await db.insert(products).values(sampleProducts);
    
    console.log('✅ Products seeder completed successfully - 20 products inserted (10 sales, 10 rental)');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});