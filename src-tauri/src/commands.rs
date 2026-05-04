// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// #[tauri::command]
// pub fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }
#[tauri::command]
pub(crate) fn pick_unused_port() -> Result<u16, String> {
    portpicker::pick_unused_port().ok_or_else(|| "No ports free".to_string())
}
