import { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  X, Plus, Trash2, Save, AlertTriangle, Play,
  Clock, Anchor, Repeat2, Timer, Info, Flag, ChevronDown,
  ExternalLink, Mail, Bell, MessageSquare, Users, Pen, Languages,
  Copy, Search, CheckCircle2, XCircle, AlertOctagon, Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ────────────────────────────────────────────────────
interface ConditionRow {
  monitorTarget: string;
  operator: string;
  value: string;
  unit: string;
  // transit fields
  transitCompare: string;
  // node_timeout fields
  startNode: string;
  endNode: string;
  // milestone fields
  milestoneNodes: string[];
}

interface RuleFormValues {
  name: string;
  domains: string[];
  cooldown: number;
  enabled: boolean;
  logicOperator: 'AND' | 'OR';
  conditions: ConditionRow[];
  actionType: string;
  templateId: string;
  recipients: string[];
  channels: string[];
}

type DrawerMode = 'create' | 'edit' | 'duplicate';

interface RuleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  mode?: DrawerMode;
}

// ─── Domain Options ───────────────────────────────────────────
const DOMAIN_OPTIONS = [
  { id: 'sea_export', label: '海运出口', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'sea_import', label: '海运进口', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { id: 'air_export', label: '空运出口', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { id: 'air_import', label: '空运进口', color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

// ─── Condition Category System ────────────────────────────────
type TargetCategory = 'date' | 'attribute' | 'transit' | 'node_timeout' | 'milestone';

const MONITOR_TARGETS: { group: string; icon: typeof Clock; items: { value: string; label: string; category: TargetCategory }[] }[] = [
  {
    group: '日期类',
    icon: Clock,
    items: [
      { value: 'latest_etd', label: '最新 ETD', category: 'date' },
      { value: 'latest_atd', label: '最新 ATD', category: 'date' },
      { value: 'latest_eta', label: '最新 ETA', category: 'date' },
    ],
  },
  {
    group: '属性类',
    icon: Anchor,
    items: [
      { value: 'vessel_name', label: '最新船名', category: 'attribute' },
      { value: 'voyage_no', label: '最新航次', category: 'attribute' },
    ],
  },
  {
    group: '中转类',
    icon: Repeat2,
    items: [
      { value: 'actual_transit', label: '实际中转行为', category: 'transit' },
    ],
  },
  {
    group: '节点超时',
    icon: Timer,
    items: [
      { value: 'node_timeout', label: '节点停滞超时', category: 'node_timeout' },
    ],
  },
  {
    group: '里程碑达成',
    icon: Flag,
    items: [
      { value: 'milestone_nodes', label: '特定里程碑达成', category: 'milestone' },
    ],
  },
];

const OPERATORS_BY_CATEGORY: Record<TargetCategory, { value: string; label: string }[]> = {
  date: [
    { value: 'delay_gt', label: '对比基准延误大于' },
    { value: 'ahead_gt', label: '对比基准提前大于' },
  ],
  attribute: [
    { value: 'neq_baseline', label: '不等于基准数据' },
    { value: 'eq_baseline', label: '等于基准数据' },
  ],
  transit: [
    { value: 'neq', label: '不等于' },
  ],
  node_timeout: [
    { value: 'exceed', label: '超过' },
  ],
  milestone: [
    { value: 'reached', label: '达到' },
  ],
};

// Transit comparison options
const TRANSIT_PLAN_OPTIONS = [
  { value: 'planned_direct', label: '原定中转计划 (直达)' },
  { value: 'planned_one_ts', label: '原定中转计划 (一程中转)' },
  { value: 'planned_two_ts', label: '原定中转计划 (二程中转)' },
];

// Shipping milestone node dictionary (full container tracking lifecycle)
const NODE_DICTIONARY = [
  // ── 提箱 & 起运地 ──
  { value: 'ECPU', label: 'ECPU 提空箱', group: '提箱 & 起运地' },
  { value: 'GIOI', label: 'GIOI 起运地重箱进港', group: '提箱 & 起运地' },
  { value: 'LOFV', label: 'LOFV 支线装船', group: '提箱 & 起运地' },
  { value: 'FVD', label: 'FVD 支线开航', group: '提箱 & 起运地' },
  { value: 'FVA', label: 'FVA 支线抵港', group: '提箱 & 起运地' },
  { value: 'DFFV', label: 'DFFV 支线卸船', group: '提箱 & 起运地' },
  // ── 起运港 ──
  { value: 'GIPOL', label: 'GIPOL 起运港重箱进港', group: '起运港' },
  { value: 'CDPOL', label: 'CDPOL 出口海关放行', group: '起运港' },
  { value: 'TDPOL', label: 'TDPOL 出口码头放行', group: '起运港' },
  { value: 'LOAD', label: 'LOAD 起运港装船完成', group: '起运港' },
  { value: 'DPOL', label: 'DPOL 起运港开航', group: '起运港' },
  { value: 'ETD', label: 'ETD 预计起运港开航', group: '起运港' },
  // ── 中转港 ──
  { value: 'EAIP', label: 'EAIP 预计中转抵港', group: '中转港' },
  { value: 'AIP', label: 'AIP 中转抵港', group: '中转港' },
  { value: 'BIP', label: 'BIP 中转靠泊', group: '中转港' },
  { value: 'ETDIP', label: 'ETDIP 预计中转港卸载', group: '中转港' },
  { value: 'DIIP', label: 'DIIP 中转卸载', group: '中转港' },
  { value: 'GOIP', label: 'GOIP 中转出场', group: '中转港' },
  { value: 'GIIP', label: 'GIIP 中转进场', group: '中转港' },
  { value: 'LIP', label: 'LIP 中转装船完成', group: '中转港' },
  { value: 'EDIP', label: 'EDIP 预计中转开航', group: '中转港' },
  { value: 'DEIP', label: 'DEIP 中转开航', group: '中转港' },
  // ── 目的港 ──
  { value: 'ETA', label: 'ETA 预计到港时间', group: '目的港' },
  { value: 'APOD', label: 'APOD 到达目的港', group: '目的港' },
  { value: 'BPOD', label: 'BPOD 目的港靠泊', group: '目的港' },
  { value: 'DIPOD', label: 'DIPOD 目的港卸载', group: '目的港' },
  { value: 'CDPOD', label: 'CDPOD 目的港海关放行', group: '目的港' },
  { value: 'TDPOD', label: 'TDPOD 目的港码头放行', group: '目的港' },
  // ── 目的地内陆 ──
  { value: 'LDI', label: 'LDI 目的港装载完成', group: '目的地内陆' },
  { value: 'LOR', label: 'LOR 铁路装货完成', group: '目的地内陆' },
  { value: 'DFR', label: 'DFR 铁路发车', group: '目的地内陆' },
  { value: 'RA', label: 'RA 铁路抵达', group: '目的地内陆' },
  { value: 'DIFR', label: 'DIFR 铁路卸载', group: '目的地内陆' },
  { value: 'LOT', label: 'LOT 卡车装货完成', group: '目的地内陆' },
  { value: 'DFT', label: 'DFT 卡车发车', group: '目的地内陆' },
  { value: 'TA', label: 'TA 卡车抵达', group: '目的地内陆' },
  { value: 'DIFT', label: 'DIFT 卡车卸载', group: '目的地内陆' },
  { value: 'ADI', label: 'ADI 到达目的地', group: '目的地内陆' },
  { value: 'DIDI', label: 'DIDI 目的地卸载', group: '目的地内陆' },
  // ── 放货 & 还箱 ──
  { value: 'CGRL', label: 'CGRL 船东放货', group: '放货 & 还箱' },
  { value: 'RFP', label: 'RFP 可提柜', group: '放货 & 还箱' },
  { value: 'GOPOD', label: 'GOPOD 提重箱', group: '放货 & 还箱' },
  { value: 'ECRT', label: 'ECRT 还空箱', group: '放货 & 还箱' },
];

const TEMPLATES = [
  {
    id: 'tpl_001',
    name: '标准延误通知 (邮件)',
    language: 'zh-CN',
    channels: ['email', 'system'],
    recipients: ['op', 'sales'],
    titlePreview: '待处理: 货物延误提醒 - {MBL}',
  },
  {
    id: 'tpl_002',
    name: '紧急操作通知 (短信)',
    language: 'zh-CN',
    channels: ['wecom'],
    recipients: ['op', 'manager'],
    titlePreview: '紧急: {MBL} 船期严重延误，请立即处理',
  },
  {
    id: 'tpl_003',
    name: '内部预警 (Slack/企微)',
    language: 'zh-CN',
    channels: ['wecom', 'system'],
    recipients: ['op', 'manager'],
    titlePreview: '内部预警: {MBL} 异常变更通知',
  },
  {
    id: 'tpl_004',
    name: '外部客户-标准节点跟进邮件 (英文)',
    language: 'en',
    channels: ['email'],
    recipients: ['booking_client', 'notify_party'],
    titlePreview: 'Shipment Update: {MBL} milestone reached',
  },
  {
    id: 'tpl_005',
    name: '外部客户-标准节点跟进邮件 (中文)',
    language: 'zh-CN',
    channels: ['email', 'system'],
    recipients: ['booking_client', 'notify_party', 'sales'],
    titlePreview: '货物动态更新: {MBL} 节点跟进通知',
  },
  {
    id: 'tpl_007',
    name: 'Delay Alert - Standard (Email)',
    language: 'en',
    channels: ['email', 'system'],
    recipients: ['op', 'sales'],
    titlePreview: 'Action Required: Shipment Delay - {MBL}',
  },
  {
    id: 'tpl_008',
    name: 'Transshipment Change Notice (EN)',
    language: 'en',
    channels: ['email'],
    recipients: ['booking_client', 'notify_party'],
    titlePreview: 'Routing Change: {MBL} - Transshipment Update',
  },
];

const RECIPIENT_ROLES = [
  { id: 'op', label: '@责任操作(OP)' },
  { id: 'sales', label: '@责任销售(Sales)' },
  { id: 'manager', label: '@部门经理' },
  { id: 'customer', label: '@客户联系人' },
  { id: 'booking_client', label: '@订舱客户(Booking Client)' },
  { id: 'notify_party', label: '@通知人(Notify Party)' },
];

// ─── Helpers ──────────────────────────────────────────────────
function getCategory(targetValue: string): TargetCategory | null {
  for (const group of MONITOR_TARGETS) {
    for (const item of group.items) {
      if (item.value === targetValue) return item.category;
    }
  }
  return null;
}

function emptyRow(target = 'latest_eta'): ConditionRow {
  return { monitorTarget: target, operator: '', value: '', unit: 'hours', transitCompare: 'planned_direct', startNode: 'GIPOL', endNode: 'LOAD', milestoneNodes: [] };
}

// ─── Default Values ──────────────────────────────────────────
const DEFAULT_VALUES: RuleFormValues = {
  name: '',
  domains: ['sea_export'],
  cooldown: 12,
  enabled: true,
  logicOperator: 'AND',
  conditions: [{ ...emptyRow('latest_eta'), operator: 'delay_gt', value: '72' }],
  actionType: 'notify',
  templateId: '',
  recipients: ['op'],
  channels: ['system', 'email'],
};

// 5 scenario demo rows
const MOCK_SCENARIOS: ConditionRow[] = [
  { monitorTarget: 'latest_eta', operator: 'delay_gt', value: '72', unit: 'hours', transitCompare: 'planned_direct', startNode: 'GIPOL', endNode: 'LOAD', milestoneNodes: [] },
  { monitorTarget: 'vessel_name', operator: 'neq_baseline', value: '', unit: '', transitCompare: 'planned_direct', startNode: 'GIPOL', endNode: 'LOAD', milestoneNodes: [] },
  { monitorTarget: 'actual_transit', operator: 'neq', value: '', unit: '', transitCompare: 'planned_direct', startNode: 'GIPOL', endNode: 'LOAD', milestoneNodes: [] },
  { monitorTarget: 'node_timeout', operator: 'exceed', value: '5', unit: 'days', transitCompare: 'planned_direct', startNode: 'GIPOL', endNode: 'LOAD', milestoneNodes: [] },
  { monitorTarget: 'milestone_nodes', operator: 'reached', value: '', unit: '', transitCompare: 'planned_direct', startNode: 'GIPOL', endNode: 'LOAD', milestoneNodes: ['DPOL', 'APOD'] },
];

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function RuleDrawer({ isOpen, onClose, initialData, mode: modeProp }: RuleDrawerProps) {
  const mode: DrawerMode = modeProp || (initialData ? 'edit' : 'create');
  const { register, control, handleSubmit, reset, watch, setValue, getValues } = useForm<RuleFormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'conditions' });
  const [isTesting, setIsTesting] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [overrideEnabled, setOverrideEnabled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOverrideEnabled(false);
      if (initialData) {
        const isDuplicate = mode === 'duplicate';
        reset({
          ...DEFAULT_VALUES,
          name: isDuplicate ? `${initialData.name} - 副本` : (initialData.name || ''),
          domains: initialData.domains || ['sea_export'],
          enabled: isDuplicate ? false : (initialData.status ?? true),
          conditions: MOCK_SCENARIOS,
          templateId: 'tpl_001',
          recipients: ['op', 'sales'],
        });
      } else {
        reset({
          ...DEFAULT_VALUES,
          conditions: [{ ...emptyRow('latest_eta'), operator: 'delay_gt' }],
        });
      }
    }
  }, [isOpen, initialData, mode, reset]);

  const onSubmit = (data: RuleFormValues) => {
    console.log('Saving Rule:', data);
    if (mode === 'duplicate') {
      toast.success('规则克隆成功', { description: `「${data.name}」已创建，默认为停用状态。` });
    } else {
      toast.success(mode === 'edit' ? '规则已更新' : '规则创建成功');
    }
    onClose();
  };

  const handleTestRun = () => {
    setTestModalOpen(true);
  };

  const watchDomains = watch('domains');
  const watchLogic = watch('logicOperator');

  const toggleDomain = (id: string) => {
    const current = getValues('domains');
    const updated = current.includes(id) ? current.filter((d: string) => d !== id) : [...current, id];
    setValue('domains', updated);
  };

  const toggleRecipient = (id: string) => {
    const current = getValues('recipients');
    setValue('recipients', current.includes(id) ? current.filter(r => r !== id) : [...current, id]);
  };

  const toggleChannel = (ch: string) => {
    const current = getValues('channels');
    setValue('channels', current.includes(ch) ? current.filter(c => c !== ch) : [...current, ch]);
  };

  if (!isOpen) return null;

  const drawerTitle = mode === 'duplicate' ? '克隆预警规则' : (mode === 'edit' ? '编辑预警规则' : '新建预警规则');
  const drawerSubtitle = mode === 'duplicate'
    ? '基于已有规则创建副本，所有配置已预填充，请确认后保存。'
    : '配置自动化异常检测逻辑与响应动作。';
  const saveLabel = mode === 'duplicate' ? '保存副本' : '保存并启用';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 w-full max-w-[740px] bg-white shadow-2xl flex flex-col">
        {/* ── Header ──────────────────────────────── */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            {mode === 'duplicate' && (
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <Copy className="w-4 h-4 text-indigo-600" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {drawerTitle}
              </h2>
              <p className="text-sm text-slate-500">{drawerSubtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Clone Info Banner ───────────────────── */}
        {mode === 'duplicate' && initialData && (
          <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-start gap-3 shrink-0">
            <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div className="text-xs text-indigo-800 leading-relaxed">
              <span className="font-semibold">克隆来源：</span>
              <span className="font-mono bg-indigo-100 px-1.5 py-0.5 rounded mx-1">{initialData.id}</span>
              {initialData.name}
              <span className="text-indigo-600 ml-2">— 所有条件与动作已继承，规则状态默认为停用。</span>
            </div>
          </div>
        )}

        {/* ── Warning Banner ─────────────────────── */}
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-3 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">注意：</span>使用对比基准规则前，需确保系统内已成功获取第一笔基准数据，否则规则将被跳过。
          </p>
        </div>

        {/* ── Scrollable Content ────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <form id="rule-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* ════ Section 1: Basic Info ════ */}
            <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <SectionHeader num={1} title="基础信息" />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  规则名称 <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('name', { required: true })}
                  type="text"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                  placeholder="例如：美线 ETA 严重延误预警"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">适用业务域</label>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_OPTIONS.map(d => {
                    const selected = watchDomains.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDomain(d.id)}
                        className={clsx(
                          "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all select-none",
                          selected
                            ? `${d.color} ring-1 ring-offset-1 ring-current shadow-sm`
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                        )}
                      >
                        {selected && <span className="mr-1">✓</span>}
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                    防打扰冷却期
                    <span className="relative group cursor-help">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 shadow-lg">
                        触发报警后，同一票单据在此时间内不会重复报警
                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                      </span>
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      {...register('cooldown', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <span className="text-sm text-slate-500 shrink-0">小时</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">规则状态</label>
                  <Controller
                    control={control}
                    name="enabled"
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={clsx(
                          "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg border transition-all",
                          field.value
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        )}
                      >
                        <div className={clsx(
                          "relative w-10 h-5 rounded-full transition-colors",
                          field.value ? "bg-emerald-500" : "bg-slate-300"
                        )}>
                          <div className={clsx(
                            "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                            field.value ? "translate-x-5" : "translate-x-0.5"
                          )} />
                        </div>
                        <span className="text-sm font-medium">{field.value ? '已启用' : '已停用'}</span>
                      </button>
                    )}
                  />
                </div>
              </div>
            </section>

            {/* ════ Section 2: Condition Builder ════ */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 pb-4 border-b border-slate-100">
                <SectionHeader num={2} title="触发条件 (IF)" subtitle="拼接监控对象与判定逻辑，支持多条件组合" />
              </div>

              <div className="bg-slate-900 m-3 rounded-xl p-4 shadow-inner">
                {/* Logic operator toggle */}
                <div className="flex items-center gap-3 mb-4 text-sm">
                  <span className="text-slate-400">当满足以下</span>
                  <div className="inline-flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                    {(['AND', 'OR'] as const).map(op => (
                      <label
                        key={op}
                        className={clsx(
                          "px-3 py-1 rounded-md cursor-pointer transition-colors text-xs font-bold",
                          watchLogic === op ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        )}
                      >
                        <input type="radio" value={op} {...register('logicOperator')} className="hidden" />
                        {op === 'AND' ? '全部 (AND)' : '任意 (OR)'}
                      </label>
                    ))}
                  </div>
                  <span className="text-slate-400">条件时触发：</span>
                </div>

                {/* Condition Rows */}
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {fields.map((field, index) => (
                      <ConditionRowComponent
                        key={field.id}
                        index={index}
                        register={register}
                        watch={watch}
                        setValue={setValue}
                        onRemove={() => remove(index)}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={() => append(emptyRow('latest_eta'))}
                  className="mt-4 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors border border-dashed border-slate-700 hover:border-indigo-500/50 w-full justify-center"
                >
                  <Plus className="w-4 h-4" />
                  添加条件
                </button>
              </div>
            </section>

            {/* ════ Section 3: Action Execution ════ */}
            <ActionSection
              register={register}
              watch={watch}
              setValue={setValue}
              getValues={getValues}
              overrideEnabled={overrideEnabled}
              setOverrideEnabled={setOverrideEnabled}
              toggleRecipient={toggleRecipient}
              toggleChannel={toggleChannel}
            />

          </form>
        </div>

        {/* ── Test Run Modal ──────────────────────── */}
        <TestRunModal isOpen={testModalOpen} onClose={() => setTestModalOpen(false)} ruleName={watch('name')} />

        {/* ── Footer ─────────────────────────────── */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleTestRun}
            disabled={isTesting}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
              isTesting ? "border-slate-200 text-slate-400 bg-slate-50 cursor-wait" : "border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400"
            )}
          >
            {isTesting ? <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
            {isTesting ? '测试中...' : '模拟测试 (Test Run)'}
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">取消</button>
            <button type="submit" form="rule-form" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
              {mode === 'duplicate' ? <Copy className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  TEST RUN MODAL
// ═══════════════════════════════════════════════════════════════

type TestResult = 'hit' | 'miss' | null;

const MOCK_TEST_DATA: Record<string, { result: TestResult; detail: string }> = {
  'COSU62738492': { result: 'hit', detail: '最新 ETA 延误 96 小时（基准 ETA: 2026-03-10 → 最新 ETA: 2026-03-14）' },
  'MAEU12345678': { result: 'miss', detail: '最新 ETA 延误 12 小时，未超过阈值 72 小时' },
  'OOLU98765432': { result: 'hit', detail: '船名由 CSCL SATURN 变更为 COSCO FORTUNE，触发属性变更规则' },
};

function TestRunModal({ isOpen, onClose, ruleName }: { isOpen: boolean; onClose: () => void; ruleName: string }) {
  const [mblInput, setMblInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TestResult>(null);
  const [resultDetail, setResultDetail] = useState('');
  const [inputError, setInputError] = useState('');

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setMblInput('');
      setIsRunning(false);
      setResult(null);
      setResultDetail('');
      setInputError('');
    }
  }, [isOpen]);

  const handleStartTest = () => {
    if (!mblInput.trim()) {
      setInputError('请输入提单号');
      return;
    }
    setInputError('');
    setIsRunning(true);
    setResult(null);

    // Simulate API call
    setTimeout(() => {
      const mockResult = MOCK_TEST_DATA[mblInput.trim().toUpperCase()];
      if (mockResult) {
        setResult(mockResult.result);
        setResultDetail(mockResult.detail);
      } else {
        // Random result for unknown MBL
        const isHit = Math.random() > 0.5;
        setResult(isHit ? 'hit' : 'miss');
        setResultDetail(
          isHit
            ? `最新 ETA 延误 ${Math.floor(Math.random() * 120 + 73)} 小时，超过阈值 72 小时`
            : '该单据当前轨迹数据不满足任何已配置的触发条件'
        );
      }
      setIsRunning(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">规则模拟测试</h3>
              {ruleName && (
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[320px]">
                  当前规则：{ruleName}
                </p>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            输入一个已存在轨迹数据的提单号 (MBL)，系统将使用当前表单中的规则条件进行一次
            <span className="font-semibold text-slate-700">"空跑 (Dry-Run)"</span>
            ，<span className="text-amber-600 font-medium">不会实际发送通知</span>。
          </p>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-5">
          {/* MBL Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              提单号 (MBL No.) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={mblInput}
                onChange={e => { setMblInput(e.target.value); setInputError(''); }}
                onKeyDown={e => e.key === 'Enter' && !isRunning && handleStartTest()}
                placeholder="例如：COSU62738492"
                className={clsx(
                  "w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-shadow font-mono tracking-wide",
                  inputError
                    ? "border-red-300 focus:ring-2 focus:ring-red-500"
                    : "border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                )}
                autoFocus
                disabled={isRunning}
              />
            </div>
            {inputError && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {inputError}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-1.5">
              可试用示例：COSU62738492（命中）、MAEU12345678（未命中）
            </p>
          </div>

          {/* Running Indicator */}
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-100"
            >
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-indigo-800">正在执行空跑测试...</p>
                <p className="text-xs text-indigo-600 mt-0.5">
                  正在检索 <span className="font-mono font-semibold">{mblInput}</span> 的轨迹数据并匹配规则条件
                </p>
              </div>
            </motion.div>
          )}

          {/* Result Card */}
          {result && !isRunning && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {result === 'hit' ? (
                <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 overflow-hidden">
                  <div className="px-4 py-3 bg-emerald-100 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-sm font-semibold text-emerald-800">✅ 命中预警！</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-sm text-emerald-800 leading-relaxed">
                      当前单据的数据满足上述规则条件，在实际运行中<strong>将会触发通知</strong>。
                    </p>
                    <div className="flex items-start gap-2 px-3 py-2 bg-white rounded-lg border border-emerald-200">
                      <Info className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-emerald-700 leading-relaxed">{resultDetail}</p>
                    </div>
                    <p className="text-[11px] text-emerald-600 italic">
                      此为模拟结果，不会实际发送通知或产生工单。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50 overflow-hidden">
                  <div className="px-4 py-3 bg-amber-100 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="text-sm font-semibold text-amber-800">⛔ 未命中预警</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-sm text-amber-800 leading-relaxed">
                      该单据当前数据<strong>不满足</strong>触发条件，在实际运行中不会产生预警。
                    </p>
                    <div className="flex items-start gap-2 px-3 py-2 bg-white rounded-lg border border-amber-200">
                      <Info className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700 leading-relaxed">{resultDetail}</p>
                    </div>
                    <p className="text-[11px] text-amber-600 italic">
                      可尝试调整规则条件阈值或更换其他提单号重新测试。
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            测试结果仅供参考，以线上实际数据为准
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-white transition-colors"
            >
              {result ? '关闭' : '取消'}
            </button>
            <button
              onClick={handleStartTest}
              disabled={isRunning}
              className={clsx(
                "px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2",
                isRunning
                  ? "bg-indigo-400 text-white cursor-wait"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              )}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  测试中...
                </>
              ) : result ? (
                <>
                  <Play className="w-4 h-4" />
                  重新测试
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  开始测试
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function SectionHeader({ num, title, subtitle }: { num: number; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">{num}</div>
      <div>
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Dark select pill styling helper ──────────────────────────
const SEL = "bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none";
const SEL_SMALL = "bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none";
const INPUT_DARK = "bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-600 text-center";

// Group node dictionary by group field for optgroup rendering
const NODE_GROUPS = NODE_DICTIONARY.reduce<{ group: string; nodes: typeof NODE_DICTIONARY }[]>((acc, node) => {
  const existing = acc.find(g => g.group === node.group);
  if (existing) {
    existing.nodes.push(node);
  } else {
    acc.push({ group: node.group, nodes: [node] });
  }
  return acc;
}, []);

function NodeSelect({ name, register, className }: { name: string; register: any; className: string }) {
  return (
    <select {...register(name)} className={className}>
      {NODE_GROUPS.map(g => (
        <optgroup key={g.group} label={`── ${g.group}`}>
          {g.nodes.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

// ─── Condition Row Component ──────────────────────────────────
function ConditionRowComponent({
  index,
  register,
  watch,
  setValue,
  onRemove,
}: {
  index: number;
  register: any;
  watch: any;
  setValue: any;
  onRemove: () => void;
}) {
  const target = watch(`conditions.${index}.monitorTarget`);
  const category = getCategory(target);
  const operators = category ? OPERATORS_BY_CATEGORY[category] : [];

  // Auto-set operator when target category changes
  useEffect(() => {
    if (category && operators.length > 0) {
      const currentOp = watch(`conditions.${index}.operator`);
      if (!operators.some(o => o.value === currentOp)) {
        setValue(`conditions.${index}.operator`, operators[0].value);
      }
    }
  }, [target, category]);

  const hintText = category === 'attribute'
    ? '系统将自动与单票首次获取的基准数据进行比对'
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600 transition-colors group">
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-mono text-slate-500 mt-2.5 w-5 text-right select-none shrink-0">{index + 1}.</span>

          <div className="flex-1 space-y-2">
            {/* ── Scenario: DATE ────────────────────── */}
            {category === 'date' && (
              <div className="flex flex-wrap items-center gap-2">
                <select {...register(`conditions.${index}.monitorTarget`)} className={clsx(SEL, "flex-1 min-w-[140px]")}>
                  {MONITOR_TARGETS.map(g => (
                    <optgroup key={g.group} label={`── ${g.group}`}>
                      {g.items.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </optgroup>
                  ))}
                </select>
                <select {...register(`conditions.${index}.operator`)} className={clsx(SEL, "min-w-[170px]")}>
                  {operators.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                </select>
                <input {...register(`conditions.${index}.value`)} type="number" placeholder="数值" className={clsx(INPUT_DARK, "w-20")} />
                <select {...register(`conditions.${index}.unit`)} className={clsx(SEL_SMALL, "w-20")}>
                  <option value="hours">小时</option>
                  <option value="days">天</option>
                </select>
              </div>
            )}

            {/* ── Scenario: ATTRIBUTE ────────────────── */}
            {category === 'attribute' && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <select {...register(`conditions.${index}.monitorTarget`)} className={clsx(SEL, "flex-1 min-w-[140px]")}>
                    {MONITOR_TARGETS.map(g => (
                      <optgroup key={g.group} label={`── ${g.group}`}>
                        {g.items.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <select {...register(`conditions.${index}.operator`)} className={clsx(SEL, "min-w-[160px]")}>
                    {operators.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                  </select>
                </div>
                {hintText && <p className="text-[11px] text-slate-500 italic pl-1">{hintText}</p>}
              </>
            )}

            {/* ── Scenario: TRANSIT ──────────────────── */}
            {category === 'transit' && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <select {...register(`conditions.${index}.monitorTarget`)} className={clsx(SEL, "flex-1 min-w-[140px]")}>
                    {MONITOR_TARGETS.map(g => (
                      <optgroup key={g.group} label={`── ${g.group}`}>
                        {g.items.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <select {...register(`conditions.${index}.operator`)} className={clsx(SEL, "w-24")}>
                    {operators.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                  </select>
                  <select {...register(`conditions.${index}.transitCompare`)} className={clsx(SEL, "flex-1 min-w-[180px]")}>
                    {TRANSIT_PLAN_OPTIONS.map(tp => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 italic pl-1">如实际发生中转而原定为直达，则触发预警</p>
              </>
            )}

            {/* ── Scenario: NODE TIMEOUT ─────────────── */}
            {category === 'node_timeout' && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Fixed label select */}
                  <select {...register(`conditions.${index}.monitorTarget`)} className={clsx(SEL, "min-w-[140px]")}>
                    {MONITOR_TARGETS.map(g => (
                      <optgroup key={g.group} label={`── ${g.group}`}>
                        {g.items.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  {/* Start node */}
                  <NodeSelect name={`conditions.${index}.startNode`} register={register} className={clsx(SEL, "flex-1 min-w-[200px]")} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* "超过" operator */}
                  <span className="text-xs text-slate-400 font-medium px-1 shrink-0">┗</span>
                  <select {...register(`conditions.${index}.operator`)} className={clsx(SEL_SMALL, "w-20")}>
                    {operators.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                  </select>
                  <input {...register(`conditions.${index}.value`)} type="number" placeholder="数值" className={clsx(INPUT_DARK, "w-16")} />
                  <select {...register(`conditions.${index}.unit`)} className={clsx(SEL_SMALL, "w-16")}>
                    <option value="hours">小时</option>
                    <option value="days">天</option>
                  </select>
                  <span className="text-xs text-amber-400 font-semibold px-1 shrink-0">未发生</span>
                  {/* End node */}
                  <NodeSelect name={`conditions.${index}.endNode`} register={register} className={clsx(SEL, "flex-1 min-w-[200px]")} />
                </div>
                <p className="text-[11px] text-slate-500 italic pl-1">即：从起点节点发生后，超过设定时长仍未发生终点节点事件</p>
              </>
            )}

            {/* ── Scenario: MILESTONE ─────────────── */}
            {category === 'milestone' && (
              <MilestoneNodePicker index={index} register={register} watch={watch} setValue={setValue} />
            )}

            {/* ── Fallback: unknown / not yet selected ── */}
            {!category && (
              <div className="flex flex-wrap items-center gap-2">
                <select {...register(`conditions.${index}.monitorTarget`)} className={clsx(SEL, "flex-1 min-w-[140px]")}>
                  {MONITOR_TARGETS.map(g => (
                    <optgroup key={g.group} label={`── ${g.group}`}>
                      {g.items.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </optgroup>
                  ))}
                </select>
                <span className="text-xs text-slate-500">请选择监控对象...</span>
              </div>
            )}
          </div>

          {/* Delete btn */}
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-slate-700/50 transition-colors mt-1 shrink-0 opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Milestone Node Picker ──────────────────────────────────
function MilestoneNodePicker({
  index,
  register,
  watch,
  setValue,
}: {
  index: number;
  register: any;
  watch: any;
  setValue: any;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedNodes: string[] = watch(`conditions.${index}.milestoneNodes`) || [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleNode = (nodeValue: string) => {
    if (selectedNodes.includes(nodeValue)) {
      setValue(`conditions.${index}.milestoneNodes`, selectedNodes.filter(n => n !== nodeValue));
    } else {
      setValue(`conditions.${index}.milestoneNodes`, [...selectedNodes, nodeValue]);
    }
  };

  const removeNode = (nodeValue: string) => {
    setValue(`conditions.${index}.milestoneNodes`, selectedNodes.filter(n => n !== nodeValue));
  };

  const getNodeLabel = (val: string) => {
    const node = NODE_DICTIONARY.find(n => n.value === val);
    return node ? node.label : val;
  };

  const getNodeShortLabel = (val: string) => {
    const node = NODE_DICTIONARY.find(n => n.value === val);
    if (!node) return val;
    // Extract just CODE + short Chinese name
    const parts = node.label.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts.slice(1).join('')}` : node.label;
  };

  const filteredGroups = NODE_GROUPS.map(g => ({
    ...g,
    nodes: g.nodes.filter(n =>
      search === '' || n.label.toLowerCase().includes(search.toLowerCase()) || n.value.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(g => g.nodes.length > 0);

  return (
    <>
      {/* Row 1: monitor target select */}
      <div className="flex flex-wrap items-center gap-2">
        <select {...register(`conditions.${index}.monitorTarget`)} className={clsx(SEL, "min-w-[160px]")}>
          {MONITOR_TARGETS.map(g => (
            <optgroup key={g.group} label={`── ${g.group}`}>
              {g.items.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </optgroup>
          ))}
        </select>
        <span className="text-xs text-emerald-400 font-semibold shrink-0">达成以下任一节点时触发</span>
      </div>

      {/* Row 2: selected chips + add button */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {selectedNodes.map(nodeVal => (
          <span
            key={nodeVal}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-900/40 text-emerald-300 border border-emerald-700/60 select-none"
          >
            <Flag className="w-3 h-3 opacity-70" />
            {getNodeShortLabel(nodeVal)}
            <button
              type="button"
              onClick={() => removeNode(nodeVal)}
              className="ml-0.5 text-emerald-400 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Add node dropdown trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => { setDropdownOpen(!dropdownOpen); setSearch(''); }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-dashed border-slate-600 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
          >
            <Plus className="w-3 h-3" />
            添加节点
            <ChevronDown className={clsx("w-3 h-3 transition-transform", dropdownOpen && "rotate-180")} />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute z-50 top-full mt-1 left-0 w-72 bg-slate-900 border border-slate-600 rounded-lg shadow-2xl overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-slate-700">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="搜索节点代码或名称..."
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
              {/* Grouped list */}
              <div className="max-h-52 overflow-y-auto p-1">
                {filteredGroups.map(g => (
                  <div key={g.group}>
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{g.group}</div>
                    {g.nodes.map(n => {
                      const isSelected = selectedNodes.includes(n.value);
                      return (
                        <button
                          key={n.value}
                          type="button"
                          onClick={() => toggleNode(n.value)}
                          className={clsx(
                            "w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between",
                            isSelected
                              ? "bg-emerald-900/40 text-emerald-300"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          )}
                        >
                          <span>{n.label}</span>
                          {isSelected && <span className="text-emerald-400 text-[10px] font-bold">&#10003;</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}
                {filteredGroups.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-3">无匹配结果</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedNodes.length === 0 && (
        <p className="text-[11px] text-amber-500/80 italic pl-1">请至少选择一个里程碑节点</p>
      )}
      <p className="text-[11px] text-slate-500 italic pl-1">当任一选中节点实际发生时，自动触发通知动作</p>
    </>
  );
}

// ─── Action Section Component ────────────────────────────────
const CHANNEL_LABELS: Record<string, { label: string; icon: typeof Mail }> = {
  email: { label: '邮件', icon: Mail },
  system: { label: '站内信', icon: Bell },
  wecom: { label: '企业微信/钉钉', icon: MessageSquare },
};

const LANG_SHORT: Record<string, string> = {
  'zh-CN': '🇨🇳 中',
  'en': '🇺🇸 EN',
  'zh-TW': '🇭🇰 繁',
  'ja': '🇯🇵 JA',
};

function ActionSection({
  register,
  watch,
  setValue,
  getValues,
  overrideEnabled,
  setOverrideEnabled,
  toggleRecipient,
  toggleChannel,
}: {
  register: any;
  watch: any;
  setValue: any;
  getValues: any;
  overrideEnabled: boolean;
  setOverrideEnabled: (value: boolean) => void;
  toggleRecipient: (id: string) => void;
  toggleChannel: (ch: string) => void;
}) {
  const templateId = watch('templateId');
  const selectedTemplate = TEMPLATES.find(t => t.id === templateId);

  // Sync form recipients/channels from selected template when override is off
  useEffect(() => {
    if (selectedTemplate && !overrideEnabled) {
      setValue('recipients', selectedTemplate.recipients);
      setValue('channels', selectedTemplate.channels);
    }
  }, [templateId, overrideEnabled]);

  const recipientLabel = (id: string) => RECIPIENT_ROLES.find(r => r.id === id)?.label || id;

  return (
    <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
      <SectionHeader num={3} title="执行动作 (THEN)" />

      {/* Action Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">动作类型</label>
        <select {...register('actionType')} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
          <option value="notify">发送通知</option>
          <option value="webhook">触发 Webhook</option>
          <option value="auto_hold">自动 Hold 单</option>
        </select>
      </div>

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          通知模板 <span className="text-red-400">*</span>
        </label>
        <select {...register('templateId', { required: true })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
          <option value="">请选择已配置的通知模板...</option>
          {TEMPLATES.map(t => (
            <option key={t.id} value={t.id}>
              [{LANG_SHORT[t.language] || t.language}] {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Template Summary Card ── */}
      {selectedTemplate && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          {/* Summary Header */}
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-indigo-100 flex items-center justify-center">
                <Info className="w-3 h-3 text-indigo-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700">模板预设配置</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">自动继承</span>
            </div>
            <a
              href="/templates"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              前往模板管理页修改
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Title Preview */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">标题预览</p>
            <p className="text-sm text-slate-800 font-mono bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100">{selectedTemplate.titlePreview}</p>
          </div>

          {/* Recipients & Channels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {/* Recipients */}
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Users className="w-3 h-3" /> 接收人
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedTemplate.recipients.map(rid => (
                  <span key={rid} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {recipientLabel(rid)}
                  </span>
                ))}
              </div>
            </div>
            {/* Channels */}
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Bell className="w-3 h-3" /> 通知渠道
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedTemplate.channels.map(cid => {
                  const ch = CHANNEL_LABELS[cid];
                  return ch ? (
                    <span key={cid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <ch.icon className="w-3 h-3" />
                      {ch.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Override Toggle ── */}
      {selectedTemplate && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              const next = !overrideEnabled;
              setOverrideEnabled(next);
              if (!next && selectedTemplate) {
                setValue('recipients', selectedTemplate.recipients);
                setValue('channels', selectedTemplate.channels);
              }
            }}
            className={clsx(
              "flex items-center gap-2.5 w-full px-4 py-2.5 rounded-lg border transition-all text-sm",
              overrideEnabled
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
            )}
          >
            <div className={clsx(
              "relative w-9 h-5 rounded-full transition-colors shrink-0",
              overrideEnabled ? "bg-amber-500" : "bg-slate-300"
            )}>
              <div className={clsx(
                "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                overrideEnabled ? "translate-x-4" : "translate-x-0.5"
              )} />
            </div>
            <div className="text-left">
              <span className="font-medium">{overrideEnabled ? '已开启本规则覆盖' : '本规则覆盖接收人 & 渠道'}</span>
              <p className="text-[11px] opacity-70 mt-0.5">
                {overrideEnabled ? '以下设置将覆盖模板的预设，仅对本规则生效' : '默认继承模板配置，开启后可对本规则单独调整'}
              </p>
            </div>
            <Pen className={clsx("w-4 h-4 shrink-0 ml-auto", overrideEnabled ? "text-amber-600" : "text-slate-400")} />
          </button>

          {/* Override controls */}
          {overrideEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 pl-1 border-l-2 border-amber-300 ml-1"
            >
              {/* Recipient override */}
              <div className="pl-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                  接收人
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">覆盖</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {RECIPIENT_ROLES.map(role => {
                    const selected = watch('recipients').includes(role.id);
                    return (
                      <button key={role.id} type="button" onClick={() => toggleRecipient(role.id)} className={clsx(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all select-none",
                        selected ? "bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                      )}>
                        {selected && <span className="mr-1">✓</span>}{role.label}
                      </button>
                    );
                  })}
                  <button type="button" className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors">
                    + 输入邮箱地址
                  </button>
                </div>
              </div>

              {/* Channel override */}
              <div className="pl-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                  通知渠道
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">覆盖</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'system', label: '站内信' },
                    { id: 'email', label: '邮件' },
                    { id: 'wecom', label: '企业微信/钉钉' },
                  ].map(ch => {
                    const checked = watch('channels').includes(ch.id);
                    return (
                      <label key={ch.id} className={clsx(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-sm",
                        checked ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      )}>
                        <div className={clsx(
                          "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                          checked ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                        )}>
                          {checked && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleChannel(ch.id)} />
                        {ch.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Auto-execution info */}
      <div className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-800 rounded-lg text-sm border border-indigo-100">
        <div className="shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 border border-indigo-100">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <p className="font-medium">自动执行</p>
          <p className="text-xs opacity-80">本规则将对选中业务域下的所有订单自动生效。</p>
        </div>
      </div>
    </section>
  );
}