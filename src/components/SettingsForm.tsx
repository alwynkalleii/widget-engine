import { For, Show, createSignal, createEffect } from "solid-js";
import { SettingField } from "@/types/app";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface SettingsFormProps {
  fields: SettingField[];
  initialValues: Record<string, any>;
  onSave: (values: Record<string, any>) => void;
  onCancel?: () => void;
}

export function SettingsForm(props: SettingsFormProps) {
  const [values, setValues] = createSignal<Record<string, any>>({});

  createEffect(() => {
    const defaultValues: Record<string, any> = {};
    props.fields.forEach((field) => {
      defaultValues[field.id] = props.initialValues[field.id] ?? field.default;
    });
    setValues(defaultValues);
  });

  const updateValue = (id: string, value: any) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    props.onSave(values());
  };

  const shouldShow = (field: SettingField) => {
    if (!field.showIf) return true;
    const { field: targetId, operator, value: targetValue } = field.showIf;
    const currentValue = values()[targetId];

    switch (operator) {
      case "eq": return currentValue === targetValue;
      case "neq": return currentValue !== targetValue;
      case "gt": return currentValue > targetValue;
      case "lt": return currentValue < targetValue;
      case "contains": return Array.isArray(currentValue) && currentValue.includes(targetValue);
      default: return true;
    }
  };

  return (
    <div class="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <For each={props.fields}>
        {(field) => (
          <Show when={shouldShow(field)}>
            <div class="flex flex-col space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <label class="text-sm font-medium text-gray-700 flex items-center justify-between">
                {field.label}
                {field.type === "slider" && (
                  <span class="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                    {values()[field.id] || 0}
                  </span>
                )}
              </label>
              {field.description && (
                <span class="text-xs text-gray-500">{field.description}</span>
              )}
              
              {field.type === "text" && (
                <input
                  type="text"
                  placeholder={field.placeholder}
                  class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                  value={values()[field.id] || ""}
                  onInput={(e) => updateValue(field.id, e.currentTarget.value)}
                />
              )}

              {field.type === "number" && (
                <input
                  type="number"
                  placeholder={field.placeholder}
                  class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                  value={values()[field.id] || 0}
                  min={field.min}
                  max={field.max}
                  onInput={(e) => updateValue(field.id, Number(e.currentTarget.value))}
                />
              )}

              {field.type === "boolean" && (
                <div class="pt-1">
                  <Switch
                    checked={!!values()[field.id]}
                    onChange={(checked) => updateValue(field.id, checked)}
                  />
                </div>
              )}

              {field.type === "select" && (
                <select
                  class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:1em_1em]"
                  style="background-image: url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E')"
                  value={values()[field.id]}
                  onChange={(e) => updateValue(field.id, e.currentTarget.value)}
                >
                  <For each={field.options}>
                    {(opt) => <option value={opt.value}>{opt.label}</option>}
                  </For>
                </select>
              )}

              {field.type === "multi-select" && (
                <div class="grid grid-cols-2 gap-2 p-3 rounded-md border border-gray-300 bg-gray-50/30">
                  <For each={field.options}>
                    {(opt) => {
                      const isChecked = () => (values()[field.id] || []).includes(opt.value);
                      return (
                        <label class="flex items-center space-x-2 text-sm cursor-pointer hover:text-primary transition-colors">
                          <input
                            type="checkbox"
                            class="rounded border-gray-300 text-primary focus:ring-primary/20"
                            checked={isChecked()}
                            onChange={(e) => {
                              const current = values()[field.id] || [];
                              const next = e.currentTarget.checked 
                                ? [...current, opt.value]
                                : current.filter((v: any) => v !== opt.value);
                              updateValue(field.id, next);
                            }}
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    }}
                  </For>
                </div>
              )}

              {field.type === "color" && (
                <input
                  type="color"
                  class="h-10 w-full cursor-pointer rounded-md border border-gray-300 p-1 bg-white hover:border-gray-400 transition-colors"
                  value={values()[field.id] || "#000000"}
                  onInput={(e) => updateValue(field.id, e.currentTarget.value)}
                />
              )}

              {field.type === "slider" && (
                <div class="flex items-center space-x-4 pt-1">
                  <input
                    type="range"
                    class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    min={field.min ?? 0}
                    max={field.max ?? 100}
                    step={field.step ?? 1}
                    value={values()[field.id] || 0}
                    onInput={(e) => updateValue(field.id, Number(e.currentTarget.value))}
                  />
                </div>
              )}
            </div>
          </Show>
        )}
      </For>

      <div class="flex justify-end space-x-3 pt-4">
        <Show when={props.onCancel}>
          <Button variant="outline" onClick={props.onCancel!}>
            取消
          </Button>
        </Show>
        <Button onClick={handleSave}>
          保存配置
        </Button>
      </div>
    </div>
  );
}
