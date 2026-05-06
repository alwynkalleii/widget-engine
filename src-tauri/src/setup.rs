use axum::{
    body::Body,
    extract::Request,
    http::StatusCode,
    middleware::{self, Next},
    response::{IntoResponse, Response},
    Router,
};
use std::collections::HashMap;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{App, AppHandle, Manager, Result};
use tauri_plugin_httpd::HttpdExt;
use tower_http::services::ServeDir;

use crate::config::{AppState, ConfigManager};
use crate::features::{FeatureManager, FeatureMetadata, FeatureState};

async fn rewrite_subdomain_to_path(mut request: Request<Body>, next: Next) -> Response {
    let host = request.headers().get("host").and_then(|h| h.to_str().ok()).unwrap_or("");

    if let Some(rest) = host.strip_prefix("widget.") {
        if let Some((name, _)) = rest.split_once(".localhost") {
            let pq = request.uri().path_and_query().map(|v| v.as_str()).unwrap_or("/");

            if let Ok(uri) = format!("/{}{}", name, pq).parse() {
                *request.uri_mut() = uri;
                return next.run(request).await;
            }
        }
    }

    StatusCode::NOT_FOUND.into_response()
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

pub fn init(app: &mut App) -> Result<()> {
    // 1. Initialize Config & State
    let config_manager = ConfigManager::new(app.handle());
    app.manage(AppState {
        config_manager,
        port: std::sync::Mutex::new(None),
    });

    // 2. Initialize Feature State (Dynamic Capability System)
    let mut available_features = HashMap::new();
    available_features.insert(
        "system-info".to_string(),
        FeatureMetadata {
            id: "system-info".to_string(),
            name: "系统信息监控".to_string(),
            description: "获取 CPU、内存、网络等实时系统指标".to_string(),
            download_url: "https://example.com/features/sysinfo.exe".to_string(),
            binary_name: "sysinfo.exe".to_string(),
        },
    );
    available_features.insert(
        "gpu-stats".to_string(),
        FeatureMetadata {
            id: "gpu-stats".to_string(),
            name: "显卡性能监控".to_string(),
            description: "获取 NVIDIA/AMD 显卡利用率与温度".to_string(),
            download_url: "https://example.com/features/gpustats.exe".to_string(),
            binary_name: "gpustats.exe".to_string(),
        },
    );

    app.manage(FeatureState {
        manager: FeatureManager::new(app.handle()),
        available_features,
    });

    // 3. Tray Setup
    let show_i = MenuItem::with_id(app, "show", "显示主界面", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

    let _ = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                show_main_window(app);
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                show_main_window(app);
            }
        })
        .build(app)?;

    // 4. Router & Widget Server Setup
    let app_handle = app.handle().clone();
    tauri::async_runtime::spawn(async move {
        let port = portpicker::pick_unused_port().unwrap();

        // Store port in state
        let state = app_handle.state::<AppState>();
        *state.port.lock().unwrap() = Some(port);

        let widgets_dir = app_handle.path().app_data_dir().unwrap().join("widgets");
        std::fs::create_dir_all(&widgets_dir).unwrap();

        let router = Router::new()
            .fallback_service(ServeDir::new(&widgets_dir))
            .layer(middleware::from_fn(rewrite_subdomain_to_path));

        let _ = app_handle
            .httpd()
            .listen("widget_server", port, router)
            .await;

        // Restore widgets after server is up
        let _ = crate::config::restore_widgets(&app_handle).await;
    });

    Ok(())
}
