import './globals.css';

export const metadata = {
  title: 'Waiting Room',
  description: 'A small queue manager used to demonstrate a DevOps delivery chain.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
