import { Outlet } from "react-router";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ThemeProvider } from "../../context/ThemeContext";
import { AuthProvider } from "../../context/AuthContext";

export function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
          <Header />
          <div className="flex pt-16">
            <Sidebar />
            <main className="flex-1 ml-64 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
