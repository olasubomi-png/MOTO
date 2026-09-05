import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Image
              src="/logo.jpg"
              alt="Signature Motors"
              width={160}
              height={54}
              className="h-12 w-auto object-contain mb-4"
            />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium vehicles. Trusted service. Driven by trust. Built for you.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gold uppercase mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/inventory" className="hover:text-gold transition-colors">
                  All Inventory
                </Link>
              </li>
              <li>
                <Link href="/inventory?bodyType=SUV" className="hover:text-gold transition-colors">
                  SUVs
                </Link>
              </li>
              <li>
                <Link href="/inventory?bodyType=Sedan" className="hover:text-gold transition-colors">
                  Sedans
                </Link>
              </li>
              <li>
                <Link href="/inventory?featured=true" className="hover:text-gold transition-colors">
                  Featured
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gold uppercase mb-4">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/#why-us" className="hover:text-gold transition-colors">
                  Why Signature Motors
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-gold transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/2348000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold transition-colors"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gold uppercase mb-4">
              Get in Touch
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>Lagos, Nigeria</li>
              <li>
                <a href="tel:+2348000000000" className="hover:text-gold transition-colors">
                  +234 800 000 0000
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@signaturemotors.com"
                  className="hover:text-gold transition-colors"
                >
                  hello@signaturemotors.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Signature Motors. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground tracking-wide">
            DRIVEN BY TRUST. BUILT FOR YOU.
          </p>
        </div>
      </div>
    </footer>
  );
}
