import { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  History,
  Loader2,
  BellOff,
  Power,
  SendHorizontal,
} from "lucide-react";
import { clsx } from "clsx";
import { Switch } from "../ui/switch";
import { Drawer } from "../ui/drawer";
import { Badge, Button } from "../ui/basic";

interface ShipmentMonitorDrawerProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  shipmentId: string;
  /** Current monitoring state from parent */
  isMonitored: boolean;
  /** Number of active rules from parent */
  activeRuleCount: number;
  /** Callback when user saves changes in the drawer */
  onSave: (
    isMonitored: boolean,
    activeRuleCount: number,
  ) => void;
}

// Mock Rules for this specific shipment
const AVAILABLE_RULES = [
  { id: "R-001", name: "船期严重延误 (>72h)" },
  { id: "R-002", name: "船名/航次 发生变更" },
  { id: "R-003", name: "海关查验 (Hold)" },
  { id: "R-004", name: "截单预警" },
];

const DEFAULT_SELECTED = ["R-001", "R-002", "R-004"];

// Mock Timeline Events — 4 distinct business scenarios
type TimelineEventType =
  | "danger"
  | "warning"
  | "neutral"
  | "info";

interface TimelineEvent {
  id: number;
  type: TimelineEventType;
  timestamp: string;
  title: string;
  titleSuffix?: string;
  description: React.ReactNode;
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 1,
    type: "danger",
    timestamp: "2026-03-04 14:00",
    title: "触发异常预警",
    description: (
      <span>
        命中规则：
        <strong className="text-slate-800">
          [美线 ETA 严重延误预警]
        </strong>
        。已自动通知：操作员(
        <strong className="text-slate-800">张三</strong>), 客户(
        <strong className="text-slate-800">A公司</strong>)。
      </span>
    ),
  },
  {
    id: 2,
    type: "warning",
    timestamp: "2026-03-04 15:30",
    title: "触发预警",
    titleSuffix: "静默拦截",
    description: (
      <span>
        命中规则：
        <strong className="text-slate-600">
          [船名航次变更]
        </strong>
        。由于处于防打扰冷却期内，已静默拦截本次发送动作。
      </span>
    ),
  },
  {
    id: 3,
    type: "neutral",
    timestamp: "2026-03-04 09:30",
    title: "例行检查",
    description: "系统扫描了最新轨迹数据。未发现异常变更。",
  },
  {
    id: 4,
    type: "info",
    timestamp: "2026-03-03 10:00",
    title: "开启监控",
    description: (
      <span>
        用户 <strong className="text-slate-800">张三</strong>{" "}
        手动<strong className="text-slate-800">开启</strong>
        了本票的异常监控。
      </span>
    ),
  },
];

// ─── Timeline visual config per type ────────────────────────
const TIMELINE_DOT_STYLES: Record<TimelineEventType, string> = {
  danger: "bg-red-500 border-white ring-4 ring-red-100",
  warning: "bg-amber-500 border-white ring-4 ring-amber-100",
  neutral: "bg-slate-300 border-white ring-4 ring-slate-100",
  info: "bg-indigo-400 border-white ring-4 ring-indigo-100",
};

const TIMELINE_TITLE_STYLES: Record<TimelineEventType, string> =
  {
    danger: "text-red-600 font-semibold",
    warning: "text-amber-600 font-semibold",
    neutral: "text-slate-700 font-medium",
    info: "text-slate-800 font-semibold",
  };

const TIMELINE_DESC_STYLES: Record<TimelineEventType, string> =
  {
    danger: "text-slate-700",
    warning: "text-slate-500",
    neutral: "text-slate-500",
    info: "text-slate-600",
  };

export default function ShipmentMonitorDrawer({
  isOpen,
  onClose,
  shipmentId,
  isMonitored,
  activeRuleCount,
  onSave,
}: ShipmentMonitorDrawerProps) {
  // ── Local draft state (only committed on "保存") ──
  const [draftEnabled, setDraftEnabled] = useState(isMonitored);
  const [selectedRules, setSelectedRules] =
    useState<string[]>(DEFAULT_SELECTED);

  // ── 前置校验 Mock: true = 已就绪。这个可以配置效果设置 false 为供应商未订阅 ──
  const [baselineReady] = useState(false);

  // ── Reset draft state each time drawer opens ──
  const prevOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpen.current) {
      // Drawer just opened → sync draft from parent truth
      setDraftEnabled(isMonitored);
    }
    prevOpen.current = isOpen;
  }, [isOpen, isMonitored]);

  const toggleRule = (ruleId: string) => {
    setSelectedRules((prev) =>
      prev.includes(ruleId)
        ? prev.filter((id) => id !== ruleId)
        : [...prev, ruleId],
    );
  };

  // ── Save: commit draft → parent ──
  const handleSave = () => {
    const effectiveMonitored = baselineReady && draftEnabled;
    onSave(
      effectiveMonitored,
      effectiveMonitored ? selectedRules.length : 0,
    );
    onClose(false);
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={onClose}
      title="单票异常监控"
      description={`配置订单 ${shipmentId} 的监控规则`}
      width="max-w-md"
    >
      <div className="flex flex-col h-full bg-slate-50">
        {/* Warning Alert - 前置校验 */}
        {!baselineReady && (
          <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900">
                  前置校验未通过
                </h4>
                <p className="text-xs text-amber-700 mt-1.5 leading-relaxed">
                  请等待供应商<strong>成功订阅</strong>后，并
                  <strong>建立监控基准线</strong>后再开启监控。
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    <span className="text-[11px] text-amber-600 font-medium">
                      供应商未订阅
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 bg-white" />
                    <span className="text-[11px] text-slate-400 font-medium">
                      基准数据待建立
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Master Switch */}
          <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">
                  启用监控
                </h3>
                <p className="text-xs text-slate-500">
                  {!baselineReady
                    ? "基准数据尚未就绪，无法开启监控。"
                    : draftEnabled
                      ? "系统正在持续追踪此订单动态。"
                      : "监控已暂停。"}
                </p>
              </div>
              <Switch
                checked={baselineReady && draftEnabled}
                onCheckedChange={setDraftEnabled}
                disabled={!baselineReady}
                className={clsx(
                  "data-[state=checked]:bg-emerald-500",
                  !baselineReady &&
                    "opacity-50 cursor-not-allowed",
                )}
              />
            </div>
            {!baselineReady && (
              <div className="mt-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  当供应商完成订阅并返回首次基准数据后，此开关将自动解锁。
                </p>
              </div>
            )}
          </section>

          {/* Rule Selection */}
          <section
            className={clsx(
              "space-y-3 transition-opacity duration-300",
              !draftEnabled && "opacity-50 pointer-events-none",
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-500" />
                应用规则
              </h3>
              <span className="text-xs text-slate-500">
                已启用 {selectedRules.length} 项
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {AVAILABLE_RULES.map((rule) => (
                <div
                  key={rule.id}
                  onClick={() => toggleRule(rule.id)}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <span className="text-sm text-slate-700 font-medium">
                    {rule.name}
                  </span>
                  <div
                    className={clsx(
                      "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                      selectedRules.includes(rule.id)
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-slate-300 bg-white",
                    )}
                  >
                    {selectedRules.includes(rule.id) && (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline / Logs */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              监控日志
            </h3>

            <div className="relative pl-4 space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200">
              {TIMELINE_EVENTS.map((event) => (
                <div key={event.id} className="relative pl-8">
                  {/* Timeline Node Dot */}
                  <div
                    className={clsx(
                      "absolute left-0 top-1 w-2.5 h-2.5 rounded-full border-2 z-10 box-content",
                      TIMELINE_DOT_STYLES[event.type],
                    )}
                  />

                  <div className="flex flex-col gap-1">
                    {/* Timestamp */}
                    <span className="text-[10px] font-mono text-slate-400 font-medium uppercase tracking-wide">
                      {event.timestamp}
                    </span>

                    {/* Title row */}
                    <div
                      className={clsx(
                        "text-sm flex items-center gap-1.5",
                        TIMELINE_TITLE_STYLES[event.type],
                      )}
                    >
                      {event.type === "danger" && (
                        <SendHorizontal className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      )}
                      <span>{event.title}</span>
                      {event.type === "warning" &&
                        event.titleSuffix && (
                          <span className="inline-flex items-center gap-1 ml-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-semibold border border-amber-200">
                            <BellOff className="w-3 h-3 text-amber-500" />
                            {event.titleSuffix}
                          </span>
                        )}
                      {event.type === "info" && (
                        <Power className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      )}
                    </div>

                    {/* Description */}
                    <p
                      className={clsx(
                        "text-xs leading-relaxed",
                        TIMELINE_DESC_STYLES[event.type],
                      )}
                    >
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
          <Button
            onClick={() => onClose(false)}
            variant="secondary"
            className="mr-2"
          >
            关闭
          </Button>
          <Button onClick={handleSave} variant="primary">
            保存更改
          </Button>
        </div>
      </div>
    </Drawer>
  );
}