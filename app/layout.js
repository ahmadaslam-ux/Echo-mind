export const metadata = {
  title: "Saathi — AI Assistant",
  description: "Ask me anything, in any language.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
