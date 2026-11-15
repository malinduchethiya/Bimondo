import React from 'react';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';

export const metadata = {
  title: 'Admin Panel | Bimondo Travels',
  description: 'Protected administrator content management interface.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
