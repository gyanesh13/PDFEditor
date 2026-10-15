
import { useLocation } from "react-router-dom";
import Header from "./components/layout/Header";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const { pathname } = useLocation();

  const isAuthPage = [
    "/login",
    "/signup",
  ].includes(pathname);

  return (
    <>
      {!isAuthPage && <Header />}
      <AppRoutes />
    </>
  );
}
