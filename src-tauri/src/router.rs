use axum::{
    body::Body,
    extract::Request,
    http::StatusCode,
    middleware::{self, Next},
    response::{IntoResponse, Response},
    Router,
};
use std::path::PathBuf;
use tower_http::services::ServeDir;

/// Middleware to perform subdomain-to-path rewriting.
///
/// This function captures the `{name}` part from `widget.{name}.localhost`,
/// then prepends it to the existing URI path while preserving all original
/// query parameters.
///
/// Example: `widget.app1.localhost/index.html?id=1` becomes `/app1/index.html?id=1`.
///
/// Returns a `404 Not Found` response if the request does not follow the required
/// subdomain pattern.
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

pub fn get_router(widgets_dir: PathBuf) -> Router {
    std::fs::create_dir_all(&widgets_dir).unwrap();

    Router::new().fallback_service(ServeDir::new(&widgets_dir)).layer(middleware::from_fn(rewrite_subdomain_to_path))
}
