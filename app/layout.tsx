import "./globals.css";

export const metadata = {
  title: "Subscription Auditor (Lite)",
  description: "Helps you understand your subscriptions & find cheaper alternatives."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
