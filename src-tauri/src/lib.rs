mod commands;
mod config;
mod features;
mod setup;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        //
        .plugin(tauri_plugin_desktop_underlay::init())
        .plugin(tauri_plugin_httpd::init())
        //
        .setup(|app: &mut tauri::App| {
            setup::init(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::pick_unused_port,
            commands::get_installed_widgets,
            commands::get_widget_manifest,
            commands::get_instance_state,
            commands::get_widget_instances,
            commands::create_instance,
            commands::start_instance,
            commands::stop_instance,
            commands::save_instance,
            commands::delete_instance,
            commands::update_instance_settings,
            commands::list_available_features,
            commands::check_feature_installed,
            commands::invoke_feature,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match event {
            tauri::RunEvent::WindowEvent { label, event: tauri::WindowEvent::CloseRequested { api, .. }, .. } => {
                if label == "main" {
                    let _ = app_handle.get_webview_window("main").unwrap().hide();
                    api.prevent_close();
                }
            }
            _ => {}
        });
}
