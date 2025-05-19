import './globals.css';

export const metadata = {
  title: 'Job Application Tracker',
  description: 'Track and manage your job applications efficiently',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {children}
        </div>
      </body>
    </html>
  );
}