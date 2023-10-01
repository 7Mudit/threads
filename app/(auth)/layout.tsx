import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "../globals.css";

export const metadata = {
  title: "Learn To Code",
  description: "Nextjs 13 meta Learn To Code application",
};

const inter = Inter({ subsets: ["latin"] });

// in typescript you have to define the types of prop
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-dark-1`}>
          <div className="w-full flex justify-center items-center min-h-screen">
          {children}
          </div>
          
          
          </body>
      </html>
    </ClerkProvider>
  );
}
