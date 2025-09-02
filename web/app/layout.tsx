import "./globals.css";
import React from "react";

export const metadata = {
  title: "Vectorius Prototype",
  description: "Role-based dashboards for students, parents, and mentors",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
