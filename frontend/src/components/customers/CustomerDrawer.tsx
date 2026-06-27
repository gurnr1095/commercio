import { Mail, Phone, ShoppingCart, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useOrders } from "@/api/orders";
import { formatDate, formatMoney } from "@/lib/format";
import type { Customer } from "@/types/customer";
import type { OrderStatus } from "@/types/order";

const STATUS_BADGE: Record<OrderStatus, { variant: "warning" | "info" | "success" | "default"; label: string }> = {
  PENDING: { variant: "warning", label: "Pending" },
  PROCESSING: { variant: "info", label: "Processing" },
  COMPLETED: { variant: "success", label: "Completed" },
  CANCELLED: { variant: "default", label: "Cancelled" },
};

type Props = {
  customer: Customer | null;
  onClose: () => void;
};

export default function CustomerDrawer({ customer, onClose }: Props) {
  const { data: allOrders } = useOrders();
  const orders = (allOrders ?? [])
    .filter((o) => o.customer_id === customer?.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Drawer open={Boolean(customer)} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-start justify-between gap-4 pr-2">
            <div className="space-y-1 min-w-0">
              <DrawerTitle className="text-lg font-semibold text-zinc-100 truncate">
                {customer?.name}
              </DrawerTitle>
              <p className="text-xs text-zinc-400">
                Customer since {formatDate(customer?.created_at)}
              </p>
            </div>
            <DrawerClose className="rounded-md p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors mt-0.5 shrink-0">
              <X size={16} />
              <span className="sr-only">Close</span>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <DrawerBody className="space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-3">
              <p className="text-xs text-zinc-500 mb-0.5">Total Orders</p>
              <p className="text-xl font-bold text-zinc-100">{customer?.total_orders}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-3">
              <p className="text-xs text-zinc-500 mb-0.5">Total Spent</p>
              <p className="text-xl font-bold text-zinc-100">
                {formatMoney(customer?.total_spent ?? 0)}
              </p>
            </div>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">
              Contact
            </h3>
            <div className="space-y-2">
              {customer?.email ? (
                <div className="flex items-center gap-2.5 text-sm text-zinc-300">
                  <Mail size={14} className="text-zinc-500 shrink-0" />
                  <a href={`mailto:${customer.email}`} className="hover:text-violet-400 hover:underline truncate">
                    {customer.email}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-sm text-zinc-600">
                  <Mail size={14} className="shrink-0" />
                  No email on file
                </div>
              )}
              {customer?.phone ? (
                <div className="flex items-center gap-2.5 text-sm text-zinc-300">
                  <Phone size={14} className="text-zinc-500 shrink-0" />
                  <a href={`tel:${customer.phone}`} className="hover:text-violet-400 hover:underline">
                    {customer.phone}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-sm text-zinc-600">
                  <Phone size={14} className="shrink-0" />
                  No phone on file
                </div>
              )}
            </div>
          </div>

          {/* Order history */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">
              Order History ({orders.length})
            </h3>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingCart size={28} className="text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-500">No orders yet</p>
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-violet-950/40 border-b border-violet-900/50">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-violet-400 uppercase tracking-wide">
                        Order
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-violet-400 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-violet-400 uppercase tracking-wide">
                        Total
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-violet-400 uppercase tracking-wide">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const badge = STATUS_BADGE[order.status];
                      return (
                        <tr key={order.id} className="border-b border-zinc-800 last:border-0">
                          <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                            #{order.id}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-zinc-100 tabular-nums whitespace-nowrap">
                            {formatMoney(order.total)}
                          </td>
                          <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                            {formatDate(order.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
