import { useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { 
  FileText, 
  Calendar, 
  Hash, 
  Mail,
  Smartphone,
  Bell,
  Check,
  User,
  Languages
} from 'lucide-react';
import { clsx } from 'clsx';
import { type TemplateLang, LANG_OPTIONS } from './TemplateList';

interface TemplateFormValues {
  name: string;
  language: TemplateLang;
  channels: string[];
  recipients: string[];
  title: string;
  body: string;
}

interface TemplateEditorProps {
  form: UseFormReturn<TemplateFormValues>;
  isNew?: boolean;
}

const VARIABLES = [
  { 
    category: '单证信息', 
    icon: FileText,
    items: [
      { label: '提单号 (MBL)', value: '{MBL}' },
      { label: '箱号', value: '{Container}' },
      { label: '订舱号', value: '{Booking_Ref}' },
    ]
  },
  {
    category: '船期节点',
    icon: Calendar,
    items: [
      { label: '原定 ETA', value: '{Original ETA}' },
      { label: '最新 ETA', value: '{Latest ETA}' },
      { label: '船名/航次', value: '{Vessel/Voyage}' },
      { label: '起运港', value: '{Port_Load}' },
    ]
  },
  {
    category: '计算数值',
    icon: Hash,
    items: [
      { label: '延误小时', value: '{Delay_Hours}' },
      { label: '延误天数', value: '{Delay_Days}' },
    ]
  },
  {
    category: '相关方',
    icon: User,
    items: [
      { label: '客户名称', value: '{Customer_Name}' },
      { label: '船公司', value: '{Carrier}' },
    ]
  }
];

const RECIPIENT_OPTIONS = [
  { id: 'op', label: '责任操作 (OP)', color: 'blue' },
  { id: 'sales', label: '责任销售 (Sales)', color: 'indigo' },
  { id: 'customer', label: '客户联系人', color: 'emerald' },
  { id: 'manager', label: '部门经理', color: 'slate' },
  { id: 'booking_client', label: '订舱客户 (Booking Client)', color: 'violet' },
  { id: 'notify_party', label: '通知人 (Notify Party)', color: 'amber' },
];

export default function TemplateEditor({ form, isNew }: TemplateEditorProps) {
  const { register, watch, setValue, getValues } = form;
  const channels = watch('channels') || [];
  const recipients = watch('recipients') || [];
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const toggleChannel = (channel: string) => {
    const current = getValues('channels');
    if (current.includes(channel)) {
      setValue('channels', current.filter(c => c !== channel));
    } else {
      setValue('channels', [...current, channel]);
    }
  };

  const toggleRecipient = (recipient: string) => {
    const current = getValues('recipients');
    if (current.includes(recipient)) {
      setValue('recipients', current.filter(r => r !== recipient));
    } else {
      setValue('recipients', [...current, recipient]);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentBody = getValues('body') || '';
    
    const newBody = currentBody.substring(0, start) + variable + currentBody.substring(end);
    
    setValue('body', newBody);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          {isNew && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">新建</span>
          )}
          <h2 className="font-semibold text-slate-900 text-sm">模板编辑器</h2>
        </div>
        <p className="text-xs text-slate-500">配置通知内容、发送渠道及接收对象。</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* 0. Template Name */}
        <section className="space-y-2">
          <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            模板名称 <span className="text-red-400">*</span>
          </label>
          <input
            {...register('name', { required: true })}
            placeholder="例如：标准延误通知 (邮件)"
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
          />
        </section>

        {/* 1. Language Selection */}
        <section className="space-y-2">
          <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Languages className="w-3.5 h-3.5 text-indigo-500" />
            语言
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {LANG_OPTIONS.map((lang) => (
              <div 
                key={lang.id}
                onClick={() => setValue('language', lang.id)}
                className={clsx(
                  "cursor-pointer border rounded-lg p-2.5 flex items-start gap-2.5 transition-all",
                  watch('language') === lang.id 
                    ? "bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-500/20" 
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className={clsx(
                  "mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0",
                  watch('language') === lang.id ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                )}>
                  {watch('language') === lang.id && <Check className="w-2.5 h-2.5" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{lang.flag}</span>
                  <span className="font-medium text-xs text-slate-900">{lang.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Channel Selection */}
        <section className="space-y-2">
          <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-indigo-500" />
            发送渠道
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'system', label: '站内信', icon: Bell, sub: 'In-app' },
              { id: 'email', label: '邮件 (SMTP)', icon: Mail, sub: 'SendGrid / AWS' },
              { id: 'wecom', label: '企业微信/钉钉', icon: Smartphone, sub: 'Webhook' },
            ].map((channel) => (
              <div 
                key={channel.id}
                onClick={() => toggleChannel(channel.id)}
                className={clsx(
                  "cursor-pointer border rounded-lg p-2.5 flex items-start gap-2.5 transition-all",
                  channels.includes(channel.id) 
                    ? "bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-500/20" 
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className={clsx(
                  "mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0",
                  channels.includes(channel.id) ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                )}>
                  {channels.includes(channel.id) && <Check className="w-2.5 h-2.5" />}
                </div>
                <div>
                  <div className="font-medium text-xs text-slate-900">{channel.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{channel.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Recipients */}
        <section className="space-y-2">
           <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-indigo-500" />
            默认接收人
          </label>
          <div className="flex flex-wrap gap-1.5">
            {RECIPIENT_OPTIONS.map((role) => (
              <div
                key={role.id}
                onClick={() => toggleRecipient(role.id)}
                className={clsx(
                  "cursor-pointer px-2.5 py-1 rounded-full text-xs font-medium border transition-all select-none",
                  recipients.includes(role.id)
                    ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                )}
              >
                {recipients.includes(role.id) && <span className="mr-0.5">✓ </span>}
                {role.label}
              </div>
            ))}
            <button className="px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 flex items-center gap-1 transition-colors">
              + 外部邮箱
            </button>
          </div>
          <p className="text-[10px] text-slate-400 pl-0.5">预警规则可单独覆盖此处的接收人配置</p>
        </section>

        {/* 4. Content Editor */}
        <section className="space-y-3">
          <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            消息内容
          </label>
          
          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-medium text-slate-500 mb-1 block">标题</span>
              <input
                {...register('title')}
                placeholder="请输入标题 (例如: 货物延误提醒: {MBL})"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              />
            </div>
            
            <div>
              <span className="text-[10px] font-medium text-slate-500 mb-1 block">正文</span>
              <textarea
                {...register('body')}
                ref={(e) => {
                  register('body').ref(e);
                  bodyTextareaRef.current = e;
                }}
                rows={10}
                placeholder="在此输入正文内容... 点击下方胶囊插入动态变量"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-y font-mono leading-relaxed"
              />
            </div>
            
            {/* Variable Pills */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">插入变量</span>
                <span className="text-[10px] text-slate-400">点击插入光标位置</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-3">
                {VARIABLES.map((group) => (
                  <div key={group.category} className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-slate-600">
                      <group.icon className="w-3 h-3" />
                      {group.category}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((v) => (
                        <button
                          key={v.value}
                          type="button"
                          onClick={() => insertVariable(v.value)}
                          className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors shadow-sm select-none"
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}