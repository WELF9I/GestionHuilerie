# Gestion Huilerie

A comprehensive web application for managing olive oil production facilities (huilerie). This Next.js-based system provides complete oversight of employees, suppliers, purchases, pressing operations, tank storage, sales, and pomace management.

## Features

- **Dashboard**: Overview of key metrics including employee count, supplier count, oil stock, and monthly sales
- **Employee Management**: Track and manage workforce information and payroll
- **Supplier Management**: Maintain supplier database and purchase records
- **Purchase Tracking**: Record olive purchases from suppliers with quality grading
- **Pressing Operations**: Log olive pressing operations with extraction rates and costs
- **Tank Management**: Monitor oil storage tanks with capacity tracking and movements
- **Sales Management**: Record oil sales with customer details and payment tracking
- **Pomace Management**: Track olive press residues (grignons) and sales
- **Audit Logs**: Complete audit trail of all system changes
- **Settings**: Database export/import and system configuration
- **Authentication**: Simple password-based access control

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS, Radix UI
- **Database**: SQLite with better-sqlite3
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+ and pnpm
- SQLite (better-sqlite3 handles this automatically)
- Linux/Windows/macOS

**Note**: If you encounter issues with better-sqlite3, ensure proper compilation of native bindings. See `SQLITE-PROBLEM.md` for troubleshooting.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/WELF9I/GestionHuilerie.git
   cd GestionHuilerie
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Login**: Use password `hassenadmin` to access the application.

2. **Navigation**: Use the sidebar to navigate between different modules.

3. **Data Management**:
   - Add/edit records through dialog forms
   - View data in tables with search and filtering
   - Export/import database backups in Settings

4. **Key Workflows**:
   - Record olive purchases and allocate to pressing operations
   - Log pressing operations with oil extraction data
   - Track oil movements between tanks
   - Record sales and manage inventory
   - Manage pomace stock and sales

## Database Schema

The application uses SQLite with the following main tables:
- `employees`: Employee information and payroll data
- `suppliers`: Supplier details and contact information
- `olive_purchases`: Olive purchase records with quality grading
- `pressing_sessions`: Pressing operation logs with extraction data
- `storage_tanks`: Oil storage tank information and capacity
- `tank_storage`: Tank storage allocations and inventory
- `customers`: Customer database for sales
- `sales`: Oil sales records with payment tracking
- `pomace_stock`: Pomace (grignons) inventory management
- `pomace_sales`: Pomace sales records
- `audit_logs`: Complete audit trail of system changes
- `settings`: System configuration and preferences

Database initialization and migrations are handled automatically on startup.

## API Endpoints

The application includes REST API endpoints for all CRUD operations:
- `/api/dashboard/stats`: Dashboard statistics
- `/api/employees`: Employee management
- `/api/payroll`: Payroll operations
- `/api/suppliers`: Supplier management
- `/api/purchases`: Purchase records
- `/api/pressing`: Pressing operations
- `/api/tanks`: Tank management
- `/api/tank-movements`: Tank movements
- `/api/sales`: Sales records
- `/api/pomace`: Pomace management
- `/api/settings/export`: Database export
- `/api/settings/import`: Database import

## Scripts

- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm start`: Start production server
- `pnpm lint`: Run ESLint

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── employees/         # Employee management
│   ├── suppliers/         # Supplier management
│   ├── purchases/         # Purchase tracking
│   ├── pressing/          # Pressing operations
│   ├── tanks/             # Tank management
│   ├── sales/             # Sales management
│   ├── pomace/            # Pomace management
│   └── settings/          # System settings
├── components/            # Reusable UI components
├── lib/                   # Utility functions and database
├── scripts/               # Database initialization
└── public/                # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

- **Database Issues**: Check `SQLITE-PROBLEM.md` for common better-sqlite3 issues
- **Build Errors**: Ensure Node.js version is 18+ and run `pnpm install --force`
- **Authentication**: Default password is `hassenadmin`

## License

This project is proprietary software. All rights reserved.

## Support

For issues or questions, please create an issue in the repository or check the troubleshooting documentation.</content>
<filePath">/home/welf9i/GestionHuilerie/README.md