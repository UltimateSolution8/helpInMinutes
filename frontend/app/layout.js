export const metadata = {
  title: 'helpInMinutes - Admin Dashboard',
  description: 'Admin portal for helpInMinutes hyperlocal service marketplace',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#f5f5f5' }}>
        {children}
      </body>
    </html>
  );
}
