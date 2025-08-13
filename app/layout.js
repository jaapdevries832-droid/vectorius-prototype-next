export const metadata = {
  title: 'Vectorius Prototype',
  description: 'Role-based dashboards for students, parents, and mentors',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}