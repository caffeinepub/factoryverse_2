import type { Session } from "@/App";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export interface ActivityEntry {
  id: string;
  timestamp: number;
  action: string;
  entityType: string;
  entityName: string;
  performedBy: string;
}

export function logActivity(
  companyId: string,
  personnelId: string,
  action: string,
  entityType: string,
  entityName: string,
): void {
  try {
    const key = `fv_activity_${companyId}`;
    const existing: ActivityEntry[] = JSON.parse(
      localStorage.getItem(key) || "[]",
    );
    const entry: ActivityEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      action,
      entityType,
      entityName,
      performedBy: personnelId,
    };
    const updated = [entry, ...existing].slice(0, 200);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // silently fail
  }
}

const entityTypeColors: Record<string, string> = {
  task: "bg-blue-100 text-blue-700",
  machine: "bg-purple-100 text-purple-700",
  project: "bg-indigo-100 text-indigo-700",
  failure: "bg-red-100 text-red-700",
  maintenance: "bg-orange-100 text-orange-700",
  hse: "bg-yellow-100 text-yellow-700",
  logistics: "bg-cyan-100 text-cyan-700",
  supplier: "bg-green-100 text-green-700",
  attendance: "bg-teal-100 text-teal-700",
};

const entityTypeLabels: Record<string, string> = {
  task: "Görev",
  machine: "Makine",
  project: "Proje",
  failure: "Arıza",
  maintenance: "Bakım",
  hse: "İSG",
  logistics: "Lojistik",
  supplier: "Tedarikçi",
  attendance: "Yoklama",
};

const filterTabs = [
  { value: "all", label: "Tümü" },
  { value: "task", label: "Görev" },
  { value: "machine", label: "Makine" },
  { value: "project", label: "Proje" },
  { value: "failure", label: "Arıza" },
  { value: "other", label: "Diğer" },
];

const otherTypes = new Set([
  "maintenance",
  "hse",
  "logistics",
  "supplier",
  "attendance",
]);

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  session: Session;
}

export default function ActivityLog({ session }: Props) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    try {
      const key = `fv_activity_${session.companyId}`;
      const data: ActivityEntry[] = JSON.parse(
        localStorage.getItem(key) || "[]",
      );
      setEntries(data);
    } catch {
      setEntries([]);
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: companyId is the only relevant dep
  }, [session.companyId]);

  const handleClear = () => {
    if (
      !window.confirm("Tüm aktivite logunu silmek istediğinizden emin misiniz?")
    )
      return;
    localStorage.removeItem(`fv_activity_${session.companyId}`);
    setEntries([]);
  };

  const filtered = entries.filter((e) => {
    if (activeTab === "all") return true;
    if (activeTab === "other") return otherTypes.has(e.entityType);
    return e.entityType === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Aktivite Logu
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sistemdeki önemli işlemlerin kaydı
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="text-red-600 border-red-200 hover:bg-red-50"
          data-ocid="activity.delete_button"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Temizle
        </Button>
      </div>

      {/* Filter tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {filterTabs.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              data-ocid={`activity.${t.value}.tab`}
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* List */}
      {filtered.length === 0 ? (
        <Card data-ocid="activity.empty_state">
          <CardContent className="py-12 text-center">
            <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Henüz aktivite kaydı yok.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{filtered.length} kayıt</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Zaman
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      İşlem
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Tür
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Kayıt Adı
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Yapan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e, idx) => (
                    <tr
                      key={e.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                      data-ocid={`activity.item.${idx + 1}`}
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(e.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-medium">{e.action}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`text-xs ${
                            entityTypeColors[e.entityType] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                          variant="secondary"
                        >
                          {entityTypeLabels[e.entityType] ?? e.entityType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{e.entityName}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                        {e.performedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y">
              {filtered.map((e, idx) => (
                <div
                  key={e.id}
                  className="p-4 space-y-1"
                  data-ocid={`activity.item.${idx + 1}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{e.action}</span>
                    <Badge
                      className={`text-xs ${
                        entityTypeColors[e.entityType] ??
                        "bg-gray-100 text-gray-700"
                      }`}
                      variant="secondary"
                    >
                      {entityTypeLabels[e.entityType] ?? e.entityType}
                    </Badge>
                  </div>
                  <p className="text-sm">{e.entityName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(e.timestamp)} · {e.performedBy}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
