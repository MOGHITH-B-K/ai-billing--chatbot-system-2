import jsPDF from 'jspdf';

interface BillItem {
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
}

interface SalesBill {
  serialNo: number;
  billDate: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: BillItem[];
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  taxType: string;
  advanceAmount: number;
  totalAmount: number;
  isPaid: boolean;
  customerFeedback?: string;
  shopName?: string;
  shopAddress?: string;
  shopPhone1?: string;
  shopPhone2?: string;
  shopLogoUrl?: string;
  shopQrUrl?: string;
}

interface RentalBill {
  serialNo: number;
  fromDate: string;
  toDate?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: BillItem[];
  subtotal: number;
  transportFees: number;
  taxPercentage: number;
  taxAmount: number;
  taxType: string;
  advanceAmount: number;
  totalAmount: number;
  isPaid: boolean;
  customerFeedback?: string;
  shopName?: string;
  shopAddress?: string;
  shopPhone1?: string;
  shopPhone2?: string;
  shopLogoUrl?: string;
  shopQrUrl?: string;
}

export const generateSalesBillPDF = async (bill: SalesBill) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // Calculate totals if missing
  const subtotal = bill.subtotal || bill.items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = bill.taxAmount || 0;
  const advanceAmount = bill.advanceAmount || 0;
  const totalAmount = bill.totalAmount || (subtotal + taxAmount - advanceAmount);

  // Add shop logo if available
  if (bill.shopLogoUrl) {
    try {
      doc.addImage(bill.shopLogoUrl, 'PNG', pageWidth / 2 - 15, yPos, 30, 30);
      yPos += 35;
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }

  // Shop Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(bill.shopName || 'SREE SAI DURGA', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const shopAddress = bill.shopAddress || 'MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE : 607203';
  const addressLines = doc.splitTextToSize(shopAddress, pageWidth - 40);
  addressLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
  });

  const phone1 = bill.shopPhone1 || '9790548669';
  const phone2 = bill.shopPhone2 || '9442378669';
  doc.text(`CALL: ${phone1}, ${phone2}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 8;

  // Bill Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Bill No: ${bill.serialNo}`, 20, yPos);
  doc.text(`Date: ${new Date(bill.billDate).toLocaleDateString('en-IN')}`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 10;

  // Customer Info
  doc.setFont('helvetica', 'normal');
  doc.text(`Customer: ${bill.customerName}`, 20, yPos);
  yPos += 6;
  doc.text(`Phone: ${bill.customerPhone}`, 20, yPos);
  yPos += 6;
  if (bill.customerAddress) {
    doc.text(`Address: ${bill.customerAddress}`, 20, yPos);
    yPos += 6;
  }
  yPos += 4;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 8;

  // Items Table Header
  doc.setFont('helvetica', 'bold');
  doc.text('S.No', 20, yPos);
  doc.text('Item Name', 40, yPos);
  doc.text('Qty', 120, yPos, { align: 'right' });
  doc.text('Rate (₹)', 145, yPos, { align: 'right' });
  doc.text('Amount (₹)', pageWidth - 20, yPos, { align: 'right' });
  yPos += 2;
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 6;

  // Items
  doc.setFont('helvetica', 'normal');
  bill.items.forEach((item, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(`${index + 1}`, 20, yPos);
    const itemName = item.itemName.length > 30 ? item.itemName.substring(0, 30) + '...' : item.itemName;
    doc.text(itemName, 40, yPos);
    doc.text(`${item.qty}`, 120, yPos, { align: 'right' });
    doc.text(`₹${item.rate.toFixed(2)}`, 145, yPos, { align: 'right' });
    doc.text(`₹${item.amount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 6;
  });

  yPos += 4;
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 8;

  // Totals
  const totalsX = pageWidth - 70;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, yPos);
  doc.text(`₹${subtotal.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 6;

  doc.text(`Tax (${bill.taxType || 'GST'} @ ${bill.taxPercentage}%):`, totalsX, yPos);
  doc.text(`₹${taxAmount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 6;

  if (advanceAmount > 0) {
    doc.text('Advance:', totalsX, yPos);
    doc.text(`-₹${advanceAmount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 6;
  }

  yPos += 2;
  doc.setLineWidth(0.8);
  doc.line(totalsX, yPos, pageWidth - 20, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Amount:', totalsX, yPos);
  doc.text(`₹${totalAmount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 8;

  doc.setFontSize(10);
  doc.text(`Payment Status: ${bill.isPaid ? '✓ FULLY PAID' : '⏳ PENDING'}`, totalsX, yPos);
  yPos += 15;

  // QR Code if available
  if (bill.shopQrUrl) {
    try {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Scan to Pay:', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.addImage(bill.shopQrUrl, 'PNG', pageWidth / 2 - 20, yPos, 40, 40);
    } catch (error) {
      console.error('Error adding QR code:', error);
    }
  }

  // Save PDF
  doc.save(`sales-bill-${bill.serialNo}.pdf`);
};

export const generateRentalBillPDF = async (bill: RentalBill) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // Calculate totals if missing
  const subtotal = bill.subtotal || bill.items.reduce((sum, item) => sum + item.amount, 0);
  const transportFees = bill.transportFees || 0;
  const taxAmount = bill.taxAmount || 0;
  const advanceAmount = bill.advanceAmount || 0;
  const totalAmount = bill.totalAmount || (subtotal + transportFees + taxAmount - advanceAmount);

  // Add shop logo if available
  if (bill.shopLogoUrl) {
    try {
      doc.addImage(bill.shopLogoUrl, 'PNG', pageWidth / 2 - 15, yPos, 30, 30);
      yPos += 35;
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }

  // Shop Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(bill.shopName || 'SREE SAI DURGA', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const shopAddress = bill.shopAddress || 'MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE : 607203';
  const addressLines = doc.splitTextToSize(shopAddress, pageWidth - 40);
  addressLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
  });

  const phone1 = bill.shopPhone1 || '9790548669';
  const phone2 = bill.shopPhone2 || '9442378669';
  doc.text(`CALL: ${phone1}, ${phone2}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 8;

  // Bill Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rental Bill No: ${bill.serialNo}`, 20, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`From Date: ${new Date(bill.fromDate).toLocaleDateString('en-IN')}`, 20, yPos);
  yPos += 6;
  if (bill.toDate) {
    doc.text(`To Date: ${new Date(bill.toDate).toLocaleDateString('en-IN')}`, 20, yPos);
    yPos += 6;
  }
  yPos += 4;

  // Customer Info
  doc.text(`Customer: ${bill.customerName}`, 20, yPos);
  yPos += 6;
  doc.text(`Phone: ${bill.customerPhone}`, 20, yPos);
  yPos += 6;
  if (bill.customerAddress) {
    doc.text(`Address: ${bill.customerAddress}`, 20, yPos);
    yPos += 6;
  }
  yPos += 4;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 8;

  // Items Table Header
  doc.setFont('helvetica', 'bold');
  doc.text('S.No', 20, yPos);
  doc.text('Item Name', 40, yPos);
  doc.text('Qty', 120, yPos, { align: 'right' });
  doc.text('Rate/Day (₹)', 145, yPos, { align: 'right' });
  doc.text('Amount (₹)', pageWidth - 20, yPos, { align: 'right' });
  yPos += 2;
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 6;

  // Items
  doc.setFont('helvetica', 'normal');
  bill.items.forEach((item, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(`${index + 1}`, 20, yPos);
    const itemName = item.itemName.length > 30 ? item.itemName.substring(0, 30) + '...' : item.itemName;
    doc.text(itemName, 40, yPos);
    doc.text(`${item.qty}`, 120, yPos, { align: 'right' });
    doc.text(`₹${item.rate.toFixed(2)}`, 145, yPos, { align: 'right' });
    doc.text(`₹${item.amount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 6;
  });

  yPos += 4;
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 8;

  // Totals
  const totalsX = pageWidth - 70;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, yPos);
  doc.text(`₹${subtotal.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 6;

  doc.text('Transport Fees:', totalsX, yPos);
  doc.text(`₹${transportFees.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 6;

  doc.text(`Tax (${bill.taxType || 'GST'} @ ${bill.taxPercentage}%):`, totalsX, yPos);
  doc.text(`₹${taxAmount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 6;

  if (advanceAmount > 0) {
    doc.text('Advance:', totalsX, yPos);
    doc.text(`-₹${advanceAmount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 6;
  }

  yPos += 2;
  doc.setLineWidth(0.8);
  doc.line(totalsX, yPos, pageWidth - 20, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Amount:', totalsX, yPos);
  doc.text(`₹${totalAmount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 8;

  doc.setFontSize(10);
  doc.text(`Payment Status: ${bill.isPaid ? '✓ FULLY PAID' : '⏳ PENDING'}`, totalsX, yPos);
  yPos += 15;

  // QR Code if available
  if (bill.shopQrUrl) {
    try {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Scan to Pay:', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.addImage(bill.shopQrUrl, 'PNG', pageWidth / 2 - 20, yPos, 40, 40);
    } catch (error) {
      console.error('Error adding QR code:', error);
    }
  }

  // Save PDF
  doc.save(`rental-bill-${bill.serialNo}.pdf`);
};