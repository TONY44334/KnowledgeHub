import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Home";
import BookDetail from "./BookDetail";
import Login from "./Login";
import Dashboard from "./admin/Dashboard";
import { AuthProvider } from "./AuthContext";
import { BooksProvider } from "./BooksContext";
import AdminRoute from "./AdminRoute";
import { useAuth } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute"; // if you keep a separate file

function App() {
  return (
    <Router>
      <AuthProvider>
        <BooksProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book/:id"
              element={
                <ProtectedRoute>
                  <BookDetail />
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/dashboard"
              element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BooksProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
