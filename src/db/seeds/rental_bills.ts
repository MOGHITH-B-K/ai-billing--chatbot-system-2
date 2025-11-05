import { db } from '@/db';
import { rentalBills } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const sampleRentalBills = [
        {
            serialNo: 1,
            fromDate: '2024-01-10T08:00:00.000Z',
            toDate: '2024-01-12T20:00:00.000Z',
            customerName: 'Venkat Rao',
            customerPhone: '9123456789',
            customerAddress: '34 Banjara Hills, Hyderabad',
            items: JSON.stringify([
                { itemName: 'Plastic Chairs', qty: 100, rate: 15, amount: 1500 },
                { itemName: 'Banquet Tables', qty: 20, rate: 50, amount: 1000 }
            ]),
            subtotal: 2500,
            transportFees: 500,
            taxPercentage: 18,
            taxAmount: 540,
            taxType: 'GST',
            advanceAmount: 2000,
            totalAmount: 3540,
            isPaid: true,
            customerFeedback: 'very_good',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            serialNo: 2,
            fromDate: '2024-01-18T06:00:00.000Z',
            toDate: '2024-01-19T22:00:00.000Z',
            customerName: 'Divya Nair',
            customerPhone: '8234567890',
            customerAddress: '67 Koramangala, Bangalore',
            items: JSON.stringify([
                { itemName: 'Sound System', qty: 2, rate: 1500, amount: 3000 },
                { itemName: 'LED Stage Lights', qty: 4, rate: 800, amount: 3200 }
            ]),
            subtotal: 6200,
            transportFees: 800,
            taxPercentage: 18,
            taxAmount: 1260,
            taxType: 'GST',
            advanceAmount: 3000,
            totalAmount: 8260,
            isPaid: false,
            customerFeedback: 'good',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            serialNo: 3,
            fromDate: '2024-01-25T10:00:00.000Z',
            toDate: '2024-01-26T18:00:00.000Z',
            customerName: 'Karthik Iyer',
            customerPhone: '7345678901',
            customerAddress: '89 T Nagar, Chennai',
            items: JSON.stringify([
                { itemName: 'Wedding Tent', qty: 1, rate: 2000, amount: 2000 },
                { itemName: 'Plastic Chairs', qty: 150, rate: 15, amount: 2250 }
            ]),
            subtotal: 4250,
            transportFees: 1000,
            taxPercentage: 18,
            taxAmount: 945,
            taxType: 'GST',
            advanceAmount: 4000,
            totalAmount: 6195,
            isPaid: true,
            customerFeedback: 'very_good',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            serialNo: 4,
            fromDate: '2024-02-01T09:00:00.000Z',
            toDate: null,
            customerName: 'Sneha Desai',
            customerPhone: '6456789012',
            customerAddress: '12 Andheri West, Mumbai',
            items: JSON.stringify([
                { itemName: 'DJ Equipment', qty: 1, rate: 3000, amount: 3000 },
                { itemName: 'Projector & Screen', qty: 1, rate: 1200, amount: 1200 }
            ]),
            subtotal: 4200,
            transportFees: 600,
            taxPercentage: 18,
            taxAmount: 864,
            taxType: 'GST',
            advanceAmount: 2500,
            totalAmount: 5664,
            isPaid: false,
            customerFeedback: null,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            serialNo: 5,
            fromDate: '2024-02-05T07:00:00.000Z',
            toDate: '2024-02-06T21:00:00.000Z',
            customerName: 'Amit Patel',
            customerPhone: '7654321098',
            customerAddress: '78 Anna Nagar, Chennai',
            items: JSON.stringify([
                { itemName: 'Sofa Set', qty: 5, rate: 300, amount: 1500 },
                { itemName: 'Canopy Tent', qty: 2, rate: 1000, amount: 2000 }
            ]),
            subtotal: 3500,
            transportFees: 400,
            taxPercentage: 18,
            taxAmount: 702,
            taxType: 'GST',
            advanceAmount: 2000,
            totalAmount: 4602,
            isPaid: true,
            customerFeedback: 'good',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(rentalBills).values(sampleRentalBills);
    
    console.log('✅ Rental bills seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});