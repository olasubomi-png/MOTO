import Link from "next/link";
import { getFeaturedVehicles, getRecentVehicles, getAvailableBodyTypes } from "@/lib/vehicles";
import { VehicleCard } from "@/components/VehicleCard";
import { siteConfig, buildWhatsAppUrl } from "@/lib/config";

export default function HomePage() {
  const featured = getFeaturedVehicles();
  const recent = getRecentVehicles(4);
  const bodyTypes = getAvailableBodyTypes();
  const whatsappHref = buildWhatsAppUrl(
    "Hello Tosin Signature Motors, I'm interested in your vehicles."
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8 lg:pt-32">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
              {siteConfig.businessName}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Exceptional vehicles.
              <br />
              <span className="text-gold">Uncompromising trust.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-xl">
              {siteConfig.marketingCopy.body}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/inventory"
                className="inline-flex items-center justify-center rounded-full bg-gold px-8 py-3.5 text-base font-semibold text-black hover:bg-gold-light transition-colors"
              >
                Explore Inventory
              </Link>
              <Link
                href="/#contact"
                className="inline-flex items-center justify-center rounded-full border border-border px-8 py-3.5 text-base font-semibold text-foreground hover:border-gold hover:text-gold transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Vehicles */}
      {featured.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-gold mb-2">
                  Handpicked
                </p>
                <h2 className="text-3xl font-bold tracking-tight">Featured Vehicles</h2>
              </div>
              <Link
                href="/inventory"
                className="hidden sm:inline-flex text-sm font-medium text-gold hover:text-gold-light transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featured.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by type */}
      <section className="py-16 sm:py-20 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-gold mb-2">
              Categories
            </p>
            <h2 className="text-3xl font-bold tracking-tight">Browse by Type</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {bodyTypes.map((type) => (
              <Link
                key={type}
                href={`/inventory?bodyType=${encodeURIComponent(type)}`}
                className="group flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-10 transition-all hover:border-gold/50 hover:bg-card-hover"
              >
                <span className="text-2xl font-bold text-foreground group-hover:text-gold transition-colors">
                  {type}
                </span>
                <span className="mt-2 text-sm text-muted-foreground">Explore →</span>
              </Link>
            ))}
            <Link
              href="/inventory"
              className="group flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-transparent px-6 py-10 transition-all hover:border-gold/50"
            >
              <span className="text-2xl font-bold text-muted-foreground group-hover:text-gold transition-colors">
                All
              </span>
              <span className="mt-2 text-sm text-muted-foreground">View inventory →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Recently added */}
      {recent.length > 0 && (
        <section className="py-16 sm:py-20 border-t border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-gold mb-2">
                  Fresh arrivals
                </p>
                <h2 className="text-3xl font-bold tracking-tight">Recently Added</h2>
              </div>
              <Link
                href="/inventory?sort=newest"
                className="hidden sm:inline-flex text-sm font-medium text-gold hover:text-gold-light transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recent.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why choose us */}
      <section id="why-us" className="py-16 sm:py-24 border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-wider text-gold mb-2">
              The Tosin Signature difference
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why choose {siteConfig.businessName}
            </h2>

          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Trusted & Transparent</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every vehicle comes with full history, clear pricing, and honest condition reports. No surprises.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Premium Selection</h3>
              <p className="text-muted-foreground leading-relaxed">
                We carefully select only high-quality, well-maintained vehicles from trusted sources.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Personal Service</h3>
              <p className="text-muted-foreground leading-relaxed">
                From inquiry to delivery, our team is dedicated to making your experience seamless and enjoyable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section id="contact" className="py-16 sm:py-24 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold mb-3">
            Ready when you are
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Find your next vehicle
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Browse our current inventory or reach out directly. We’re here to help you drive away with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/inventory"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-gold px-8 py-3.5 text-base font-semibold text-black hover:bg-gold-light transition-colors"
            >
              Explore Inventory
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border px-8 py-3.5 text-base font-semibold hover:border-gold hover:text-gold transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
