// Local Storage Database Manager for Shop Billing System

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  rate: number;
  category?: string;
  createdAt: string;
}

export interface BillItem {
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface SalesBill {
  id: string;
  serialNo: number;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: BillItem[];
  subtotal: number;
  taxAmount: number;
  taxType?: string;
  advanceAmount: number;
  totalAmount: number;
  isPaid: boolean;
  customerFeedback?: 'very_good' | 'good' | 'bad';
  createdAt: string;
  updatedAt: string;
}

export interface RentalBill {
  id: string;
  serialNo: number;
  fromDate: string;
  toDate?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: BillItem[];
  subtotal: number;
  transportFees: number;
  taxAmount: number;
  taxType?: string;
  advanceAmount: number;
  totalAmount: number;
  isPaid: boolean;
  customerFeedback?: 'very_good' | 'good' | 'bad';
  createdAt: string;
  updatedAt: string;
}

export interface CalendarBooking {
  id: string;
  date: string;
  billType: 'sales' | 'rental';
  customerName: string;
  customerPhone: string;
  notes?: string;
  createdAt: string;
}

class Database {
  private getFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  }

  private saveToStorage<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Sales Bills
  getSalesBills(): SalesBill[] {
    return this.getFromStorage('salesBills', []);
  }

  saveSalesBill(bill: Omit<SalesBill, 'id' | 'serialNo' | 'createdAt' | 'updatedAt'>): SalesBill {
    const bills = this.getSalesBills();
    const serialNo = bills.length > 0 ? Math.max(...bills.map(b => b.serialNo)) + 1 : 1;
    const newBill: SalesBill = {
      ...bill,
      id: `SB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      serialNo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    bills.push(newBill);
    this.saveToStorage('salesBills', bills);
    this.saveCustomer({ name: bill.customerName, phone: bill.customerPhone, address: bill.customerAddress });
    return newBill;
  }

  updateSalesBill(id: string, updates: Partial<SalesBill>): void {
    const bills = this.getSalesBills();
    const index = bills.findIndex(b => b.id === id);
    if (index !== -1) {
      bills[index] = { ...bills[index], ...updates, updatedAt: new Date().toISOString() };
      this.saveToStorage('salesBills', bills);
    }
  }

  deleteSalesBill(id: string): void {
    const bills = this.getSalesBills().filter(b => b.id !== id);
    this.saveToStorage('salesBills', bills);
  }

  // Rental Bills
  getRentalBills(): RentalBill[] {
    return this.getFromStorage('rentalBills', []);
  }

  saveRentalBill(bill: Omit<RentalBill, 'id' | 'serialNo' | 'createdAt' | 'updatedAt'>): RentalBill {
    const bills = this.getRentalBills();
    const serialNo = bills.length > 0 ? Math.max(...bills.map(b => b.serialNo)) + 1 : 1;
    const newBill: RentalBill = {
      ...bill,
      id: `RB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      serialNo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    bills.push(newBill);
    this.saveToStorage('rentalBills', bills);
    this.saveCustomer({ name: bill.customerName, phone: bill.customerPhone, address: bill.customerAddress });
    return newBill;
  }

  updateRentalBill(id: string, updates: Partial<RentalBill>): void {
    const bills = this.getRentalBills();
    const index = bills.findIndex(b => b.id === id);
    if (index !== -1) {
      bills[index] = { ...bills[index], ...updates, updatedAt: new Date().toISOString() };
      this.saveToStorage('rentalBills', bills);
    }
  }

  deleteRentalBill(id: string): void {
    const bills = this.getRentalBills().filter(b => b.id !== id);
    this.saveToStorage('rentalBills', bills);
  }

  // Customers
  getCustomers(): Customer[] {
    return this.getFromStorage('customers', []);
  }

  saveCustomer(data: { name: string; phone: string; address: string }): void {
    const customers = this.getCustomers();
    const existing = customers.find(c => c.phone === data.phone);
    if (existing) {
      existing.name = data.name;
      existing.address = data.address;
    } else {
      customers.push({
        id: `C-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: new Date().toISOString(),
      });
    }
    this.saveToStorage('customers', customers);
  }

  searchCustomers(query: string): Customer[] {
    const customers = this.getCustomers();
    const lowerQuery = query.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.phone.includes(query) ||
      c.address.toLowerCase().includes(lowerQuery)
    );
  }

  // Products
  getProducts(): Product[] {
    return this.getFromStorage('products', []);
  }

  saveProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `P-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    products.push(newProduct);
    this.saveToStorage('products', products);
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      this.saveToStorage('products', products);
    }
  }

  deleteProduct(id: string): void {
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveToStorage('products', products);
  }

  searchProducts(query: string): Product[] {
    const products = this.getProducts();
    const lowerQuery = query.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(lowerQuery));
  }

  // Calendar Bookings
  getBookings(): CalendarBooking[] {
    return this.getFromStorage('calendarBookings', []);
  }

  saveBooking(booking: Omit<CalendarBooking, 'id' | 'createdAt'>): CalendarBooking {
    const bookings = this.getBookings();
    const newBooking: CalendarBooking = {
      ...booking,
      id: `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    bookings.push(newBooking);
    this.saveToStorage('calendarBookings', bookings);
    return newBooking;
  }

  deleteBooking(id: string): void {
    const bookings = this.getBookings().filter(b => b.id !== id);
    this.saveToStorage('calendarBookings', bookings);
  }
}

export const db = new Database();