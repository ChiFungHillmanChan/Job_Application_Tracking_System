import './globals.css';
import AuthWrapper from '@/components/AuthWrapper';

// Define metadata at the top level (server component)
export const metadata = {
  title: 'Job Application Tracker',
  description: 'Track and manage your job applications efficiently',
};

// Server component that includes the client AuthWrapper
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthWrapper>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {children}
          </div>
        </AuthWrapper>
      </body>
    </html>
  );
}