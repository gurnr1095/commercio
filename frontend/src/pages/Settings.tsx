import { useState } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { Save, LogOut, Bot, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm">
      <div className="flex items-start gap-3 px-6 py-5 border-b border-zinc-800">
        <div className="p-2 rounded-lg bg-violet-950/40 text-violet-400 shrink-0">
          <Icon size={16} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
          {description && <p className="text-xs text-zinc-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
      <label className="text-sm font-medium text-zinc-300 w-36 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function StoreSection() {
  const [name, setName] = useState(
    () => localStorage.getItem("store-name") ?? "My Store"
  );
  const [saved, setSaved] = useState(false);

  function save() {
    localStorage.setItem("store-name", name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <SectionCard
      icon={Store}
      title="Store"
      description="Basic store information shown across the dashboard."
    >
      <div className="space-y-4">
        <Field label="Store name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Store"
            className="max-w-sm"
          />
        </Field>
        <div className="pt-1">
          <Button size="sm" onClick={save} disabled={saved}>
            <Save size={14} />
            {saved ? "Saved" : "Save changes"}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

function AccountSection() {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  if (!clerkKey) {
    return (
      <SectionCard
        icon={User}
        title="Account"
        description="Clerk authentication is not configured."
      >
        <p className="text-sm text-zinc-400">
          Set <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-zinc-300">VITE_CLERK_PUBLISHABLE_KEY</code> in{" "}
          <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-zinc-300">frontend/.env</code> to enable auth.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={User}
      title="Account"
      description="Your Clerk account linked to this dashboard."
    >
      <div className="space-y-4">
        {isLoaded && user && (
          <div className="space-y-2">
            <Field label="Name">
              <p className="text-sm text-zinc-200">{user.fullName ?? "—"}</p>
            </Field>
            <Field label="Email">
              <p className="text-sm text-zinc-200">
                {user.primaryEmailAddress?.emailAddress ?? "—"}
              </p>
            </Field>
          </div>
        )}
        <div className="pt-1">
          <Button
            size="sm"
            variant="outline"
            className="text-red-400 border-red-900/50 hover:bg-red-950/50 hover:text-red-300 hover:border-red-800"
            onClick={() => signOut()}
          >
            <LogOut size={14} />
            Sign out
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

function AiSection() {
  return (
    <SectionCard
      icon={Bot}
      title="AI / LLM"
      description="OpenRouter configuration for inventory analysis and sales summaries."
    >
      <div className="space-y-3 text-sm text-zinc-400">
        <p>
          AI features use <strong className="text-zinc-200">OpenRouter</strong> with free models. Configure the API key and
          model fallback list in <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-zinc-300">backend/.env</code>:
        </p>
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-3 font-mono text-xs text-zinc-300 space-y-1">
          <p>OPENROUTER_API_KEY=sk-or-v1-…</p>
          <p>OPENROUTER_MODELS=model-1:free,model-2:free</p>
        </div>
        <p className="text-xs text-zinc-500">
          Models are tried in order — if the first fails or rate-limits, the next is used automatically.
          Visit <strong className="text-zinc-400">openrouter.ai/models</strong> and filter by "Free" to find available model slugs.
        </p>
      </div>
    </SectionCard>
  );
}

export default function Settings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your store and account preferences</p>
      </div>

      <StoreSection />
      <AccountSection />
      <AiSection />
    </div>
  );
}
