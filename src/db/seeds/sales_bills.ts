import { db } from '@/db';
import { salesBills } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const sampleSalesBills = [
        {
            serialNo: 1,
            billDate: '2024-01-15T10:30:00.000Z',
            customerName: 'Rajesh Kumar',
            customerPhone: '9876543210',
            customerAddress: '12 MG Road, Bangalore',
            items: [
                {
                    itemName: 'Steel Plates Set',
                    qty: 2,
                    rate: 500,
                    amount: 1000
                },
                {
                    itemName: 'Pressure Cooker',
                    qty: 1,
                    rate: 1200,
                    amount: 1200
                }
            ],
            subtotal: 2200,
            taxPercentage: 18,
            taxAmount: 396,
            taxType: 'GST',
            advanceAmount: 1000,
            totalAmount: 2596,
            isPaid: false,
            customerFeedback: 'good',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            serialNo: 2,
            billDate: '2024-01-20T14:15:00.000Z',
            customerName: 'Priya Sharma',
            customerPhone: '8765432109',
            customerAddress: '45 Park Street, Kolkata',
            items: [
                {
                    itemName: 'Ceiling Fan',
                    qty: 3,
                    rate: 1800,
                    amount: 5400
                }
            ],
            subtotal: 5400,
            taxPercentage: 12,
            taxAmount: 648,
            taxType: 'GST',
            advanceAmount: 3000,
            totalAmount: 6048,
            isPaid: true,
            customerFeedback: 'very_good',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            serialNo: 3,
            billDate: '2024-01-25T11:00:00.000Z',
            customerName: 'Amit Patel',
            customerPhone: '7654321098',
            customerAddress: '78 Anna Nagar, Chennai',
            items: [
                {
                    itemName: 'Mixer Grinder',
                    qty: 1,
                    rate: 2500,
                    amount: 2500
                },
                {
                    itemName: 'Electric Kettle',
                    qty: 2,
                    rate: 800,
                    amount: 1600
                }
            ],
            subtotal: 4100,
            taxPercentage: 18,
            taxAmount: 738,
            taxType: 'GST',
            advanceAmount: 2000,
            totalAmount: 4838,
            isPaid: false,
            customerFeedback: null,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            serialNo: 4,
            billDate: '2024-02-01T09:30:00.000Z',
            customerName: 'Lakshmi Reddy',
            customerPhone: '6543210987',
            customerAddress: '23 Jubilee Hills, Hyderabad',
            items: [
                {
                    itemName: 'Water Purifier',
                    qty: 1,
                    rate: 8000,
                    amount: 8000
                }
            ],
            subtotal: 8000,
            taxPercentage: 18,
            taxAmount: 1440,
            taxType: 'GST',
            advanceAmount: 5000,
            totalAmount: 9440,
            isPaid: true,
            customerFeedback: 'very_good',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            serialNo: 5,
            billDate: '2024-02-05T16:45:00.000Z',
            customerName: 'Suresh Gupta',
            customerPhone: '5432109876',
            customerAddress: '56 Civil Lines, Delhi',
            items: [
                {
                    itemName: 'Room Heater',
                    qty: 2,
                    rate: 2200,
                    amount: 4400
                },
                {
                    itemName: 'Iron Box',
                    qty: 1,
                    rate: 900,
                    amount: 900
                }
            ],
            subtotal: 5300,
            taxPercentage: 12,
            taxAmount: 636,
            taxType: 'GST',
            advanceAmount: 0,
            totalAmount: 5936,
            isPaid: false,
            customerFeedback: 'good',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(salesBills).values(sampleSalesBills);
    
    console.log('✅ Sales bills seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});