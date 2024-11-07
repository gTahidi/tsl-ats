import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AntdRegistry from "@/app/components/AntdRegistry";
import MainLayout from "@/app/components/layout/MainLayout";
import { headers } from "next/headers";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ATS System",
  description: "Applicant Tracking System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const pathname = headersList.get("x-invoke-path") || "";
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.has("auth");
  const isLoginPage = pathname === "/login";

  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0 }}>
        <AntdRegistry>
          {isLoginPage || !isAuthenticated ? (
            children
          ) : (
            <MainLayout>{children}</MainLayout>
          )}
        </AntdRegistry>
      </body>
    </html>
  );
}
