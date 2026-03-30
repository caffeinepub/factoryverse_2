import AppShell from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import CompanyRegister from "@/pages/CompanyRegister";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import PersonnelRegister from "@/pages/PersonnelRegister";
import { useEffect, useState } from "react";

export type Page =
  | "landing"
  | "login"
  | "register"
  | "personnel-register"
  | "dashboard"
  | "machines"
  | "projects"
  | "personnel"
  | "settings"
  | "maintenance"
  | "tasks"
  | "documents"
  | "hse"
  | "logistics"
  | "notifications"
  | "calendar"
  | "maintenance-plan"
  | "machine-detail"
  | "performance"
  | "project-costs"
  | "personnel-detail"
  | "project-detail"
  | "reports"
  | "suppliers"
  | "attendance"
  | "activity-log"
  | "shifts";

export interface Session {
  companyId: string;
  personnelId: string;
  role: string;
}

const SESSION_KEY = "fv_session";

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [page, setPage] = useState<Page>("landing");
  const [ready, setReady] = useState(false);
  const [targetMachineId, setTargetMachineId] = useState<string | undefined>();
  const [targetPersonnelId, setTargetPersonnelId] = useState<
    string | undefined
  >();
  const [targetProjectId, setTargetProjectId] = useState<string | undefined>();

  useEffect(() => {
    const s = getSession();
    const machineId = new URLSearchParams(window.location.search).get(
      "machineId",
    );
    if (s) {
      setSession(s);
      if (machineId) {
        setTargetMachineId(machineId);
        setPage("machine-detail");
      } else {
        setPage("dashboard");
      }
    }
    setReady(true);
  }, []);

  const navigate = (p: Page) => setPage(p);

  const handleLogin = (s: Session) => {
    saveSession(s);
    setSession(s);
    setPage("dashboard");
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setPage("landing");
  };

  if (!ready) return null;

  if (!session) {
    return (
      <>
        <Toaster position="top-right" />
        {page === "landing" && <Landing navigate={navigate} />}
        {page === "login" && (
          <Login navigate={navigate} onLogin={handleLogin} />
        )}
        {page === "register" && <CompanyRegister navigate={navigate} />}
        {page === "personnel-register" && (
          <PersonnelRegister navigate={navigate} />
        )}
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <AppShell
        session={session}
        page={page}
        navigate={navigate}
        onLogout={handleLogout}
        targetMachineId={targetMachineId}
        setTargetMachineId={setTargetMachineId}
        targetPersonnelId={targetPersonnelId}
        setTargetPersonnelId={setTargetPersonnelId}
        targetProjectId={targetProjectId}
        setTargetProjectId={setTargetProjectId}
      />
    </>
  );
}
