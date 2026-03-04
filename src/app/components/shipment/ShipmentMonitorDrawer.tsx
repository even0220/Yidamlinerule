import { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  History,
  Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { Switch } from '../ui/switch';
import { Drawer } from '../ui/drawer';
import { Badge, Button } from '../ui/basic';

interface ShipmentMonitorDrawerProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  shipmentId: string;
}

// Mock Rules for this specific shipment
const AVAILABLE_RULES = [
  { id: 'R-001', name: '船期严重延误 (>72h)', enabled: true },
  { id: 'R-002', name: '船名/航次 发生变更', enabled: true },
  { id: 'R-003', name: '海关查验 (Hold)', enabled: false },
  { id: 'R-004', name: '截单预警', enabled: true },
];

// Mock Timeline Events
const TIMELINE_EVENTS = [
  {
    id: 1,
    type: 'alert',
    timestamp: '2023-10-26 14:00',
    title: '触发异常预警',
    description: '检测到最新 ETA 延误超过 72 小时。已自动通知操作员(张三)。',
  },
  {
    id: 2,
    type: 'normal',
    timestamp: '2023-10-25 09:30',
    title: '例行检查',
    description: '系统扫描了船公司网站。未发现变更。',
  },
  {
    id: 3,
    type: 'normal',
    timestamp: '2023-10-24 10:00',
    title: '开启监控',
    description: '用户手动开启了本票的异常监控。',
  },
];

export default function ShipmentMonitorDrawer({ isOpen, onClose, shipmentId }: ShipmentMonitorDrawerProps) {
  const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(true);
  const [selectedRules, setSelectedRules] = useState<string[]>(['R-001', 'R-002', 'R-004']);

  // ── 前置校验：供应商是否已订阅成功并建立基准数据 ──
  // Mock: false = 尚未就绪，显示警告并禁用主开关
  const [baselineReady] = useState(false);

  const toggleRule = (ruleId: string) => {
    if (selectedRules.includes(ruleId)) {
      setSelectedRules(selectedRules.filter(id => id !== ruleId));
    } else {
      setSelectedRules([...selectedRules, ruleId]);
    }
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
                <h4 className="text-sm font-semibold text-amber-900">前置校验未通过</h4>
                <p className="text-xs text-amber-700 mt-1.5 leading-relaxed">
                  请等待供应商<strong>成功订阅</strong>后，并<strong>建立监控基准线</strong>后再开启监控。
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    <span className="text-[11px] text-amber-600 font-medium">供应商订阅中...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 bg-white" />
                    <span className="text-[11px] text-slate-400 font-medium">基准数据待建立</span>
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
                <h3 className="text-base font-semibold text-slate-900">启用监控</h3>
                <p className="text-xs text-slate-500">
                  {!baselineReady
                    ? '基准数据尚未就绪，无法开启监控。'
                    : isMonitoringEnabled
                      ? '系统正在持续追踪此订单动态。'
                      : '监控已暂停。'}
                </p>
              </div>
              <Switch 
                checked={baselineReady && isMonitoringEnabled}
                onCheckedChange={setIsMonitoringEnabled}
                disabled={!baselineReady}
                className={clsx(
                  "data-[state=checked]:bg-emerald-500",
                  !baselineReady && "opacity-50 cursor-not-allowed"
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
          <section className={clsx("space-y-3 transition-opacity duration-300", !isMonitoringEnabled && "opacity-50 pointer-events-none")}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-500" />
                应用规则
              </h3>
              <span className="text-xs text-slate-500">已启用 {selectedRules.length} 项</span>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {AVAILABLE_RULES.map((rule) => (
                <div 
                  key={rule.id}
                  onClick={() => toggleRule(rule.id)}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <span className="text-sm text-slate-700 font-medium">{rule.name}</span>
                  <div className={clsx(
                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                    selectedRules.includes(rule.id) 
                      ? "bg-indigo-600 border-indigo-600 text-white" 
                      : "border-slate-300 bg-white"
                  )}>
                    {selectedRules.includes(rule.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
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
                  {/* Timeline Dot */}
                  <div className={clsx(
                    "absolute left-0 top-1 w-2.5 h-2.5 rounded-full border-2 z-10 box-content",
                    event.type === 'alert' 
                      ? "bg-red-500 border-white ring-4 ring-red-100" 
                      : "bg-slate-400 border-white ring-4 ring-slate-100"
                  )} />
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-400 font-medium uppercase tracking-wide">
                      {event.timestamp}
                    </span>
                    <div className={clsx(
                      "text-sm font-semibold",
                      event.type === 'alert' ? "text-red-700" : "text-slate-700"
                    )}>
                      {event.title}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
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
          <Button onClick={() => onClose(false)} variant="secondary" className="mr-2">关闭</Button>
          <Button onClick={() => onClose(false)} variant="primary">保存更改</Button>
        </div>
      </div>
    </Drawer>
  );
}