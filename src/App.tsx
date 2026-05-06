import { Router, Route } from "@solidjs/router";
import { lazy } from "solid-js";

import MainLayout from "./layouts/main";

const AboutPage = lazy(() => import("./pages/about"));
const WidgetDetailPage = lazy(() => import("./pages/widgets/[id]"));
const HomePage = lazy(() => import("./pages/index"));
const FeaturesPage = lazy(() => import("./pages/features"));

function App() {
  return (
    <Router>
      <Route path="/" component={MainLayout}>
        <Route path="/" component={HomePage} />
        <Route path="/widgets/:id" component={WidgetDetailPage} />
        <Route path="/features" component={FeaturesPage} />
        <Route path="/about" component={AboutPage} />
      </Route>
    </Router>
  );
}

export default App;
