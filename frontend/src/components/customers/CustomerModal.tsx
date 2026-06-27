import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateCustomer, useUpdateCustomer } from "@/api/customers";
import type { Customer } from "@/types/customer";

type FormState = {
  name: string;
  email: string;
  phone: string;
};

const EMPTY: FormState = { name: "", email: "", phone: "" };

function toForm(c: Customer): FormState {
  return {
    name: c.name,
    email: c.email ?? "",
    phone: c.phone ?? "",
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
};

export default function CustomerModal({ open, onClose, customer }: Props) {
  const isEdit = Boolean(customer);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const isPending = create.isPending || update.isPending;

  useEffect(() => {
    if (open) {
      setForm(customer ? toForm(customer) : EMPTY);
      setError(null);
    }
  }, [open, customer]);

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError("Name is required.");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
    };

    try {
      if (isEdit && customer) {
        await update.mutateAsync({ id: customer.id, ...payload });
        toast.success("Customer updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Customer added");
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg.replace("API 409: ", "").replace(/^"/, "").replace(/"$/, ""));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isEdit ? "Edit Customer" : "Add Customer"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-name">Name *</Label>
              <Input
                id="c-name"
                value={form.name}
                onChange={set("name")}
                placeholder="Jane Smith"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-email">Email</Label>
              <Input
                id="c-email"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="jane@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-phone">Phone</Label>
              <Input
                id="c-phone"
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-md px-3 py-2">{error}</p>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : isEdit ? "Save Changes" : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
