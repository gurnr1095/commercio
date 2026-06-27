import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomerModal from "@/components/customers/CustomerModal";
import CustomerDrawer from "@/components/customers/CustomerDrawer";
import DeleteConfirmDialog from "@/components/customers/DeleteConfirmDialog";
import { useCustomers } from "@/api/customers";
import { formatDate, formatMoney } from "@/lib/format";
import type { Customer } from "@/types/customer";

type SortField = "name" | "total_orders" | "total_spent" | "last_order_date" | "created_at";
type SortDir = "asc" | "desc";

function SortTh({
  label,
  field,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  field: SortField;
  sort: { field: SortField; dir: SortDir };
  onSort: (f: SortField) => void;
  align?: "left" | "right";
}) {
  const active = sort.field === field;
  const Icon = active ? (sort.dir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th
      onClick={() => onSort(field)}
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-violet-400 whitespace-nowrap cursor-pointer select-none hover:text-violet-300 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <span className={`inline-flex items-center gap-0.5 ${align === "right" ? "flex-row-reverse" : ""}`}>
        {label}
        <Icon size={11} className={active ? "" : "opacity-30"} />
      </span>
    </th>
  );
}

export default function Customers() {
  const { data: customers, isLoading, isError } = useCustomers();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "name",
    dir: "asc",
  });
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  function openCreate() {
    setEditCustomer(undefined);
    setModalOpen(true);
  }

  function openEdit(e: React.MouseEvent, customer: Customer) {
    e.stopPropagation();
    setEditCustomer(customer);
    setModalOpen(true);
  }

  function openDelete(e: React.MouseEvent, customer: Customer) {
    e.stopPropagation();
    setDeleteTarget(customer);
  }

  function toggleSort(field: SortField) {
    setSort((s) =>
      s.field === field
        ? { field, dir: s.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc" }
    );
  }

  const filtered = (customers ?? []).filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const mul = sort.dir === "asc" ? 1 : -1;
    switch (sort.field) {
      case "name":
        return mul * a.name.localeCompare(b.name);
      case "total_orders":
        return mul * (a.total_orders - b.total_orders);
      case "total_spent":
        return mul * (a.total_spent - b.total_spent);
      case "created_at":
        return mul * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "last_order_date": {
        const aT = a.last_order_date ? new Date(a.last_order_date).getTime() : 0;
        const bT = b.last_order_date ? new Date(b.last_order_date).getTime() : 0;
        return mul * (aT - bT);
      }
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Customers</h1>
          {customers && (
            <p className="text-sm text-zinc-400 mt-0.5">{customers.length} customers total</p>
          )}
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
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
        <div className="rounded-lg border border-red-900/50 bg-red-950/50 p-6 text-sm text-red-400">
          Failed to load customers. Make sure the backend is running.
        </div>
      )}

      {/* Table */}
      {!isError && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-violet-900/50 bg-violet-950/40">
                  <SortTh label="Name" field="name" sort={sort} onSort={toggleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-violet-400 whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-violet-400 whitespace-nowrap">
                    Phone
                  </th>
                  <SortTh label="Orders" field="total_orders" sort={sort} onSort={toggleSort} align="right" />
                  <SortTh label="Total Spent" field="total_spent" sort={sort} onSort={toggleSort} align="right" />
                  <SortTh label="Last Order" field="last_order_date" sort={sort} onSort={toggleSort} />
                  <SortTh label="Joined" field="created_at" sort={sort} onSort={toggleSort} />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {/* Loading skeletons */}
                {isLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-zinc-800">
                      {[55, 70, 45, 15, 30, 45, 45, 20].map((w, j) => (
                        <td key={j} className="px-4 py-3">
                          <div
                            className="h-4 rounded bg-zinc-800 animate-pulse"
                            style={{ width: `${w}%` }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}

                {/* Rows */}
                {!isLoading &&
                  sorted.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-100 whitespace-nowrap">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-violet-400 hover:underline"
                          >
                            {c.email}
                          </a>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-violet-400 hover:underline"
                          >
                            {c.phone}
                          </a>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">
                        {c.total_orders}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-100 tabular-nums whitespace-nowrap">
                        {formatMoney(c.total_spent)}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                        {formatDate(c.last_order_date)}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => openEdit(e, c)}
                            aria-label={`Edit ${c.name}`}
                            className="rounded-md p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={(e) => openDelete(e, c)}
                            aria-label={`Delete ${c.name}`}
                            className="rounded-md p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/50 transition-colors"
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

          {/* Empty state */}
          {!isLoading && sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={40} className="text-zinc-700 mb-3" />
              {search ? (
                <p className="text-sm text-zinc-500">No customers match "{search}".</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-zinc-300">No customers yet</p>
                  <p className="text-sm text-zinc-500 mt-1">
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

      {/* Drawer + Modals */}
      <CustomerDrawer
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
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
