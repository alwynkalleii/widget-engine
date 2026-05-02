mod command;
mod router;

use crate::command::greet;

use axum::{routing::any, Router};
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::Mutex;
use tauri::tray::TrayIconBuilder;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let httpd_state = Arc::new(Mutex::new(router::ServerState {
        widgets_dir: PathBuf::new(),
    }));
    let httpd_router: Router = Router::new()
        .route("/{*path}", any(router::dynamic_subdomain_serve))
        .with_state(httpd_state.clone());

    tauri::Builder::default()
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_desktop_underlay::init())
        .plugin(
            tauri_plugin_httpd::Builder::new()
                .listen(14231, httpd_router)
                .build(),
        )
        .setup(move |app: &mut tauri::App| {
            let _ = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .build(app)?;

            // 将状态也注入到 Tauri 状态管理器中，方便 commands.rs 访问
            app.manage(httpd_state.clone());

            // 1. 获取动态路径
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get AppData path");
            let widgets_dir = app_data_dir.join("widgets");
            std::fs::create_dir_all(&widgets_dir).expect("Failed to create widgets directory");

            // 2. 更新共享状态，Axum 处理器会自动读到更新后的值
            let state = app.state::<Arc<Mutex<router::ServerState>>>();
            state.lock().unwrap().widgets_dir = widgets_dir;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
