import './globals.css';
import Header from '@/components/layout/Header';
import AuthWrapper from '@/components/AuthWrapper';

export const metadata = {
  title: 'Job Application Tracker',
  description: 'Track and manage your job applications efficiently',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <AuthWrapper>
            <Header />
            {children}
          </AuthWrapper>
        </div>
      </body>
    </html>
  );
}