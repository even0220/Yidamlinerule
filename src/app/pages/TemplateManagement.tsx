import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import TemplateList, { type TemplateItem } from '../components/templates/TemplateList';
import type { TemplateLang } from '../components/templates/TemplateList';
import TemplateEditor from '../components/templates/TemplateEditor';
import TemplatePreview from '../components/templates/TemplatePreview';

// ─── Mock Template Data ──────────────────────────────────────
const INITIAL_TEMPLATES: TemplateItem[] = [
  {
    id: 'tpl_001',
    name: '标准延误通知 (邮件)',
    language: 'zh-CN',
    channels: ['email', 'system'],
    recipients: ['op', 'sales'],
    title: '待处理: 货物延误提醒 - {MBL}',
    body: `尊敬的客户：

很抱歉地通知您，您关注的货物 {MBL} (箱号: {Container}) 目前发生船期延误。

原定 ETA: {Original ETA}
最新 ETA: {Latest ETA}
预计延误: {Delay_Hours} 小时

我们正在密切监控承运人 ({Vessel/Voyage}) 的后续动态，如有更新将第一时间通知。

此致，
YIDAM 客服团队`,
    updatedAt: '2026-02-28 14:30',
    usedByRules: 2,
    status: 'active',
  },
  {
    id: 'tpl_002',
    name: '紧急操作通知 (短信)',
    language: 'zh-CN',
    channels: ['wecom'],
    recipients: ['op', 'manager'],
    title: '紧急: {MBL} 船期严重延误，请立即处理',
    body: `⚠️ 紧急通知

提单号: {MBL}
箱号: {Container}
船名/航次: {Vessel/Voyage}

该票货物已严重延误 {Delay_Days} 天，请立即联系承运人确认最新方案并同步客户 {Customer_Name}。

— YIDAM 预警系统`,
    updatedAt: '2026-02-25 10:15',
    usedByRules: 1,
    status: 'active',
  },
  {
    id: 'tpl_003',
    name: '内部预警 (Slack/企微)',
    language: 'zh-CN',
    channels: ['wecom', 'system'],
    recipients: ['op', 'manager'],
    title: '内部预警: {MBL} 异常变更通知',
    body: `📋 异常变更预警

提单号: {MBL}
客户: {Customer_Name}
船名/航次: {Vessel/Voyage}
起运港: {Port_Load}

系统检测到该票货物发生异常变更，请及时核实并跟进处理。

— YIDAM 预警引擎`,
    updatedAt: '2026-02-20 16:45',
    usedByRules: 1,
    status: 'active',
  },
  {
    id: 'tpl_004',
    name: '外部客户-标准节点跟进邮件 (英文)',
    language: 'en',
    channels: ['email'],
    recipients: ['booking_client', 'notify_party'],
    title: 'Shipment Update: {MBL} milestone reached',
    body: `Dear Customer,

We would like to inform you about the latest status update for your shipment.

MBL: {MBL}
Container: {Container}
Vessel/Voyage: {Vessel/Voyage}
Port of Loading: {Port_Load}

A key milestone has been reached. Please feel free to contact us if you have any questions.

Best regards,
YIDAM Logistics Team`,
    updatedAt: '2026-03-01 09:00',
    usedByRules: 1,
    status: 'active',
  },
  {
    id: 'tpl_005',
    name: '外部客户-标准节点跟进邮件 (中文)',
    language: 'zh-CN',
    channels: ['email', 'system'],
    recipients: ['booking_client', 'notify_party', 'sales'],
    title: '货物动态更新: {MBL} 节点跟进通知',
    body: `尊敬的 {Customer_Name}：

您的货物运输状态已更新，以下是最新动态：

提单号: {MBL}
箱号: {Container}
船名/航次: {Vessel/Voyage}
起运港: {Port_Load}

关键节点已达成，如有疑问请随时联系我们。

此致，
YIDAM 物流团队`,
    updatedAt: '2026-03-01 09:05',
    usedByRules: 1,
    status: 'active',
  },
  {
    id: 'tpl_006',
    name: '中转变更通知 (草稿)',
    language: 'zh-CN',
    channels: ['email'],
    recipients: ['op', 'customer'],
    title: '中转计划变更通知 - {MBL}',
    body: `您好，

以下货物的中转计划发生变更：

提单号: {MBL}
箱号: {Container}
原定中转: 直达
实际中转: 一程中转

请关注最新的 ETA 变化：
最新 ETA: {Latest ETA}

如有需要，我们的操作团队将与您进一步沟通。

此致，
YIDAM 团队`,
    updatedAt: '2026-02-18 11:30',
    usedByRules: 0,
    status: 'draft',
  },
  {
    id: 'tpl_007',
    name: 'Delay Alert - Standard (Email)',
    language: 'en',
    channels: ['email', 'system'],
    recipients: ['op', 'sales'],
    title: 'Action Required: Shipment Delay - {MBL}',
    body: `Dear Team,

Please be advised that shipment {MBL} (Container: {Container}) is currently experiencing a delay.

Original ETA: {Original ETA}
Latest ETA: {Latest ETA}
Estimated Delay: {Delay_Hours} hours

We are closely monitoring updates from the carrier ({Vessel/Voyage}) and will notify you of any changes.

Best regards,
YIDAM Alert System`,
    updatedAt: '2026-03-01 11:20',
    usedByRules: 1,
    status: 'active',
  },
  {
    id: 'tpl_008',
    name: 'Transshipment Change Notice (EN)',
    language: 'en',
    channels: ['email'],
    recipients: ['booking_client', 'notify_party'],
    title: 'Routing Change: {MBL} - Transshipment Update',
    body: `Dear Customer,

We would like to inform you of a change in the routing plan for your shipment:

MBL: {MBL}
Container: {Container}
Original Plan: Direct
Actual Routing: One transshipment

Please note the updated schedule:
Latest ETA: {Latest ETA}

Our operations team is available for any questions or concerns.

Kind regards,
YIDAM Logistics Team`,
    updatedAt: '2026-02-27 08:45',
    usedByRules: 0,
    status: 'active',
  },
];

// ─── Form type ────────────────────────────────────────────────
interface TemplateFormValues {
  name: string;
  language: TemplateLang;
  channels: string[];
  recipients: string[];
  title: string;
  body: string;
}

// ═══════════════════════════════════════════════════════════════
export default function TemplateManagement() {
  const [templates, setTemplates] = useState<TemplateItem[]>(INITIAL_TEMPLATES);
  const [selectedId, setSelectedId] = useState<string | null>(INITIAL_TEMPLATES[0].id);
  const [isNew, setIsNew] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  const selectedTemplate = templates.find(t => t.id === selectedId) || null;

  const form = useForm<TemplateFormValues>({
    defaultValues: {
      name: '',
      language: 'zh-CN',
      channels: ['email', 'system'],
      recipients: ['op'],
      title: '',
      body: '',
    },
  });

  const { watch, handleSubmit, reset, formState } = form;

  // Load selected template into form
  const loadTemplate = useCallback((template: TemplateItem) => {
    reset({
      name: template.name,
      language: template.language,
      channels: template.channels,
      recipients: template.recipients,
      title: template.title,
      body: template.body,
    });
    setIsDirty(false);
  }, [reset]);

  // Initial load
  useEffect(() => {
    if (selectedTemplate) {
      loadTemplate(selectedTemplate);
    }
  }, [selectedId]);

  // Track dirty state
  useEffect(() => {
    const subscription = watch(() => {
      setIsDirty(true);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleSelect = (template: TemplateItem) => {
    if (isDirty && selectedId !== template.id) {
      const discard = confirm('当前模板有未保存的修改，确定要切换吗？');
      if (!discard) return;
    }
    setSelectedId(template.id);
    setIsNew(false);
  };

  const handleCreateNew = () => {
    if (isDirty) {
      const discard = confirm('当前模板有未保存的修改，确定要新建吗？');
      if (!discard) return;
    }
    const newId = `tpl_${String(Date.now()).slice(-6)}`;
    const newTemplate: TemplateItem = {
      id: newId,
      name: '新建通知模板',
      language: 'zh-CN',
      channels: ['email'],
      recipients: ['op'],
      title: '',
      body: '',
      updatedAt: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
      usedByRules: 0,
      status: 'draft',
    };
    setTemplates(prev => [newTemplate, ...prev]);
    setSelectedId(newId);
    setIsNew(true);
    reset({
      name: newTemplate.name,
      language: newTemplate.language,
      channels: newTemplate.channels,
      recipients: newTemplate.recipients,
      title: newTemplate.title,
      body: newTemplate.body,
    });
    setIsDirty(false);
  };

  const handleDuplicate = (id: string) => {
    const source = templates.find(t => t.id === id);
    if (!source) return;
    const newId = `tpl_${String(Date.now()).slice(-6)}`;
    const copy: TemplateItem = {
      ...source,
      id: newId,
      name: `${source.name} (副本)`,
      updatedAt: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
      usedByRules: 0,
      status: 'draft',
    };
    setTemplates(prev => [copy, ...prev]);
    setSelectedId(newId);
    setIsNew(true);
    toast.success('模板已复制');
  };

  const handleDelete = (id: string) => {
    const tpl = templates.find(t => t.id === id);
    if (tpl && tpl.usedByRules > 0) {
      toast.error(`该模板被 ${tpl.usedByRules} 条规则引用，无法删除`);
      return;
    }
    if (!confirm('确定要删除这个模板吗？')) return;
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (selectedId === id) {
      const remaining = templates.filter(t => t.id !== id);
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    }
    toast.success('模板已删除');
  };

  const onSubmit = (data: TemplateFormValues) => {
    if (!selectedId) return;
    setTemplates(prev => prev.map(t =>
      t.id === selectedId
        ? {
            ...t,
            name: data.name,
            language: data.language,
            channels: data.channels,
            recipients: data.recipients,
            title: data.title,
            body: data.body,
            updatedAt: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
            status: 'active' as const,
          }
        : t
    ));
    setIsDirty(false);
    setIsNew(false);
    toast.success('模板保存成功！');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">

      {/* ═══ Panel 1: Template List ═══ */}
      <div className="w-64 xl:w-72 shrink-0 border-r border-slate-200 bg-white">
        <TemplateList
          templates={templates}
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreateNew={handleCreateNew}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      </div>

      {/* ═══ Panel 2: Editor ═══ */}
      <div className="flex-1 min-w-0 flex flex-col border-r border-slate-200">
        {selectedId ? (
          <>
            <form id="template-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 min-h-0">
              <TemplateEditor form={form} isNew={isNew} />
            </form>

            {/* Editor Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {isDirty && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    未保存的更改
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Preview toggle (for smaller screens) */}
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={clsx(
                    "lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    showPreview
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPreview ? '隐藏预览' : '显示预览'}
                </button>

                <button
                  type="submit"
                  form="template-form"
                  className={clsx(
                    "flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm",
                    isDirty
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-slate-200 text-slate-500 cursor-default"
                  )}
                >
                  <Save className="w-3.5 h-3.5" />
                  保存
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Save className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">请从左侧选择一个模板</p>
              <p className="text-xs mt-1 text-slate-400">或新建一个通知模板开始配置</p>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Panel 3: Live Preview ═══ */}
      <div className={clsx(
        "w-[340px] xl:w-[380px] shrink-0 bg-slate-50 transition-all",
        showPreview ? "block" : "hidden lg:block"
      )}>
        {selectedId ? (
          <TemplatePreview
            title={watch('title')}
            body={watch('body')}
            channels={watch('channels')}
            language={watch('language')}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            <p className="text-xs">选择模板后显示预览</p>
          </div>
        )}
      </div>
    </div>
  );
}