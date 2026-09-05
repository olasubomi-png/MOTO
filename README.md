# MOTO / MOTOR

**Premium automotive dealership platform for Signature Motors**

> Driven by Trust. Built for You.

## About

MOTOR is the digital showroom and inventory management platform for **Signature Motors**.  
The dealership owner can add a new vehicle from the admin dashboard and it immediately appears on the public website.

### Brand
- **Business**: Signature Motors
- **Platform**: MOTOR
- **Tagline**: Driven by Trust. Built for You.
- **Colors**: Black, White, Gold (accent)

## Features (current)

### Public Website
- High-impact Home page with hero, featured vehicles, categories, recently added, why-us section, WhatsApp CTA
- Full Inventory page with search + filters (make, body type, fuel, transmission, sort)
- Vehicle cards with availability badges (Available / Reserved / Sold / Featured)
- Responsive design (mobile-first)
- Official Signature Motors logo integrated

### Data Layer
- All vehicles stored in `data/vehicles.json` (not hardcoded)
- Full CRUD helpers ready for admin
- Search, filter, sort, featured, stats

### Coming next
- Vehicle detail pages with gallery + full specs
- Secure Admin Dashboard (add/edit/delete/publish/sold/reserved)
- Image uploads
- Customer inquiry forms
- SEO (metadata, sitemap, OG tags)

## Tech Stack

- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS v4
- Server-side data layer (JSON → ready for Prisma/Postgres later)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
  app/           # Pages (Home, Inventory, later Detail + Admin)
  components/    # Header, Footer, VehicleCard, Filters...
  lib/           # vehicles.ts (data access)
data/
  vehicles.json  # Sample inventory (realistic premium cars)
public/
  logo.jpg       # Official Signature Motors logo
```

## Sample Vehicles

Includes realistic listings for:
- Mercedes-Benz S-Class
- BMW X7 & 5 Series
- Range Rover Sport
- Lexus LX 600
- Porsche Cayenne
- Toyota Land Cruiser
- Audi Q8

## License

Private project for Signature Motors.
