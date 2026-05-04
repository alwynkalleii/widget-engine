mod commands;
mod router;

use tauri::tray::TrayIconBuilder;
use tauri::Manager;
use tauri_plugin_httpd::HttpdExt;

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
        .setup(move |app: &mut tauri::App| {
            let _ = TrayIconBuilder::new().icon(app.default_window_icon().unwrap().clone()).build(app)?;

            let app_handle = app.handle().clone();
            tauri::async_runtime::block_on(async move {
                let widgets_dir = app_handle.path().app_data_dir().unwrap().join("widgets");
                let router = router::get_router(widgets_dir);
                let port = portpicker::pick_unused_port().unwrap();
                app_handle.httpd().listen("widget_server", port, router).await.expect("Failed to start static service");
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![commands::pick_unused_port])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
