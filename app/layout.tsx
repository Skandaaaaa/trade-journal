import './globals.css';
import Navbar from '@/components/Navbar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
  {children}
</body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
