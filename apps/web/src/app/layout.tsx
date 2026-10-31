import type { Metadata } from 'next';
import './globals.css';
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
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
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
