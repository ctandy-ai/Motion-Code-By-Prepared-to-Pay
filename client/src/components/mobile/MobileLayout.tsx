import { MobileBottomNav } from "./MobileBottomNav";

interface MobileLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export function MobileLayout({ children, hideNav = false }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-ink-1 text-slate-100 flex flex-col">
      <main className={`flex-1 ${hideNav ? '' : 'pb-20'}`}>
        {children}
      </main>
      {!hideNav && <MobileBottomNav />}
    </div>
  );
}
