import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getVehicleById,
  getRelatedVehicles,
  formatPrice,
  formatMileage,
} from "@/lib/vehicles";
import { siteConfig, buildWhatsAppUrl } from "@/lib/config";
import { VehicleGallery } from "@/components/VehicleGallery";
import { VehicleCard } from "@/components/VehicleCard";
import { ShareButton } from "@/components/ShareButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const vehicle = getVehicleById(id);

  if (!vehicle) {
    return {
      title: "Vehicle Not Found",
      description: "The requested vehicle could not be found.",
    };
  }

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const description =
    vehicle.description?.slice(0, 155) ||
    `${title} at ${siteConfig.businessName}. ${formatPrice(vehicle.price, vehicle.currency)}. ${vehicle.mileage.toLocaleString()} km.`;

  const ogImage = vehicle.images?.[0]
    ? { url: vehicle.images[0], alt: title }
    : { url: "/logo.jpg", alt: siteConfig.businessName };

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      title: `${title} | ${siteConfig.businessName}`,
      description,
      type: "website",
      siteName: siteConfig.businessName,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.businessName}`,
      description,
    },
  };


  // Canonical only when a real site URL is configured
  if (siteConfig.siteUrl) {
    const base = siteConfig.siteUrl.replace(/\/$/, "");
    metadata.alternates = {
      canonical: `${base}/inventory/${vehicle.id}`,
    };
  }

  return metadata;
}

function buildInquiryMessage(
  vehicle: {
    id: string;
    year: number;
    make: string;
    model: string;
    price: number;
    currency: string;
    availability: string;
  }
): string {
  const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const price = formatPrice(vehicle.price, vehicle.currency);
  if (vehicle.availability === "reserved") {
    return `Hello Tosin Signature Motors, I'm interested in the ${name} (${price}, ID: ${vehicle.id}) which is currently marked as reserved. Please let me know if it becomes available or if you have similar vehicles.`;
  }
  return `Hello Tosin Signature Motors, I'm interested in the ${name} (${price}, ID: ${vehicle.id}). Is it still available?`;
}


export default async function VehicleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const vehicle = getVehicleById(id);

  if (!vehicle) {
    notFound();
  }

  const related = getRelatedVehicles(vehicle, 4);
  const isAvailable = vehicle.availability === "available";
  const isReserved = vehicle.availability === "reserved";
  const isSold = vehicle.availability === "sold";

  const whatsappUrl = buildWhatsAppUrl(buildInquiryMessage(vehicle));
  const sharePath = `/inventory/${vehicle.id}`;
  const shareTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const shareText = `Check out this ${shareTitle} at ${siteConfig.businessName} – ${formatPrice(vehicle.price, vehicle.currency)}`;


  const specs = [
    { label: "Year", value: String(vehicle.year) },
    { label: "Mileage", value: formatMileage(vehicle.mileage) },
    { label: "Transmission", value: vehicle.transmission },
    { label: "Fuel", value: vehicle.fuel },
    { label: "Engine", value: vehicle.engine },
    { label: "Body Type", value: vehicle.bodyType },
    { label: "Exterior", value: vehicle.exteriorColor },
    { label: "Interior", value: vehicle.interiorColor },
    { label: "Condition", value: vehicle.condition },
    { label: "Location", value: vehicle.location },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-gold transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-border">
            /
          </li>
          <li>
            <Link href="/inventory" className="hover:text-gold transition-colors">
              Inventory
            </Link>
          </li>
          <li aria-hidden="true" className="text-border">
            /
          </li>
          <li className="truncate text-foreground font-medium" aria-current="page">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-12">
        {/* Gallery */}
        <div className="lg:col-span-3 min-w-0">
          <VehicleGallery
            images={vehicle.images}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          />
        </div>

        {/* Info panel */}
        <div className="lg:col-span-2 min-w-0">
          <div className="sticky top-24 space-y-6">
            {/* Availability */}
            <div>
              {isAvailable && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Available
                </span>
              )}
              {isReserved && (
                <span className="inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Reserved
                </span>
              )}
              {isSold && (
                <span className="inline-flex items-center rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-400">
                  Sold
                </span>
              )}
            </div>

            {/* Title & price */}
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-gold mb-1">
                {vehicle.year} · {vehicle.bodyType}
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {vehicle.make} {vehicle.model}
              </h1>
              <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                {formatPrice(vehicle.price, vehicle.currency)}
              </p>
            </div>

            {/* Quick facts */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">Mileage</p>
                <p className="font-medium">{formatMileage(vehicle.mileage)}</p>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">Transmission</p>
                <p className="font-medium">{vehicle.transmission}</p>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">Fuel</p>
                <p className="font-medium">{vehicle.fuel}</p>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">Engine</p>
                <p className="font-medium truncate" title={vehicle.engine}>
                  {vehicle.engine}
                </p>
              </div>
            </div>

            {/* Primary CTAs */}
            <div className="space-y-3">
              {!isSold ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#20bd5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold min-h-[48px]"

                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {isReserved ? "Enquire about this reserved vehicle" : "Enquire on WhatsApp"}
                </a>
              ) : (
                <div className="rounded-xl border border-border bg-card px-5 py-4 text-center">
                  <p className="font-medium text-foreground">This vehicle has been sold</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Browse our current inventory for similar options.
                  </p>
                  <Link
                    href="/inventory"
                    className="mt-3 inline-flex text-sm font-medium text-gold hover:text-gold-light"
                  >
                    View inventory →
                  </Link>
                </div>
              )}

              <div className="flex gap-3">
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm font-medium transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold min-h-[48px]"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Call {siteConfig.phoneDisplay}
                </a>
                <ShareButton title={shareTitle} text={shareText} path={sharePath} />
              </div>

            </div>

            {isReserved && (
              <p className="text-sm text-amber-400/90">
                This vehicle is currently reserved. You can still enquire — it may become available again.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Specs + Description + Features */}
      <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <section className="lg:col-span-1 min-w-0">
          <h2 className="text-lg font-semibold tracking-tight mb-5">Specifications</h2>
          <dl className="space-y-0 divide-y divide-border rounded-xl border border-border overflow-hidden">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="flex justify-between gap-4 bg-card px-4 py-3.5 text-sm"
              >
                <dt className="text-muted-foreground shrink-0">{spec.label}</dt>
                <dd className="font-medium text-right text-foreground">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="lg:col-span-2 space-y-10 min-w-0">
          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-4">Description</h2>
            <div className="text-muted-foreground leading-relaxed">
              <p>{vehicle.description}</p>
            </div>
          </section>

          {vehicle.features && vehicle.features.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold tracking-tight mb-5">Features</h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {vehicle.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold" aria-hidden="true">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="font-medium text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Related vehicles */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-border pt-12">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-gold mb-1">
              Discover more
            </p>
            <h2 className="text-2xl font-bold tracking-tight">You May Also Like</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
