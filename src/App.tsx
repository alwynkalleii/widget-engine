import { WidgetList } from "./pages/widget/list";

function App() {
  return (
    <div>
      <aside class="">
        <div class="mb-8 text-xl font-bold text-blue-600">Widget Hub</div>
        <nav class="space-y-2">
          <button class="flex w-full items-center rounded-lg bg-blue-50 px-4 py-2 text-blue-700 transition-colors">
            <span class="mr-3">🧩</span>
            小组件列表
          </button>
        </nav>

        
      </aside>
      <main class="container">
        <WidgetList />
      </main>
    </div>
  );
}

export default App;
