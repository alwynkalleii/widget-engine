use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tokio::process::Command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FeatureMetadata {
    pub id: String,
    pub name: String,
    pub description: String,
    pub download_url: String,
    pub binary_name: String, // 例如 "sysinfo.exe"
}

pub struct FeatureManager {
    pub bin_dir: PathBuf,
}

impl FeatureManager {
    pub fn new(app_handle: &AppHandle) -> Self {
        let bin_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir").join("bin");
        if !bin_dir.exists() {
            std::fs::create_dir_all(&bin_dir).expect("Failed to create bin dir");
        }
        Self { bin_dir }
    }

    pub fn is_installed(&self, binary_name: &str) -> bool {
        self.bin_dir.join(binary_name).exists()
    }

    pub async fn run_feature(&self, binary_name: &str, args: Vec<String>) -> Result<String, String> {
        let path = self.bin_dir.join(binary_name);
        if !path.exists() {
            return Err(format!("Feature binary {} not installed", binary_name));
        }

        let output = Command::new(path)
            .args(args)
            .output()
            .await
            .map_err(|e| e.to_string())?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
}

pub struct FeatureState {
    pub manager: FeatureManager,
    pub available_features: HashMap<String, FeatureMetadata>,
}
