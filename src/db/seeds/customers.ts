import { db } from '@/db';
import { customers } from '@/db/schema';

async function main() {
    const sampleCustomers = [
        {
            name: 'Rajesh Kumar',
            phone: '9876543210',
            address: '12 MG Road, Bangalore, Karnataka 560001',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Priya Sharma',
            phone: '8765432109',
            address: '45 Park Street, Kolkata, West Bengal 700016',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Amit Patel',
            phone: '7654321098',
            address: '78 Anna Nagar, Chennai, Tamil Nadu 600040',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Lakshmi Reddy',
            phone: '6543210987',
            address: '23 Banjara Hills, Hyderabad, Telangana 500034',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Suresh Gupta',
            phone: '5432109876',
            address: '56 Connaught Place, New Delhi, Delhi 110001',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Anita Singh',
            phone: '4321098765',
            address: '89 Civil Lines, Jaipur, Rajasthan 302006',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Venkat Rao',
            phone: '3210987654',
            address: '34 Koramangala, Bangalore, Karnataka 560095',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Divya Nair',
            phone: '2109876543',
            address: '67 Marine Drive, Mumbai, Maharashtra 400002',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Karthik Iyer',
            phone: '1098765432',
            address: '91 T Nagar, Chennai, Tamil Nadu 600017',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Sneha Desai',
            phone: '9988776655',
            address: '15 Law Garden Road, Ahmedabad, Gujarat 380009',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(customers).values(sampleCustomers);
    
    console.log('✅ Customers seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});