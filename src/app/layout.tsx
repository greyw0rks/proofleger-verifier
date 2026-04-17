import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ProofLedger Verifier — Bitcoin Document Registry",
  description: "Verify document proofs on the Bitcoin blockchain via Stacks.",
  other: {
  'talentapp:project_verification':
'c362d4f4a87b8e9f4828a06aba18b95b8bff8691a6c6ee5a9d36e339f049fa7d336bf0cb5b2c13460d204439b21b341bacf5a85087d937e1f1ee49c9109f8637',
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
