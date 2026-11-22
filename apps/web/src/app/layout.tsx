import type { Metadata } from 'next';
import './globals.css';
import '@/styles/standard_cart.css';
import { AuthProvider } from '@/context/AuthContext';
import { ImpersonateBanner } from '@/components/ImpersonateBanner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { RegistrationGuard } from '@/components/RegistrationGuard';

export const metadata: Metadata = {
  title: 'Central Account Platform | Enterprise Auth',
  description: 'Enterprise Central Account, Authentication, and Multi-Factor Security Platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          <ImpersonateBanner />
          <Navbar />
          <RegistrationGuard>
            <main className="flex-1 flex flex-col">{children}</main>
          </RegistrationGuard>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
