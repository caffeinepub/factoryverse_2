import type { Page, Session } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Clock,
  Info,
  Package,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  session: Session;
  navigate: (p: Page) => void;
}

type NotifCategory = "ariza" | "gorev" | "sevkiyat" | "isg" | "stok";

interface NotificationItem {
  id: string;
  category: NotifCategory;
  title: string;
  description: string;
  date: string;
  severity: "critical" | "warning" | "info";
  targetPage: Page;
}

const severityOrder = { critical: 0, warning: 1, info: 2 };

const severityBadge: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border border-red-200",
  warning: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  info: "bg-blue-100 text-blue-700 border border-blue-200",
};

const severityLabel: Record<string, string> = {
  critical: "Kritik",
  warning: "Uyarı",
  info: "Bilgi",
};

const categoryIcon: Record<NotifCategory, React.ReactNode> = {
  ariza: <AlertTriangle className="w-5 h-5 text-red-500" />,
  gorev: <Clock className="w-5 h-5 text-blue-500" />,
  sevkiyat: <Info className="w-5 h-5 text-blue-500" />,
  isg: <AlertTriangle className="w-5 h-5 text-orange-500" />,
  stok: <Package className="w-5 h-5 text-yellow-500" />,
};

const formatBigintDate = (ts: bigint) => {
  try {
    return new Date(Number(ts) / 1_000_000).toLocaleDateString("tr-TR");
  } catch {
    return "—";
  }
};

type FilterTab = "all" | "unread" | "gorev" | "ariza" | "stok";

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "unread", label: "Okunmamış" },
  { key: "gorev", label: "Görev" },
  { key: "ariza", label: "Arıza" },
  { key: "stok", label: "Stok" },
];

export default function Notifications({ session, navigate }: Props) {
  const { actor } = useActor();
  const api = actor as any;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    const load = async () => {
      if (!api || !session.companyId) {
        setLoading(false);
        return;
      }
      try {
        const [failures, tasks, shipments, hseRecords, spareParts] =
          await Promise.all([
            api.listFailures(session.companyId).catch(() => []),
            api.listAllTasks(session.companyId).catch(() => []),
            api.listShipments(session.companyId).catch(() => []),
            api.listHseRecords(session.companyId).catch(() => []),
            api.listSpareParts(session.companyId).catch(() => []),
          ]);

        const items: NotificationItem[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Failures: open or in-progress
        for (const f of failures as any[]) {
          if (f.status === "open" || f.status === "in-progress") {
            items.push({
              id: `ariza-${f.id}`,
              category: "ariza",
              title: f.title,
              description: `Makine: ${f.machineId || "Belirtilmedi"} — Önem: ${
                f.severity === "critical"
                  ? "Kritik"
                  : f.severity === "high"
                    ? "Yüksek"
                    : f.severity === "medium"
                      ? "Orta"
                      : "Düşük"
              }`,
              date: formatBigintDate(f.reportedAt),
              severity:
                f.severity === "critical" || f.severity === "high"
                  ? "critical"
                  : f.severity === "medium"
                    ? "warning"
                    : "info",
              targetPage: "maintenance",
            });
          }
        }

        // Tasks: pending or open
        for (const t of tasks as any[]) {
          if (
            t.status === "pending" ||
            t.status === "Beklemede" ||
            t.status === "Açık"
          ) {
            items.push({
              id: `gorev-${t.id}`,
              category: "gorev",
              title: `${t.title} görevi atandı`,
              description: `Proje: ${t.projectId || "Genel"} — Durum: ${t.status}${t.dueDate ? ` — Son: ${t.dueDate}` : ""}`,
              date: t.dueDate || "",
              severity: "info",
              targetPage: "tasks",
            });
          } else if (
            t.status !== "done" &&
            t.status !== "Tamamlandı" &&
            t.dueDate
          ) {
            const due = new Date(t.dueDate);
            if (due < today) {
              items.push({
                id: `gorev-overdue-${t.id}`,
                category: "gorev",
                title: t.title,
                description: `Son tarih geçti: ${t.dueDate} — Durum: ${t.status}`,
                date: t.dueDate,
                severity: "warning",
                targetPage: "tasks",
              });
            }
          }
        }

        // Shipments: planned but past ship date
        for (const s of shipments as any[]) {
          if (s.status === "Planlandı" && s.shipDate) {
            const shipD = new Date(s.shipDate);
            if (shipD < today) {
              items.push({
                id: `sevkiyat-${s.id}`,
                category: "sevkiyat",
                title: s.machineName || s.machineId || "Sevkiyat",
                description: `Çıkış: ${s.origin} → Varış: ${s.destination} — Planlanan tarih geçti`,
                date: s.shipDate,
                severity: "warning",
                targetPage: "logistics",
              });
            }
          }
        }

        // HSE: open records
        for (const h of hseRecords as any[]) {
          if (h.status === "open") {
            items.push({
              id: `isg-${h.id}`,
              category: "isg",
              title: h.title,
              description: `Tür: ${
                h.type === "accident"
                  ? "Kaza"
                  : h.type === "audit"
                    ? "Denetim"
                    : "Risk"
              } — Açık durum`,
              date: formatBigintDate(h.createdAt),
              severity: h.type === "accident" ? "critical" : "warning",
              targetPage: "hse",
            });
          }
        }

        // Spare parts: low stock
        for (const sp of spareParts as any[]) {
          const qty = Number(sp.quantity ?? 0);
          const min = Number(sp.minStock ?? 0);
          if (qty <= min) {
            items.push({
              id: `stok-${sp.id}`,
              category: "stok",
              title: `${sp.name} yedek parçası stok uyarısı`,
              description: `Mevcut stok: ${qty} ${sp.unit || "adet"} — Min stok: ${min} — Makine: ${sp.machineId || "—"}`,
              date: "",
              severity: qty === 0 ? "critical" : "warning",
              targetPage: "machines",
            });
          }
        }

        // Sort: severity first, then by date desc
        items.sort((a, b) => {
          const so = severityOrder[a.severity] - severityOrder[b.severity];
          if (so !== 0) return so;
          return (
            new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
          );
        });

        setNotifications(items);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session.companyId, actor]);

  const handleMarkRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleMarkAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "unread") return !readIds.has(n.id);
    if (activeFilter === "gorev") return n.category === "gorev";
    if (activeFilter === "ariza") return n.category === "ariza";
    if (activeFilter === "stok") return n.category === "stok";
    return true;
  });

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Bildirim Merkezi
          </h2>
          <p className="text-muted-foreground text-sm">
            {loading
              ? "Yükleniyor..."
              : `${notifications.length} bildirim${unreadCount > 0 ? `, ${unreadCount} okunmamış` : ""}`}
          </p>
        </div>
        {!loading && notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            data-ocid="notifications.read_all.button"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            {unreadCount === 0 ? "Tümü okundu" : "Tümünü okundu işaretle"}
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      {!loading && notifications.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          data-ocid="notifications.filter.tab"
        >
          {filterTabs.map((tab) => {
            const count =
              tab.key === "all"
                ? notifications.length
                : tab.key === "unread"
                  ? unreadCount
                  : notifications.filter((n) => n.category === tab.key).length;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      activeFilter === tab.key
                        ? "bg-white/30 text-white font-bold"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3" data-ocid="notifications.loading_state">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Overall empty state */}
      {!loading && notifications.length === 0 && (
        <Card data-ocid="notifications.empty_state">
          <CardContent className="pt-16 pb-16 flex flex-col items-center gap-3 text-center">
            <Bell className="w-14 h-14 text-muted-foreground/30" />
            <p className="font-semibold text-lg">Harika, her şey yolunda!</p>
            <p className="text-muted-foreground text-sm">
              Şu an aktif arıza, bekleyen görev, stok uyarısı veya açık İSG
              kaydı yok.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filtered empty state */}
      {!loading &&
        notifications.length > 0 &&
        filteredNotifications.length === 0 && (
          <Card data-ocid="notifications.filter.empty_state">
            <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3 text-center">
              <Bell className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">
                Bu filtrede bildirim yok.
              </p>
            </CardContent>
          </Card>
        )}

      {/* Notifications list */}
      {!loading && filteredNotifications.length > 0 && (
        <div className="space-y-2">
          {filteredNotifications.map((item, idx) => {
            const isRead = readIds.has(item.id);
            return (
              <Card
                key={item.id}
                className={`transition-all cursor-pointer ${
                  isRead ? "opacity-50" : "hover:shadow-sm"
                }`}
                onClick={() => handleMarkRead(item.id)}
                data-ocid={`notifications.item.${idx + 1}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {categoryIcon[item.category]}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm leading-snug">
                          {item.title}
                        </p>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {item.description}
                      </p>
                      {item.date && (
                        <p className="text-muted-foreground/60 text-xs mt-1">
                          {item.date}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          severityBadge[item.severity]
                        }`}
                      >
                        {severityLabel[item.severity]}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(item.targetPage);
                        }}
                        data-ocid={`notifications.button.${idx + 1}`}
                      >
                        Git
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
