'use client';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Navigation lives in the shared Header (desktop) and BottomNav (phone)
  return (
    <main className="px-4 pt-5 pb-8 md:pt-8">
      <div className="max-w-3xl mx-auto">
        {children}
      </div>
    </main>
  );
}
