import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./components/Home";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { Parts } from "./components/Parts";
import { Transactions } from "./components/Transactions";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "login", Component: Login },
      { path: "dashboard", Component: Dashboard },
      { path: "parts", Component: Parts },
      { path: "transactions", Component: Transactions },
      { path: "*", Component: NotFound },
    ],
  },
], { basename: import.meta.env.BASE_URL });
