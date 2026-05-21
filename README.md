
# Inventory Management System

A full-stack web application for managing product inventory with user authentication, CRUD operations, search functionality, and comprehensive reporting.

## Features

- **User Authentication**: Login/Register system with JWT tokens
- **Product Management**: Add, edit, delete, and search products
- **Inventory Tracking**: Real-time stock levels and quantity management
- **Stock Reports**: Comprehensive reporting with statistics and export options
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Print & Export**: Print reports and export data to CSV
- **Low Stock Alerts**: Visual indicators for products with low inventory

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **SQLite3** - Database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with modern design
- **Vanilla JavaScript** - Client-side functionality
- **Responsive Design** - Mobile-first approach

## Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Step 1: Clone/Download Files
Create a new folder for your project and add all the provided files in the following structure:

```
inventory-management-system/
├── server.js
├── package.json
├── inventory.db (will be created automatically)
└── public/
    ├── login.html
    ├── dashboard.html
    ├── add.html
    ├── search.html
    └── report.html
```

### Step 2: Install Dependencies
Open terminal/command prompt in the project folder and run:

```bash
npm install
```

This will install all required dependencies:
- express
- sqlite3
- bcryptjs
- jsonwebtoken
- cookie-parser
- cors

### Step 3: Run the Application
Start the server:

```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### Step 4: Access the Application
Open your web browser and go to:
```
http://localhost:5000
```

## Default Login Credentials

When you first run the application, a default admin user is created:

- **Username**: `admin`
- **Password**: `admin123`

> **Important**: Change these credentials after first login by registering a new user.

## Usage

### 1. Login/Registration
- Use the default credentials or register a new account
- The system uses JWT tokens for secure authentication
- Sessions persist until logout

### 2. Dashboard
- Overview of inventory statistics
- Quick access to all main functions
- Real-time stock summary

### 3. Add Product
- Add new products with name, quantity, and price
- Form validation ensures data integrity
- Automatic redirect to dashboard after successful addition

### 4. Search & Manage Products
- Search products by name (partial matching)
- View all products in a comprehensive table
- Edit product details in-place
- Delete products with confirmation
- Real-time updates

### 5. Stock Reports
- Comprehensive inventory reports
- Export data to CSV format
- Print-friendly layouts
- Stock status indicators (Normal, Low Stock, Out of Stock)

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/auth/check` - Check authentication status

### Products
- `GET /api/products` - Get all products
- `GET /api/products/search/:name` - Search products by name
- `POST /api/products` - Add new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Pages (Protected Routes)
- `GET /` - Login page
- `GET /dashboard` - Dashboard (requires auth)
- `GET /add` - Add product page (requires auth)
- `GET /search` - Search page (requires auth)
- `GET /report` - Report page (requires auth)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **HTTP-only Cookies**: Tokens stored securely
- **Input Validation**: Both client and server-side validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Protection**: Controlled cross-origin requests

## Customization

### Changing Port
Edit the `PORT` variable in `server.js`:
```javascript
const PORT = process.env.PORT || 3000; // Change 5000 to desired port
```

### Database Location
By default, SQLite database is created as `inventory.db` in the root folder. To change:
```javascript
const db = new sqlite3.Database('./your-database-name.db');
```

### JWT Secret
Change the JWT secret in production:
```javascript
const JWT_SECRET = 'your-super-secure-secret-key';
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change the port in `server.js` or kill the process using the port

2. **Database Errors**
   - Delete `inventory.db` file and restart the server to recreate database

3. **Authentication Issues**
   - Clear browser cookies and try logging in again
   - Check if JWT_SECRET is consistent

4. **Module Not Found**
   - Run `npm install` to ensure all dependencies are installed

### Development Tips

1. Use `npm run dev` with nodemon for auto-restart during development
2. Check browser console for client-side errors
3. Check terminal/command prompt for server-side errors
4. Use browser developer tools to inspect network requests

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Future Enhancements

- [ ] User roles and permissions
- [ ] Product categories and tags
- [ ] Barcode scanning
- [ ] Email notifications for low stock
- [ ] Advanced analytics and charts
- [ ] Supplier management
- [ ] Purchase order system
- [ ] Multi-warehouse support

Quick Setup:

Create a new folder and add all the files I provided
Open terminal in the folder
Run: npm install
Run: npm start
Open: http://localhost:5000
Login with: username=admin, password=admin123

The system automatically creates the SQLite database and default admin user on first run. You can immediately start adding products and managing your inventory!
