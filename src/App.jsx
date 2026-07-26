import { useState, useEffect } from "react";
import Discovery from "./Discovery.jsx";
import MentorPortal from "./MentorPortal.jsx";
import MenteePortal from "./MenteePortal.jsx";
import AdminPortal from "./AdminPortal.jsx";

// Deliberately no react-router: three routes don't justify the dependency,
// and this keeps the repo editable straight from GitHub's web UI.
// Requires the SPA rewrite in vercel.json so deep links resolve to index.html.

function currentRoute() {
  const path = (window.location.pathname || "/").replace(/\/+$/, "").toLowerCase();
  if (path === "/mentor") return "mentor";
  if (path === "/dashboard") return "dashboard";
  if (path === "/admin") return "admin";
  return "discovery";
}

export function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function App() {
  const [route, setRoute] = useState(currentRoute());

  useEffect(() => {
    const onPop = () => setRoute(currentRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (route === "mentor") return <MentorPortal />;
  if (route === "dashboard") return <MenteePortal />;
  if (route === "admin") return <AdminPortal />;
  return <Discovery />;
}
