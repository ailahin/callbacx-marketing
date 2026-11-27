import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const metadata: Metadata = {
  title: "Admin Dashboard | CALLBACX MARKETING",
  description: "Manage campaigns, view reports, and export data — secure admin interface for CALLBACX MARKETING.",
  openGraph: {
    title: "Admin Dashboard | CALLBACX MARKETING",
    description: "Secure admin interface for managing campaigns and generating reports.",
    type: "website",
  },
};

export default function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
