use axum::response::IntoResponse;
use axum::{
    extract::{Request, State},
    response::Response,
};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tower::ServiceExt;
use tower_http::services::ServeDir;

#[derive(Clone)]
pub struct ServerState {
    pub widgets_dir: PathBuf,
}

// 2. HTTP 请求拦截处理器（自动注入 State）
pub async fn dynamic_subdomain_serve(
    State(state): State<Arc<Mutex<ServerState>>>, // <--- 使用 axum 的 State 提取器接收 Arc 状态
    req: Request,
) -> Response {
    let host: &str = req
        .headers()
        .get("host")
        .and_then(|h| h.to_str().ok())
        .unwrap_or(".localhost:14231");
    // println!("Host: {:?}", host);
    // Host: "test.localhost:14231"

    let widget_name = host.trim_end_matches(".localhost:14231");

    // 从共享状态中安全获取基础路径并拼接
    let target_dir = {
        let state_guard = state.lock().unwrap();
        state_guard.widgets_dir.join(widget_name)
    };

    // println!("Target_dir: {:?}", target_dir);
    // Target_dir: $appData/widgets/web-tools"

    // 代理静态文件
    match ServeDir::new(target_dir).oneshot(req).await {
        Ok(res) => res.into_response(),
        Err(_) => (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            "Server Error",
        )
            .into_response(),
    }
}
