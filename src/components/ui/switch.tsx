import { splitProps, ComponentProps } from "solid-js";
import { Switch as SwitchPrimitive } from "@kobalte/core/switch";

import { cn } from "@/lib/utils";

import type { SwitchRootProps } from "@kobalte/core/switch";

function Switch(
  props: SwitchRootProps &
    ComponentProps<typeof SwitchPrimitive> & {
      size?: "sm" | "default";
    },
) {
  const [local, others] = splitProps(props, ["class", "size"]);

  return (
    <SwitchPrimitive
      data-slot="switch"
      data-size={local.size ?? "default"}
      class={cn(
        "group/switch group-data-[size=default]/switch:h-[18.4px] group-data-[size=default]/switch:w-[32px] group-data-[size=sm]/switch:h-[14px] group-data-[size=sm]/switch:w-[24px]",
        local.class,
      )}
      {...others}
    >
      <SwitchPrimitive.Input class="peer" />
      <SwitchPrimitive.Control class="peer-focus-visible:border-ring peer-focus-visible:ring-ring/50 peer-aria-invalid:border-destructive peer-aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary bg-input dark:bg-input/80 relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none group-data-[size=default]/switch:h-[18.4px] group-data-[size=default]/switch:w-[32px] group-data-[size=sm]/switch:h-[14px] group-data-[size=sm]/switch:w-[24px] after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-[3px] aria-invalid:ring-[3px] data-disabled:cursor-not-allowed data-disabled:opacity-50">
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          class="bg-background dark:data-checked:bg-primary-foreground dark:bg-foreground pointer-events-none block rounded-full ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=default]/switch:translate-x-0 group-data-[size=sm]/switch:size-3 group-data-[size=sm]/switch:translate-x-0 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)]"
        />
      </SwitchPrimitive.Control>
    </SwitchPrimitive>
  );
}
export { Switch };
