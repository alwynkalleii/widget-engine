import { ParentProps, createSignal, Index, onMount, createMemo } from "solid-js";
import { A } from "@solidjs/router";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "@/lib/utils";
import Blocks from "lucide-solid/icons/blocks";
import Info from "lucide-solid/icons/info";
import Cpu from "lucide-solid/icons/cpu";
import Layout from "lucide-solid/icons/layout";

const StaticMenuItems = [
  { lable: "特性商店", href: "/features", icon: () => <Cpu size={18} /> },
  { lable: "关于", href: "/about", icon: () => <Info size={18} /> },
];

export default function MainLayout(props: ParentProps) {
  const [widgets, setWidgets] = createSignal<{ id: string; name: string }[]>([]);

  const fetchWidgets = async () => {
    try {
      const list = await invoke<any[]>("get_installed_widgets");
      setWidgets(list);
    } catch (err) {
      console.error("Failed to fetch widgets:", err);
    }
  };

  onMount(() => {
    fetchWidgets();
  });

  return (
    <div data-tauri-drag-region class="bg-background flex h-screen overflow-hidden">
      <aside class="bg-card flex w-64 shrink-0 flex-col border-r p-6">
        <div class="text-primary mb-10 px-2 text-2xl font-black tracking-tighter italic">WIDGET HUB</div>

        <nav class="flex-1 space-y-6 overflow-y-auto">
          <div>
            <div class="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Installed Widgets
            </div>
            <div class="space-y-1">
              <Index each={widgets()}>
                {(widget) => (
                  <A
                    href={`/widget/${widget().id}`}
                    class="flex w-full cursor-pointer items-center rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
                    activeClass="bg-primary/10 text-primary shadow-sm"
                    inactiveClass="text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <span class="mr-3 text-lg"><Layout size={16} /></span>
                    {widget().name}
                  </A>
                )}
              </Index>
            </div>
          </div>

          <div>
             <div class="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              System
            </div>
            <div class="space-y-1">
              <Index each={StaticMenuItems}>
                {(item) => (
                  <A
                    href={item().href}
                    class="flex w-full cursor-pointer items-center rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
                    activeClass="bg-primary/10 text-primary shadow-sm"
                    inactiveClass="text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <span class="mr-3 text-lg">{item().icon()}</span>
                    {item().lable}
                  </A>
                )}
              </Index>
            </div>
          </div>
        </nav>

        <div class="border-border/50 text-muted-foreground/50 mt-auto border-t pt-4 text-center text-[10px] font-bold tracking-[0.2em] uppercase">
          Alpha v0.1.0
        </div>
      </aside>

      <main class="bg-background relative h-full flex-1 overflow-hidden">{props.children}</main>
    </div>
  );
}
