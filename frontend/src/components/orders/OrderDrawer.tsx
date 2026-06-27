import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useUpdateOrderStatus } from "@/api/orders";
import { formatDate, formatMoney } from "@/lib/format";
import type { Order, OrderStatus } from "@/types/order";

type StatusConfig = {
  variant: "warning" | "info" | "success" | "default";
  label: string;
};

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  PENDING: { variant: "warning", label: "Pending" },
  PROCESSING: { variant: "info", label: "Processing" },
  COMPLETED: { variant: "success", label: "Completed" },
  CANCELLED: { variant: "default", label: "Cancelled" },
};

type Action = {
  label: string;
  next: OrderStatus;
  variant: "default" | "destructive" | "outline";
};

const STATUS_ACTIONS: Record<OrderStatus, Action[]> = {
  PENDING: [
    { label: "Start Processing", next: "PROCESSING", variant: "default" },
    { label: "Cancel Order", next: "CANCELLED", variant: "destructive" },
  ],
  PROCESSING: [
    { label: "Mark Completed", next: "COMPLETED", variant: "default" },
    { label: "Cancel Order", next: "CANCELLED", variant: "destructive" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

type Props = {
  order: Order | null;
  onClose: () => void;
};

export default function OrderDrawer({ order, onClose }: Props) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const updateStatus = useUpdateOrderStatus();

  useEffect(() => {
    setConfirmCancel(false);
  }, [order?.id]);

  async function handleAction(next: OrderStatus) {
    if (!order) return;
    try {
      await updateStatus.mutateAsync({ id: order.id, status: next });
      toast.success(
        next === "PROCESSING"
          ? `Order #${order.id} is now processing`
          : next === "COMPLETED"
          ? `Order #${order.id} completed`
          : `Order #${order.id} cancelled`
      );
      if (next === "COMPLETED" || next === "CANCELLED") onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  const cfg = order ? STATUS_CONFIG[order.status] : null;
  const actions = order ? STATUS_ACTIONS[order.status] : [];

  return (
    <Drawer open={Boolean(order)} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-start justify-between gap-4 pr-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <DrawerTitle className="text-lg font-semibold">
                  Order #{order?.id}
                </DrawerTitle>
                {cfg && <Badge variant={cfg.variant}>{cfg.label}</Badge>}
              </div>
              <p className="text-sm text-gray-500">
                {order?.customer_name} &middot; {formatDate(order?.created_at)}
              </p>
            </div>
            <DrawerClose className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mt-0.5">
              <X size={16} />
              <span className="sr-only">Close</span>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <DrawerBody className="space-y-6">
          {/* Items table */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Items ({order?.items.length})
            </h3>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-violet-50 border-b border-violet-100">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-violet-600 uppercase tracking-wide">
                      Product
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-violet-600 uppercase tracking-wide">
                      Qty
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-violet-600 uppercase tracking-wide">
                      Unit Price
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-violet-600 uppercase tracking-wide">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order?.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 text-gray-900">{item.product_name}</td>
                      <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                        {formatMoney(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 tabular-nums">
                        {formatMoney(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end mt-3 gap-8 pr-1">
              <span className="text-sm font-semibold text-gray-500">Total</span>
              <span className="text-base font-bold text-gray-900 tabular-nums">
                {formatMoney(order?.total ?? 0)}
              </span>
            </div>
          </div>

          {/* Terminal state note */}
          {order && actions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">
              This order is {order.status.toLowerCase()} — no further actions available.
            </p>
          )}
        </DrawerBody>

        {actions.length > 0 && (
          <DrawerFooter className="flex-col items-stretch gap-2">
            {!confirmCancel ? (
              <div className="flex gap-2 justify-end">
                {actions
                  .filter((a) => a.next !== "CANCELLED")
                  .map((action) => (
                    <Button
                      key={action.next}
                      variant={action.variant}
                      size="sm"
                      disabled={updateStatus.isPending}
                      onClick={() => handleAction(action.next)}
                    >
                      {updateStatus.isPending ? "Updating…" : action.label}
                    </Button>
                  ))}
                {actions.some((a) => a.next === "CANCELLED") && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updateStatus.isPending}
                    onClick={() => setConfirmCancel(true)}
                    className="text-red-600 hover:bg-red-50 hover:border-red-300"
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            ) : (
              <div
                className={`rounded-md p-3 text-sm space-y-2 border ${
                  order?.status === "PROCESSING"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex gap-2 items-start">
                  <AlertTriangle
                    size={15}
                    className={`mt-0.5 shrink-0 ${
                      order?.status === "PROCESSING" ? "text-amber-600" : "text-red-500"
                    }`}
                  />
                  <p className={order?.status === "PROCESSING" ? "text-amber-800" : "text-red-700"}>
                    {order?.status === "PROCESSING"
                      ? "Cancelling from Processing will restock all items. This cannot be undone."
                      : "Cancel this order? This cannot be undone."}
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setConfirmCancel(false)}>
                    Keep Order
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={updateStatus.isPending}
                    onClick={() => { setConfirmCancel(false); handleAction("CANCELLED"); }}
                  >
                    {order?.status === "PROCESSING" ? "Cancel & Restock" : "Yes, Cancel"}
                  </Button>
                </div>
              </div>
            )}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
