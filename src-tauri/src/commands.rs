use crate::config::{AppState, InstanceState, WidgetManifest};
use crate::features::{FeatureMetadata, FeatureState};
use tauri::{AppHandle, Manager};
use tauri::Emitter;
use std::fs;
use std::collections::HashMap;

#[tauri::command]
pub(crate) fn pick_unused_port() -> Result<u16, String> {
    portpicker::pick_unused_port().ok_or_else(|| "No ports free".to_string())
}

#[tauri::command]
pub(crate) fn get_installed_widgets(app_handle: AppHandle) -> Result<Vec<HashMap<String, String>>, String> {
    let widgets_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?.join("widgets");
    if !widgets_dir.exists() {
        return Ok(vec![]);
    }

    let mut widgets = vec![];
    if let Ok(entries) = fs::read_dir(widgets_dir) {
        for entry in entries.flatten() {
            if entry.path().is_dir() {
                let folder_name = entry.file_name().to_string_lossy().to_string();
                let manifest_path = entry.path().join("manifest.json");
                if manifest_path.exists() {
                    if let Ok(content) = fs::read_to_string(manifest_path) {
                        if let Ok(manifest) = serde_json::from_str::<WidgetManifest>(&content) {
                            let mut map = HashMap::new();
                            map.insert("id".to_string(), folder_name);
                            map.insert("name".to_string(), manifest.name);
                            map.insert("description".to_string(), manifest.description.unwrap_or_default());
                            widgets.push(map);
                        }
                    }
                }
            }
        }
    }
    Ok(widgets)
}

#[tauri::command]
pub(crate) fn get_widget_manifest(app_handle: AppHandle, id: String) -> Result<WidgetManifest, String> {
    let manifest_path = app_handle.path().app_data_dir().map_err(|e| e.to_string())?.join("widgets").join(id).join("manifest.json");
    if !manifest_path.exists() {
        return Err("Manifest not found".to_string());
    }
    let content = fs::read_to_string(manifest_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub(crate) fn get_instance_state(
    state: tauri::State<'_, AppState>,
    label: String,
) -> Result<InstanceState, String> {
    state.config_manager.load_instances()
        .get(&label)
        .cloned()
        .ok_or_else(|| "Instance not found".to_string())
}

#[tauri::command]
pub(crate) fn get_widget_instances(
    state: tauri::State<'_, AppState>,
    widget_id: String,
) -> Vec<InstanceState> {
    state.config_manager.load_instances()
        .into_values()
        .filter(|i| i.widget_id == widget_id)
        .collect()
}

#[tauri::command]
pub(crate) async fn create_instance(
    app_handle: AppHandle,
    state: tauri::State<'_, AppState>,
    widget_id: String,
) -> Result<InstanceState, String> {
    let manifest = get_widget_manifest(app_handle, widget_id.clone())?;
    
    let label = format!("{}-{}", widget_id, std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs());

    let instance = InstanceState {
        label: label.clone(),
        widget_id,
        enabled: false,
        window: manifest.window.unwrap_or(serde_json::json!({
            "x": 100,
            "y": 100,
            "width": 800,
            "height": 600
        })),
        settings: serde_json::json!({}),
    };

    state.config_manager.save_instance(&instance)?;
    Ok(instance)
}

#[tauri::command]
pub(crate) fn start_instance(
    app_handle: AppHandle,
    state: tauri::State<'_, AppState>,
    label: String,
) -> Result<(), String> {
    let mut instances = state.config_manager.load_instances();
    if let Some(instance) = instances.get_mut(&label) {
        instance.enabled = true;
        state.config_manager.save_instance(instance)?;
        crate::config::launch_instance(&app_handle, instance).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Instance not found".to_string())
    }
}

#[tauri::command]
pub(crate) async fn start_instance(
    app_handle: AppHandle,
    state: tauri::State<'_, AppState>,
    label: String,
) -> Result<(), String> {
    let mut instances = state.config_manager.load_instances();
    if let Some(instance) = instances.get_mut(&label) {
        instance.enabled = true;
        state.config_manager.save_instance(instance)?;
        crate::config::launch_instance(&app_handle, instance).await.map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Instance not found".to_string())
    }
}
...
#[tauri::command]
pub(crate) async fn save_instance(
    app_handle: AppHandle,
    state: tauri::State<'_, AppState>,
    instance: InstanceState,
) -> Result<(), String> {
    state.config_manager.save_instance(&instance)?;

    // 如果实例正在运行，且配置更新了，可能需要重新生成窗口
    if instance.enabled {
        crate::config::launch_instance(&app_handle, &instance).await.map_err(|e| e.to_string())?;
    }
    Ok(())
}

    Ok(())
}

#[tauri::command]
pub(crate) fn delete_instance(
    state: tauri::State<'_, AppState>,
    label: String,
) -> Result<(), String> {
    state.config_manager.delete_instance(&label)
}

#[tauri::command]
pub(crate) fn update_instance_settings(
    app_handle: AppHandle,
    state: tauri::State<'_, AppState>,
    label: String,
    settings: serde_json::Value,
) -> Result<(), String> {
    let mut instances = state.config_manager.load_instances();
    if let Some(instance) = instances.get_mut(&label) {
        instance.settings = settings.clone();
        state.config_manager.save_instance(instance)?;
        app_handle.emit(&format!("widget-settings-changed:{}", label), settings).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub(crate) fn list_available_features(
    state: tauri::State<'_, FeatureState>,
) -> Vec<FeatureMetadata> {
    state.available_features.values().cloned().collect()
}

#[tauri::command]
pub(crate) fn check_feature_installed(
    state: tauri::State<'_, FeatureState>,
    feature_id: String,
) -> bool {
    if let Some(feature) = state.available_features.get(&feature_id) {
        state.manager.is_installed(&feature.binary_name)
    } else {
        false
    }
}

#[tauri::command]
pub(crate) async fn invoke_feature(
    state: tauri::State<'_, FeatureState>,
    feature_id: String,
    args: Vec<String>,
) -> Result<String, String> {
    let feature = state
        .available_features
        .get(&feature_id)
        .ok_or_else(|| "Feature not found".to_string())?;

    state.manager.run_feature(&feature.binary_name, args).await
}
