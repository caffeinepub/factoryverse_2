import type { Page, Session } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import { AlertTriangle, Bell, CheckCheck, Clock, Info } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  session: Session;
  navigate: (p: Page) => void;
}

interface NotificationItem {
  id: string;
  category: "ariza" | "gorev" | "sevkiyat" | "isg";
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

const SeverityIcon = ({ severity }: { severity: string }) => {
  if (severity === "critical")
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  if (severity === "warning")
    return <Clock className="w-5 h-5 text-yellow-500" />;
  return <Info className="w-5 h-5 text-blue-500" />;
};

const formatBigintDate = (ts: bigint) => {
  try {
    return new Date(Number(ts) / 1_000_000).toLocaleDateString("tr-TR");
  } catch {
    return "—";
  }
};

export default function Notifications({ session, navigate }: Props) {
  const { actor } = useActor();
  const api = actor as any;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [readAll, setReadAll] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: actor stabilizes after init
  useEffect(() => {
    const load = async () => {
      if (!api || !session.companyId) {
        setLoading(false);
        return;
      }
      try {
        const [failures, tasks, shipments, hseRecords] = await Promise.all([
          api.listFailures(session.companyId).catch(() => []),
          api.listTasks(session.companyId).catch(() => []),
          api.listShipments(session.companyId).catch(() => []),
          api.listHseRecords(session.companyId).catch(() => []),
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

        // Tasks: overdue and not completed
        for (const t of tasks as any[]) {
          if (t.status !== "Tamamlandı" && t.dueDate) {
            const due = new Date(t.dueDate);
            if (due < today) {
              items.push({
                id: `gorev-${t.id}`,
                category: "gorev",
                title: t.title,
                description: `Son tarih: ${t.dueDate} — Durum: ${t.status}`,
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

        // Sort: severity first, then by date desc
        items.sort((a, b) => {
          const so = severityOrder[a.severity] - severityOrder[b.severity];
          if (so !== 0) return so;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
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

  const byCategory = {
    ariza: notifications.filter((n) => n.category === "ariza"),
    gorev: notifications.filter((n) => n.category === "gorev"),
    sevkiyat: notifications.filter((n) => n.category === "sevkiyat"),
    isg: notifications.filter((n) => n.category === "isg"),
  };

  const sections: {
    key: keyof typeof byCategory;
    label: string;
  }[] = [
    { key: "ariza", label: "Arıza Bildirimleri" },
    { key: "gorev", label: "Görev Uyarıları" },
    { key: "sevkiyat", label: "Sevkiyat Bildirimleri" },
    { key: "isg", label: "İSG Uyarıları" },
  ];

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
              : `${notifications.length} aktif bildirim`}
          </p>
        </div>
        {!loading && notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReadAll(true)}
            disabled={readAll}
            data-ocid="notifications.read_all.button"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            {readAll ? "Tümü okundu" : "Tümünü okundu işaretle"}
          </Button>
        )}
      </div>

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
              Şu an aktif arıza, geciken görev, bekleyen sevkiyat veya açık İSG
              kaydı yok.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      {!loading &&
        sections.map(({ key, label }) => (
          <section key={key}>
            <h3
              className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {label}
              {byCategory[key].length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {byCategory[key].length}
                </span>
              )}
            </h3>

            {byCategory[key].length === 0 ? (
              <p
                className="text-sm text-muted-foreground pl-1"
                data-ocid={`notifications.${key}.empty_state`}
              >
                Bu kategoride aktif bildirim yok.
              </p>
            ) : (
              <div className="space-y-2">
                {byCategory[key].map((item, idx) => (
                  <Card
                    key={item.id}
                    className={`transition-opacity ${readAll ? "opacity-50" : ""}`}
                    data-ocid={`notifications.${key}.item.${idx + 1}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          <SeverityIcon severity={item.severity} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-snug">
                            {item.title}
                          </p>
                          <p className="text-muted-foreground text-xs mt-0.5 truncate">
                            {item.description}
                          </p>
                          <p className="text-muted-foreground/60 text-xs mt-1">
                            {item.date}
                          </p>
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
                            onClick={() => navigate(item.targetPage)}
                            data-ocid={`notifications.${key}.button.${idx + 1}`}
                          >
                            Git
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        ))}
    </div>
  );
}
