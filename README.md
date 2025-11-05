# 🏪 SREE SAI DURGA - Shop Billing System

A comprehensive, AI-powered billing and inventory management system built with Next.js 15, featuring automated stock tracking, analytics, and intelligent customer management.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

### 💰 **Sales & Rental Billing**
- **Dual Billing System**: Separate modules for sales and rental transactions
- **Auto-incrementing Serial Numbers**: Unique bill numbering for each type
- **Smart Customer Lookup**: Autocomplete with previous customer data
- **Dynamic Item Management**: Add multiple items with real-time calculations
- **Tax Management**: Percentage-based or manual tax entry with GST/VAT support
- **Payment Tracking**: Mark bills as paid, advance, or pending
- **Customer Feedback**: Collect emoji-based feedback (not printed on bills)

### 📊 **Inventory Management**
- **Real-time Stock Tracking**: Automatic stock reduction on sales
- **Low Stock Alerts**: Visual indicators and notifications
- **Stock History**: Track all inventory changes
- **Product Categories**: Organize products by type (sales/rental)
- **Restock Management**: Easy inventory updates
- **Analytics Dashboard**: Sales trends and product performance

### 📋 **Record Management**
- **Advanced Search**: Filter by customer name, phone, or bill number
- **Date Range Filtering**: Find records within specific periods
- **Bulk Operations**: Download all or delete multiple records
- **Edit Capability**: Modify existing bills
- **PDF Export**: Professional bill generation with shop branding
- **WhatsApp Sharing**: Share bills directly via WhatsApp

### 📈 **Analytics & Reports**
- **Sales Dashboard**: Real-time sales metrics and charts
- **Rental Dashboard**: Rental activity tracking
- **Customer Behavior**: Feedback analytics
- **Product Performance**: Best sellers and rental items
- **Financial Overview**: Revenue, pending, and advance tracking

### 💾 **Storage Management**
- **Storage Monitoring**: Track database usage (10GB limit)
- **Record Counting**: View counts for all data types
- **Usage Breakdown**: See storage per category
- **Visual Progress**: Percentage-based storage indicators

### 📅 **Calendar & Bookings**
- **Event Scheduling**: Pre-book sales or rental events
- **Visual Calendar**: Month view with booking indicators
- **Notifications**: Reminders for scheduled bookings

### ⚙️ **Settings & Customization**
- **Shop Profile**: Update name, address, contact details
- **Logo Upload**: Add custom shop logo to bills
- **Payment QR Code**: Include payment QR on printed bills
- **Theme Support**: Light and dark mode
- **Multi-language Ready**: English by default

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/sree-sai-durga-billing.git
cd sree-sai-durga-billing
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
# Database (Turso)
DATABASE_URL=your_turso_database_url
DATABASE_AUTH_TOKEN=your_turso_auth_token

# Better Auth
BETTER_AUTH_SECRET=your_secret_key_here
BETTER_AUTH_URL=http://localhost:3000

# Optional: Google OAuth (if needed)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

4. **Push database schema**
```bash
npm run db:push
```

5. **Run the development server**
```bash
npm run dev
# or
bun dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS v4**: Utility-first styling
- **Shadcn/UI**: Beautiful component library
- **Framer Motion**: Smooth animations
- **Lucide Icons**: Modern icon set

### Backend
- **Drizzle ORM**: Type-safe database queries
- **Turso**: SQLite-compatible edge database
- **Better Auth**: Authentication system
- **Server Actions**: Direct database operations

### Data Visualization
- **Recharts**: Interactive charts and graphs
- **Date-fns**: Date manipulation and formatting

### PDF Generation
- **jsPDF**: Client-side PDF generation
- **html2canvas**: Screenshot-based PDF creation

## 🎯 Key Features Explained

### Stock Reduction on Sales
When a sales bill is saved, the system automatically:
1. Finds the product by name
2. Reduces stock quantity by sold amount
3. Updates `totalSales` counter
4. Creates stock history entry

### Low Stock Alerts
Products trigger alerts when `stockQuantity < minStockLevel`:
- Red banner at top of Product Details page
- Toast notifications
- Highlighted cards
- Dedicated "Low Stock" tab

### Bill Number Format
Bills display as `#001`, `#002`, etc. (padded with zeros) for professional appearance.

### Performance Optimizations
- **Memoized Calculations**: React `useMemo` for computed values
- **Debounced Search**: 300ms delay on search inputs
- **Lazy Loading**: Components load on demand
- **Indexed Queries**: Database indexes on frequently queried fields
- **Batch Operations**: Bulk delete/download for efficiency

## 📱 Mobile Responsive

Fully responsive design works on:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Large screens (1920px+)

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed on:
- Netlify
- Railway
- Render
- Any platform supporting Next.js

## 🔐 Security

- ✅ Password hashing with bcrypt
- ✅ JWT-based session management
- ✅ CSRF protection
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ Input validation and sanitization
- ✅ Protected API routes

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and queries:
- 📧 Email: support@sreesaidurga.com
- 📱 Phone: 9790548669, 9442378669
- 🏪 Address: MAIN ROAD, THIRUVENNAI NALLUR Kt, VILLUPURAM Dt, PINCODE: 607203

---

## 🚀 Making Your Repository Public on GitHub

### Step 1: Create a GitHub Account
1. Go to [github.com](https://github.com)
2. Sign up for a free account (if you don't have one)

### Step 2: Create a New Repository

1. **Click the "+" icon** in the top right → "New repository"
2. **Repository settings**:
   - Name: `sree-sai-durga-billing`
   - Description: "Shop Billing System with Inventory Management"
   - Visibility: **PUBLIC** ✅
   - ✅ Add a README file
   - Choose license: **MIT License**

### Step 3: Push Your Code

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Complete billing system"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/sree-sai-durga-billing.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Verify Repository is Public

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll to **Danger Zone**
4. Verify "Change repository visibility" shows **Public**

### Step 5: Add Repository Topics (Optional)

Add topics for better discoverability:
- `nextjs`
- `billing-system`
- `inventory-management`
- `typescript`
- `tailwindcss`
- `shop-management`
- `pos-system`

### Step 6: Share Your Repository

Your repository is now public at:
```
https://github.com/YOUR_USERNAME/sree-sai-durga-billing
```

Share this link with anyone! 🎉

---

**Made with ❤️ for SREE SAI DURGA**

*Empowering businesses with intelligent billing solutions*