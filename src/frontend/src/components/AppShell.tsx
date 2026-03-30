import type { Page, Session } from "@/App";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Dashboard from "@/pages/Dashboard";
import Documents from "@/pages/Documents";
import GanttCalendar from "@/pages/GanttCalendar";
import HSE from "@/pages/HSE";
import Logistics from "@/pages/Logistics";
import MachineDetail from "@/pages/MachineDetail";
import Machines from "@/pages/Machines";
import Maintenance from "@/pages/Maintenance";
import MaintenancePlanPage from "@/pages/MaintenancePlan";
import Notifications from "@/pages/Notifications";
import PerformanceReports from "@/pages/PerformanceReports";
import Personnel from "@/pages/Personnel";
import PersonnelDetail from "@/pages/PersonnelDetail";
import ProjectCosts from "@/pages/ProjectCosts";
import ProjectDetail from "@/pages/ProjectDetail";
import Projects from "@/pages/Projects";
import Reports from "@/pages/Reports";
import Tasks from "@/pages/Tasks";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Cpu,
  DollarSign,
  Factory,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  Settings,
  ShieldAlert,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  session: Session;
  page: Page;
  navigate: (p: Page) => void;
  onLogout: () => void;
  targetMachineId?: string;
  targetPersonnelId?: string;
  setTargetPersonnelId?: (id: string) => void;
  targetProjectId?: string;
  setTargetProjectId?: (id: string) => void;
}

const navItems = [
  { id: "dashboard" as Page, label: "Ana Sayfa", icon: LayoutDashboard },
  { id: "machines" as Page, label: "Makineler", icon: Cpu },
  { id: "projects" as Page, label: "Projeler", icon: FolderKanban },
  { id: "tasks" as Page, label: "Görevler", icon: ClipboardList },
  { id: "maintenance" as Page, label: "Bakım & Arıza", icon: Wrench },
  {
    id: "maintenance-plan" as Page,
    label: "Bakım Planı",
    icon: ClipboardCheck,
  },
  { id: "performance" as Page, label: "Performans", icon: BarChart3 },
  { id: "project-costs" as Page, label: "Maliyet Takibi", icon: DollarSign },
  { id: "reports" as Page, label: "Raporlar", icon: PieChart },
  { id: "documents" as Page, label: "Dokümanlar", icon: FileText },
  { id: "hse" as Page, label: "İSG", icon: ShieldAlert },
  { id: "logistics" as Page, label: "Lojistik", icon: Truck },
  { id: "notifications" as Page, label: "Bildirimler", icon: Bell },
  { id: "calendar" as Page, label: "Takvim", icon: CalendarDays },
  { id: "personnel" as Page, label: "Personel", icon: Users, adminOnly: true },
  { id: "settings" as Page, label: "Ayarlar", icon: Settings },
];

const roleLabelMap: Record<string, string> = {
  companyAdmin: "Yönetici",
  admin: "Yönetici",
  manager: "Müdür",
  user: "Personel",
  guest: "Misafir",
};

export default function AppShell({
  session,
  page,
  navigate,
  onLogout,
  targetMachineId,
  targetPersonnelId,
  setTargetPersonnelId,
  targetProjectId,
  setTargetProjectId,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifVisited, setNotifVisited] = useState(false);

  useEffect(() => {
    if (page === "notifications") {
      setNotifVisited(true);
    }
  }, [page]);

  const showBadge = !notifVisited;

  const isAdmin = session.role === "companyAdmin" || session.role === "admin";
  const roleLabel = roleLabelMap[session.role] ?? session.role;

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  const pageTitleMap: Record<Page, string> = {
    dashboard: "Ana Sayfa",
    machines: "Makineler",
    projects: "Projeler",
    tasks: "Görev Yönetimi",
    personnel: "Personel Yönetimi",
    settings: "Ayarlar",
    maintenance: "Bakım & Arıza",
    "maintenance-plan": "Önleyici Bakım Planı",
    performance: "Performans Raporları",
    "project-costs": "Maliyet Takibi",
    documents: "Doküman Yönetimi",
    hse: "İSG Modülü",
    logistics: "Lojistik & Sevkiyat",
    notifications: "Bildirim Merkezi",
    calendar: "Takvim & Gantt",
    "machine-detail": "Makine Detayı",
    "personnel-detail": "Personel Detayı",
    "project-detail": "Proje Detayı",
    reports: "Raporlar & İstatistikler",
    landing: "Ana Sayfa",
    login: "Giriş",
    register: "Kayıt",
    "personnel-register": "Personel Kayıdı",
  };

  const handleNavigateToPersonnelDetail = (id: string) => {
    if (setTargetPersonnelId) setTargetPersonnelId(id);
    navigate("personnel-detail");
  };

  const renderPage = () => {
    switch (page) {
      case "machines":
        return <Machines session={session} />;
      case "machine-detail":
        return (
          <MachineDetail
            session={session}
            machineId={targetMachineId || ""}
            navigate={navigate}
          />
        );
      case "projects":
        return (
          <Projects
            session={session}
            navigateToDetail={(id) => {
              if (setTargetProjectId) setTargetProjectId(id);
              navigate("project-detail");
            }}
          />
        );
      case "project-detail":
        return (
          <ProjectDetail
            session={session}
            projectId={targetProjectId || ""}
            navigate={navigate}
          />
        );
      case "maintenance":
        return <Maintenance session={session} />;
      case "maintenance-plan":
        return <MaintenancePlanPage session={session} />;
      case "performance":
        return (
          <PerformanceReports
            session={session}
            navigateToDetail={handleNavigateToPersonnelDetail}
          />
        );
      case "personnel-detail":
        return (
          <PersonnelDetail
            session={session}
            personnelId={targetPersonnelId || ""}
            navigate={navigate}
          />
        );
      case "project-costs":
        return <ProjectCosts session={session} />;
      case "tasks":
        return <Tasks session={session} />;
      case "documents":
        return <Documents session={session} />;
      case "hse":
        return <HSE session={session} />;
      case "logistics":
        return <Logistics session={session} />;
      case "notifications":
        return <Notifications session={session} navigate={navigate} />;
      case "calendar":
        return <GanttCalendar session={session} />;
      case "reports":
        return <Reports session={session} />;
      case "personnel":
        return isAdmin ? (
          <Personnel />
        ) : (
          <Dashboard session={session} navigate={navigate} />
        );
      default:
        return <Dashboard session={session} navigate={navigate} />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Factory className="w-4 h-4 text-primary-foreground" />
          </div>
          <span
            className="font-bold text-lg text-sidebar-foreground"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            FactoryVerse
          </span>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Nav */}
      <nav
        className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
        aria-label="Navigasyon"
      >
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active =
            page === item.id ||
            (page === "personnel-detail" && item.id === "performance") ||
            (page === "project-detail" && item.id === "projects");
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                navigate(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
              data-ocid={`nav.${item.id}.link`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-3 pb-4">
        <Separator className="bg-sidebar-border mb-4" />
        <div className="flex items-center gap-3 px-2 mb-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">
              {session.personnelId?.slice(0, 2).toUpperCase() || "FV"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-xs font-medium truncate">
              {session.companyId
                ? `${session.companyId.slice(0, 10)}...`
                : "Kullanıcı"}
            </p>
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0 bg-sidebar-accent text-sidebar-foreground/70 border-0"
            >
              {roleLabel}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={onLogout}
          data-ocid="nav.logout.button"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex w-64 flex-shrink-0 flex-col"
        style={{
          background: "linear-gradient(180deg, #0f172a 0%, #1e2a3a 100%)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Menüyü kapat"
          />
          <aside
            className="relative z-50 w-64 h-full flex flex-col"
            style={{
              background: "linear-gradient(180deg, #0f172a 0%, #1e2a3a 100%)",
            }}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
              data-ocid="nav.menu.button"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1
              className="font-semibold text-base"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {pageTitleMap[page]}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate("notifications")}
              data-ocid="nav.notifications.button"
            >
              <Bell className="w-5 h-5" />
              {showBadge && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </Button>
            <Avatar className="w-8 h-8 cursor-pointer">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {session.personnelId?.slice(0, 2).toUpperCase() || "FV"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
