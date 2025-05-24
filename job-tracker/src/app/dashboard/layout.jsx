'use client';

export default function DashboardLayout({ children }) {


  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Main content area */}
        <main className="relative z-0 flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}