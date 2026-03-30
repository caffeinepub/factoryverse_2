import type { Page, Session } from "@/App";
import type { Machine, Personnel, Project, Task } from "@/backend.d";
import { Input } from "@/components/ui/input";
import { useActor } from "@/hooks/useActor";
import {
  ClipboardList,
  Cpu,
  FolderKanban,
  Loader2,
  Search,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  session: Session;
  navigate: (p: Page) => void;
  setTargetMachineId?: (id: string) => void;
  setTargetProjectId?: (id: string) => void;
}

interface Results {
  machines: Machine[];
  projects: Project[];
  tasks: Task[];
  personnel: Personnel[];
}

const MAX_PER_CAT = 5;

export default function GlobalSearch({
  open,
  onClose,
  session,
  navigate,
  setTargetMachineId,
  setTargetProjectId,
}: GlobalSearchProps) {
  const { actor } = useActor();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState<Results | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !actor) return;
    setAllData(null);
    setLoading(true);
    Promise.all([
      actor.listMachines(session.companyId),
      actor.listProjects(session.companyId),
      actor.listAllTasks(session.companyId),
      actor.listCompanyPersonnel(session.companyId),
    ])
      .then(([machines, projects, tasks, personnel]) => {
        setAllData({
          machines: machines as Machine[],
          projects: projects as Project[],
          tasks: tasks as Task[],
          personnel: personnel as Personnel[],
        });
      })
      .catch(() =>
        setAllData({ machines: [], projects: [], tasks: [], personnel: [] }),
      )
      .finally(() => setLoading(false));
  }, [open, actor, session.companyId]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const hasQuery = q.length >= 2;

  const filtered: Results =
    hasQuery && allData
      ? {
          machines: allData.machines
            .filter((m) => m.name.toLowerCase().includes(q))
            .slice(0, MAX_PER_CAT),
          projects: allData.projects
            .filter((p) => p.name.toLowerCase().includes(q))
            .slice(0, MAX_PER_CAT),
          tasks: allData.tasks
            .filter((t) => t.title.toLowerCase().includes(q))
            .slice(0, MAX_PER_CAT),
          personnel: allData.personnel
            .filter((p) => p.name.toLowerCase().includes(q))
            .slice(0, MAX_PER_CAT),
        }
      : { machines: [], projects: [], tasks: [], personnel: [] };

  const totalResults =
    filtered.machines.length +
    filtered.projects.length +
    filtered.tasks.length +
    filtered.personnel.length;

  const handleMachine = (m: Machine) => {
    if (setTargetMachineId) setTargetMachineId(m.id);
    navigate("machine-detail");
    onClose();
  };

  const handleProject = (p: Project) => {
    if (setTargetProjectId) setTargetProjectId(p.id);
    navigate("project-detail");
    onClose();
  };

  const handleTask = () => {
    navigate("tasks");
    onClose();
  };

  const handlePersonnel = () => {
    navigate("personnel");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Aramayı kapat"
      />
      <div
        className="relative bg-card rounded-xl shadow-2xl w-full max-w-xl border border-border overflow-hidden"
        data-ocid="search.modal"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Makine, proje, görev veya personel ara..."
            className="border-0 shadow-none focus-visible:ring-0 text-base px-0"
            data-ocid="search.input"
          />
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            data-ocid="search.close_button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {hasQuery && (
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div
                className="py-8 text-center"
                data-ocid="search.loading_state"
              >
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">
                  Aranıyor...
                </p>
              </div>
            ) : totalResults === 0 ? (
              <div className="py-8 text-center" data-ocid="search.empty_state">
                <p className="text-sm text-muted-foreground">
                  Sonuç bulunamadı
                </p>
              </div>
            ) : (
              <div className="py-2">
                {filtered.machines.length > 0 && (
                  <ResultGroup
                    title="Makineler"
                    icon={<Cpu className="w-3.5 h-3.5" />}
                    color="text-purple-600"
                  >
                    {filtered.machines.map((m) => (
                      <ResultItem
                        key={m.id}
                        name={m.name}
                        badge={m.machineType}
                        badgeColor="bg-purple-100 text-purple-700"
                        onClick={() => handleMachine(m)}
                      />
                    ))}
                  </ResultGroup>
                )}
                {filtered.projects.length > 0 && (
                  <ResultGroup
                    title="Projeler"
                    icon={<FolderKanban className="w-3.5 h-3.5" />}
                    color="text-indigo-600"
                  >
                    {filtered.projects.map((p) => (
                      <ResultItem
                        key={p.id}
                        name={p.name}
                        badge={p.status}
                        badgeColor="bg-indigo-100 text-indigo-700"
                        onClick={() => handleProject(p)}
                      />
                    ))}
                  </ResultGroup>
                )}
                {filtered.tasks.length > 0 && (
                  <ResultGroup
                    title="Görevler"
                    icon={<ClipboardList className="w-3.5 h-3.5" />}
                    color="text-blue-600"
                  >
                    {filtered.tasks.map((t) => (
                      <ResultItem
                        key={String(t.id)}
                        name={t.title}
                        badge={t.status}
                        badgeColor="bg-blue-100 text-blue-700"
                        onClick={handleTask}
                      />
                    ))}
                  </ResultGroup>
                )}
                {filtered.personnel.length > 0 && (
                  <ResultGroup
                    title="Personel"
                    icon={<Users className="w-3.5 h-3.5" />}
                    color="text-green-600"
                  >
                    {filtered.personnel.map((p) => (
                      <ResultItem
                        key={p.id}
                        name={p.name}
                        badge={p.role}
                        badgeColor="bg-green-100 text-green-700"
                        onClick={handlePersonnel}
                      />
                    ))}
                  </ResultGroup>
                )}
              </div>
            )}
          </div>
        )}

        {!hasQuery && (
          <div className="py-6 px-4 text-center">
            <p className="text-sm text-muted-foreground">
              En az 2 karakter girin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultGroup({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <div
        className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide ${color}`}
      >
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function ResultItem({
  name,
  badge,
  badgeColor,
  onClick,
}: {
  name: string;
  badge: string;
  badgeColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/60 transition-colors text-sm"
      onClick={onClick}
    >
      <span className="truncate text-left">{name}</span>
      {badge && (
        <span
          className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
