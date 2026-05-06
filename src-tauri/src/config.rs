use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, Runtime};

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct InstanceState {
    pub label: String,      // 实例的唯一标签，也是文件名
    pub widget_id: String,  // 对应小组件文件夹名称
    pub enabled: bool,
    #[serde(default)]
    pub window: serde_json::Value, // 包含 x, y, width, height 以及 decorations 等所有窗口配置
    #[serde(default)]
    pub settings: serde_json::Value,
}

pub struct ConfigManager {
    pub instances_dir: PathBuf,
}

impl ConfigManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let config_dir = app_handle.path().app_config_dir().expect("Failed to get app config dir");
        let instances_dir = config_dir.join("instances");
        if !instances_dir.exists() {
            fs::create_dir_all(&instances_dir).expect("Failed to create instances dir");
        }
        Self { instances_dir }
    }

    pub fn load_instances(&self) -> HashMap<String, InstanceState> {
        let mut instances = HashMap::new();
        if let Ok(entries) = fs::read_dir(&self.instances_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("json") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        if let Ok(state) = serde_json::from_str::<InstanceState>(&content) {
                            instances.insert(state.label.clone(), state);
                        }
                    }
                }
            }
        }
        instances
    }

    pub fn save_instance(&self, state: &InstanceState) -> Result<(), String> {
        let path = self.instances_dir.join(format!("{}.json", state.label));
        let content = serde_json::to_string_pretty(state).map_err(|e| e.to_string())?;
        fs::write(path, content).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_instance(&self, label: &str) -> Result<(), String> {
        let path = self.instances_dir.join(format!("{}.json", label));
        if path.exists() {
            fs::remove_file(path).map_err(|e| e.to_string())?;
        }
        Ok(())
    }
}

pub struct AppState {
    pub config_manager: ConfigManager,
    pub port: std::sync::Mutex<Option<u16>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WidgetManifest {
    pub name: String,
    pub description: Option<String>,
    pub window: Option<serde_json::Value>,
    pub settings: Option<Vec<serde_json::Value>>,
}

pub async fn launch_instance<R: Runtime>(app_handle: &AppHandle<R>, instance: &InstanceState) -> tauri::Result<()> {
    let state = app_handle.state::<AppState>();
    let port = state.port.lock().unwrap().expect("Port not set");
    let sdk_script = include_str!("sdk.js");

    let url_str = format!("http://widget.{}.localhost:{}/index.html", instance.widget_id, port);
    let url = url_str.parse().map_err(|e| tauri::Error::Io(std::io::Error::new(std::io::ErrorKind::InvalidInput, e)))?;
    let label = &instance.label;

    // 如果窗口已存在，先关闭它并等待释放 Label
    if let Some(win) = app_handle.get_webview_window(label) {
        let _ = win.close();
        // 必须异步等待，给 Tauri 核心释放 Label 的时间
        tokio::time::sleep(std::time::Duration::from_millis(200)).await;
    }

    let injection = format!(
        "window.__WIDGET_INSTANCE__ = {};\n{}",
        serde_json::to_string(&instance).unwrap(),
        sdk_script
    );

    let mut builder = tauri::WebviewWindowBuilder::new(
        app_handle,
        label,
        tauri::WebviewUrl::External(url)
    )
    .initialization_script(&injection);

    // 从实例的 window 字段读取配置
    if let (Some(x), Some(y)) = (
        instance.window.get("x").and_then(|v| v.as_f64()),
        instance.window.get("y").and_then(|v| v.as_f64()),
    ) {
        builder = builder.position(x, y);
    }

    if let (Some(w), Some(h)) = (
        instance.window.get("width").and_then(|v| v.as_f64()),
        instance.window.get("height").and_then(|v| v.as_f64()),
    ) {
        builder = builder.inner_size(w, h);
    }

    if let Some(transparent) = instance.window.get("transparent").and_then(|v| v.as_bool()) {
        builder = builder.transparent(transparent);
    }
    if let Some(decorations) = instance.window.get("decorations").and_then(|v| v.as_bool()) {
        builder = builder.decorations(decorations);
    }
    if let Some(always_on_top) = instance.window.get("alwaysOnTop").and_then(|v| v.as_bool()) {
        builder = builder.always_on_top(always_on_top);
    }
    
    let window = builder.build()?;

    // 处理 desktopUnderlay
    if let Some(true) = instance.window.get("desktopUnderlay").and_then(|v| v.as_bool()) {
        use tauri_plugin_desktop_underlay::DesktopUnderlayExt;
        let _ = window.set_desktop_underlay(true);
    }

    Ok(())
}

pub async fn restore_widgets<R: Runtime>(app_handle: &AppHandle<R>) -> tauri::Result<()> {
    let state = app_handle.state::<AppState>();
    let instances = state.config_manager.load_instances();

    for (_, instance) in instances.iter() {
        if instance.enabled {
            let _ = launch_instance(app_handle, instance).await;
        }
    }
    
    Ok(())
}
