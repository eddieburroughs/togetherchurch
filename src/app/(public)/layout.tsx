import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

const APP_HOST =
  process.env.APP_CANONICAL_HOST ?? "com.togetherchurch.app";
const APP_URL = `https://${APP_HOST}/login`;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader appUrl={APP_URL} />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
