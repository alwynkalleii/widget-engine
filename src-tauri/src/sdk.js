(function() {
  const { invoke } = window.__TAURI__.core;
  const { listen } = window.__TAURI__.event;
  const { getCurrentWindow } = window.__TAURI__.window;

  // 获取当前窗口 Label，用于事件过滤
  const currentLabel = getCurrentWindow().label;
  
  // 缓存当前实例信息
  let instance = window.__WIDGET_INSTANCE__ || { settings: {} };

  window.WidgetEngine = {
    /**
     * 获取当前小组件实例的所有信息 (label, widget_id, x, y, width, height, settings)
     */
    getInstance: () => instance,

    /**
     * 仅获取当前实例的配置项 (Settings)
     */
    getConfig: () => instance.settings || {},

    /**
     * 调用已安装的特性（执行二进制扩展）
     */
    invokeFeature: async (featureId, args = []) => {
      try {
        const result = await invoke("invoke_feature", { featureId, args });
        try { return JSON.parse(result); } catch (e) { return result; }
      } catch (err) {
        console.error(`[WidgetEngine] Invoke feature ${featureId} failed:`, err);
        throw err;
      }
    },

    /**
     * 监听配置变更
     * @param {function} callback 回调函数，参数为最新的 settings
     */
    onConfigChanged: (callback) => {
      // 这里的事件名必须与 Rust 侧 update_instance_settings 发出的一致
      return listen(`widget-settings-changed:${currentLabel}`, (event) => {
        // 更新本地缓存
        instance.settings = event.payload;
        callback(event.payload);
      });
    },

    /**
     * 强制重新从后端拉取一次最新状态 (通常用于初始化)
     */
    refreshState: async () => {
      try {
        const newState = await invoke("get_instance_state", { label: currentLabel });
        instance = newState;
        return instance;
      } catch (err) {
        console.error("[WidgetEngine] Refresh state failed:", err);
      }
    }
  };

  console.log(`[WidgetEngine] SDK Injected for instance: ${currentLabel}`);
})();
