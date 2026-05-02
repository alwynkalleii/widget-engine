// my-checkbox.tsx
import { Checkbox, CheckboxRootProps } from "@kobalte/core/checkbox";
import { ParentProps } from "solid-js";
// import styles from "./my-checkbox.module.css";

// 自己封装后的 MyCheckbox
export function MyCheckbox(props: ParentProps<CheckboxRootProps>) {
  // ... 处理你的业务逻辑，比如从 props 中提取 onChange 等
  return (
    <Checkbox {...props}>
      {/* Input 是隐藏的原生元素，处理无障碍 */}
      <Checkbox.Input />
      {/* 只保留勾选框视觉部分 */}
      <Checkbox.Control>
        <Checkbox.Indicator>{/* <CustomCheckIcon /> */}</Checkbox.Indicator>
      </Checkbox.Control>
      {/* Label 由使用者通过 children 传入 */}
      {props.children}
    </Checkbox>
  );
}

export function MyCheckboxLabel(props: ParentProps) {
  return <Checkbox.Label>{props.children}</Checkbox.Label>;
}
