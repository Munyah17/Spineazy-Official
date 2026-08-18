import { AdminSupportThreadClient } from "@/components/admin/support-thread-client";

export default async function AdminSupportTicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  return <AdminSupportThreadClient ticketId={ticketId} />;
}
