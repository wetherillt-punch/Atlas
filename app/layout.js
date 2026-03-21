import './globals.css';

export const metadata = { title: 'ATLAS', description: 'Financial Command Center' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
