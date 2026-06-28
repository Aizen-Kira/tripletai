import { Map, Route, WalletCards } from "lucide-react";
import Link from "next/link";
import { PlannerApp } from "@/components/planner/planner-app";

export default function Home() {
  return (
    <main>
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 lg:px-6">
        <Link href="/" className="text-xl font-black tracking-normal">
          Triplet AI
        </Link>
        <nav className="flex items-center gap-5 text-sm font-semibold text-muted-foreground">
          <a className="transition hover:text-foreground" href="#planner">
            Planner
          </a>
          <Link className="transition hover:text-foreground" href="/saved">
            Saved
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-8 pt-4 lg:grid-cols-[1.05fr_.95fr] lg:px-6 lg:pb-12">
        <div className="animate-[fade-up_.55s_ease-out]">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Hyper-local outing planner</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.02] tracking-normal text-balance md:text-7xl">
            Triplet AI turns a vibe into a mapped weekend plan.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Not a travel chatbot. A same-city planning workspace with local stops, explainable picks, and budget memory.
          </p>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              { icon: Map, label: "Card + map interface" },
              { icon: WalletCards, label: "Budget-first ranking" },
              { icon: Route, label: "Saved trip memory" }
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-white/75 p-4 shadow-soft">
                <item.icon className="mb-3 h-5 w-5 text-emerald-700" />
                <p className="text-sm font-bold">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden min-h-[360px] overflow-hidden rounded-lg border border-border bg-emerald-950 shadow-lift lg:block">
          <img
            src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1300&q=80"
            alt=""
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-100">Demo route</p>
            <p className="mt-2 text-3xl font-black leading-tight">Rain-safe galleries, cafes, and quiet corners within $30.</p>
          </div>
        </div>
      </section>

      <section id="planner" className="pb-8">
        <PlannerApp />
      </section>

      <style>{`
        @keyframes fade-up {
          from {
            transform: translateY(16px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
