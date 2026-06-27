import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomerModal from "@/components/customers/CustomerModal";
import DeleteConfirmDialog from "@/components/customers/DeleteConfirmDialog";
import { useCustomers } from "@/api/customers";
import { formatDate, formatMoney } from "@/lib/format";
import type { Customer } from "@/types/customer";

const COLS = ["Name", "Email", "Phone", "Orders", "Total Spent", "Last Order", "Joined", ""];

export default function Customers() {
  const { data: customers, isLoading, isError } = useCustomers();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  function openCreate() {
    setEditCustomer(undefined);
    setModalOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditCustomer(customer);
    setModalOpen(true);
  }

  const filtered = (customers ?? []).filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          {customers && (
            <p className="text-sm text-gray-500 mt-0.5">{customers.length} customers total</p>
          )}
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => {
            const val = e.target.value;
            if (val) setSearchParams({ q: val });
            else setSearchParams({});
          }}
          placeholder="Search by name, email, or phone…"
          className="pl-9"
        />
      </div>

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          Failed to load customers. Make sure the backend is running.
        </div>
      )}

      {/* Table */}
      {!isError && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-violet-100 bg-violet-50">
                  {COLS.map((col) => (
                    <th
                      key={col}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-violet-600 whitespace-nowrap ${
                        col === "Orders" || col === "Total Spent" ? "text-right" : "text-left"
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Loading skeletons */}
                {isLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {[55, 70, 45, 15, 30, 45, 45, 20].map((w, j) => (
                        <td key={j} className="px-4 py-3">
                          <div
                            className="h-4 rounded bg-gray-100 animate-pulse"
                            style={{ width: `${w}%` }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}

                {/* Rows */}
                {!isLoading &&
                  filtered.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}`}
                            className="hover:text-blue-600 hover:underline"
                          >
                            {c.email}
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone}`}
                            className="hover:text-blue-600 hover:underline"
                          >
                            {c.phone}
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                        {c.total_orders}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 tabular-nums whitespace-nowrap">
                        {formatMoney(c.total_spent)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(c.last_order_date)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(c)}
                            aria-label={`Edit ${c.name}`}
                            className="rounded-md p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            aria-label={`Delete ${c.name}`}
                            className="rounded-md p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Empty state — inside the table card */}
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={40} className="text-gray-300 mb-3" />
              {search ? (
                <p className="text-sm text-gray-500">No customers match "{search}".</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">No customers yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add your first customer to get started.
                  </p>
                  <Button className="mt-4" onClick={openCreate}>
                    <Plus size={16} /> Add Customer
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customer={editCustomer}
      />
      <DeleteConfirmDialog
        customer={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
