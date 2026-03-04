import { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  History
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
        
        {/* Warning Alert */}
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-800">前置校验</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                开启监控前，请确保本票已录入正确的 <strong>船公司代码 (SCAC)</strong> 和 <strong>提单号 (MBL)</strong>，否则无法进行轨迹比对。
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Master Switch */}
          <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">启用监控</h3>
                <p className="text-xs text-slate-500">
                  {isMonitoringEnabled ? '系统正在持续追踪此订单动态。' : '监控已暂停。'}
                </p>
              </div>
              <Switch 
                checked={isMonitoringEnabled}
                onCheckedChange={setIsMonitoringEnabled}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
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