import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const { worker } = await import('./mocks/browser');

  // Start the worker
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

// Initialize database and MSW
async function initializeApp() {
  const { initializeDatabase } = await import('./lib/db');
  
  await enableMocking();
  await initializeDatabase();
  
  createRoot(document.getElementById("root")!).render(<App />);
}

initializeApp();
