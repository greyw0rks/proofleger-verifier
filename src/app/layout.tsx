import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ProofLedger Verifier — Bitcoin Document Registry",
  description: "Verify document proofs on the Bitcoin blockchain via Stacks.",
  other: {
    'talentapp:project_verification' : 'e6a139d413b0c1982f4845389528b2638a118f467a7f23c9a57142b94306a9f0cd4a1c45ba836978d34e605daba614f42a325c737704b0a9f23ad6ac7b20b107',
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
