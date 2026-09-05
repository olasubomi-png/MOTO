import Link from "next/link";

export default function VehicleNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-gold mb-3">
        404
      </p>
      <h1 className="text-3xl font-bold tracking-tight mb-4">
        Vehicle not found
      </h1>
      <p className="text-muted-foreground mb-8">
        The vehicle you’re looking for doesn’t exist or may have been removed from our inventory.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/inventory"
          className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black hover:bg-gold-light transition-colors"
        >
          Browse Inventory
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium hover:border-gold hover:text-gold transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
