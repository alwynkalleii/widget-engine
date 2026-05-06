# Widget Engine Settings SDK

本引擎支持声明式配置系统（Declarative Settings），开发者只需在小组件根目录的 `manifest.json` 中定义配置项，宿主程序会自动生成 UI 界面，并将用户修改实时推送给小组件。

## 1. Manifest 定义

在 `manifest.json` 的 `settings` 字段中定义一个数组。

### 字段说明 (SettingField)

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | `string` | 配置项的唯一标识符（用于 JS 中获取值） |
| `label` | `string` | 界面显示的标题 |
| `type` | `enum` | 字段类型: `text`, `number`, `boolean`, `select`, `color`, `slider` |
| `description`| `string` | (可选) 补充说明文本 |
| `default` | `any` | 默认值 |
| `placeholder`| `string` | (可选) 输入框占位符 |
| `showIf` | `object` | (可选) 级联显示逻辑 |

---

## 2. 详细字段类型

### Select (下拉框)
```json
{
  "id": "theme",
  "label": "配色方案",
  "type": "select",
  "options": [
    { "label": "浅色", "value": "light" },
    { "label": "深色", "value": "dark" }
  ],
  "default": "dark"
}
```

### Slider (滑块)
```json
{
  "id": "opacity",
  "label": "透明度",
  "type": "slider",
  "min": 0,
  "max": 100,
  "step": 1,
  "default": 80
}
```

### Text with Validation (文本验证)
```json
{
  "id": "apiKey",
  "label": "API Key",
  "type": "text",
  "placeholder": "请输入你的 Key",
  "pattern": "^[A-Za-z0-9]+$"
}
```

---

## 3. 级联显示逻辑 (Show If)

你可以根据另一个字段的值来决定当前字段是否显示。

```json
[
  {
    "id": "useCustomBg",
    "label": "使用自定义背景",
    "type": "boolean",
    "default": false
  },
  {
    "id": "bgColor",
    "label": "背景颜色",
    "type": "color",
    "default": "#ff0000",
    "showIf": {
      "field": "useCustomBg",
      "operator": "eq",
      "value": true
    }
  }
]
```

**支持的运算符 (`operator`):**
- `eq`: 等于
- `neq`: 不等于
- `gt`: 大于
- `lt`: 小于
- `contains`: 包含 (用于数组)

---

## 4. 在小组件中接收配置

宿主会在配置变更时通过 Tauri Event 推送。

```javascript
import { listen } from '@tauri-apps/api/event';

// 获取小组件自身的 ID (通常由宿主在 URL 参数或初始化脚本中提供)
const widgetId = "your-widget-id";

listen(`widget-settings-changed:${widgetId}`, (event) => {
  const settings = event.payload;
  console.log("收到新配置:", settings);
  
  if (settings.bgColor) {
    document.body.style.backgroundColor = settings.bgColor;
  }
});
```
