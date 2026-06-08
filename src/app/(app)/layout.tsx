import { Nav } from "@/components/nav";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
