import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import App from "./App";
import AuthPage from "./AuthPage";
import Dashboard from "./Dashboard";
import ExamPage from "./ExamPage";
import { AuthProvider } from "./AuthContext";

const theme = extendTheme({
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme} resetCSS={true}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/exam/:id" element={<ExamPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  </React.StrictMode>
);
