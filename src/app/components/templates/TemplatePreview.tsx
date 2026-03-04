import { Badge } from '../ui/basic';
import { clsx } from 'clsx';
import { Smartphone, Mail, Globe, Clock, User, MessageSquare, Languages } from 'lucide-react';
import { type TemplateLang, LANG_OPTIONS } from './TemplateList';

interface TemplatePreviewProps {
  title: string;
  body: string;
  channels: string[];
  language?: TemplateLang;
}

const MOCK_DATA: Record<string, string> = {
  '{MBL}': 'COSU62738492',
  '{Container}': 'TCNU1234567',
  '{Original ETA}': '2023-10-25',
  '{Latest ETA}': '2023-10-28',
  '{Vessel/Voyage}': 'COSCO SHIPPING / 045E',
  '{Delay_Hours}': '72',
  '{Port_Load}': 'Shanghai',
  '{Port_Discharge}': 'Rotterdam',
  '{Customer_Name}': 'Acme Global Logistics'
};

export default function TemplatePreview({ title, body, channels, language }: TemplatePreviewProps) {
  // Replace variables with mock data
  const processText = (text: string) => {
    let processed = text || '';
    Object.entries(MOCK_DATA).forEach(([key, value]) => {
      // Escape braces for regex
      const regex = new RegExp(key.replace(/\{/g, '\\{').replace(/\}/g, '\\}'), 'g');
      processed = processed.replace(regex, value);
    });
    return processed;
  };

  const previewTitle = processText(title);
  const previewBody = processText(body);

  const hasEmail = channels.includes('email');
  const hasChat = channels.includes('wecom') || channels.includes('dingtalk') || channels.includes('system');

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="p-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            实时预览
          </h3>
          {language && (() => {
            const lang = LANG_OPTIONS.find(l => l.id === language);
            return lang ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                <span>{lang.flag}</span>
                {lang.label}
              </span>
            ) : null;
          })()}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          基于模拟订单数据的展示效果。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Email Preview */}
        {hasEmail && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">邮件客户端视图</span>
              <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200">SMTP</Badge>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col gap-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500 w-12">发件人:</span>
                  <span className="text-slate-900 font-medium">YIDAM Alerts &lt;alerts@yidam.com&gt;</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                   <span className="text-slate-500 w-12">主题:</span>
                   <span className="text-slate-900 font-medium break-words">{previewTitle || '(无主题)'}</span>
                </div>
              </div>
              <div className="p-6 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed min-h-[160px]">
                {previewBody || <span className="text-slate-400 italic">请在左侧输入内容以查看预览...</span>}
              </div>
            </div>
          </div>
        )}

        {/* Chat/Mobile Preview */}
        {hasChat && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
               <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">手机 / IM 视图</span>
               <div className="flex gap-1">
                 {channels.includes('wecom') && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">企业微信</Badge>}
                 {channels.includes('dingtalk') && <Badge className="bg-blue-50 text-blue-700 border-blue-200">钉钉</Badge>}
                 {channels.includes('system') && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">站内信</Badge>}
               </div>
            </div>
            
            <div className="mx-auto max-w-[320px] bg-[#f5f5f5] rounded-[2rem] border-[8px] border-slate-800 shadow-xl overflow-hidden relative">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-10"></div>
              
              {/* Screen Header */}
              <div className="bg-[#ededed] h-14 flex items-center justify-between px-4 pt-4 border-b border-slate-300/50">
                 <div className="flex items-center gap-1 text-slate-900 text-xs font-medium">
                    <Clock className="w-3 h-3" /> 09:41
                 </div>
                 <div className="text-xs font-semibold text-slate-900">YIDAM 助手</div>
                 <div className="w-4"></div>
              </div>

              {/* Chat Area */}
              <div className="bg-[#ededed] p-3 min-h-[300px] flex flex-col gap-3">
                 <div className="self-center bg-[#dcdcdc] text-slate-500 text-[10px] px-2 py-0.5 rounded">今天 09:41</div>
                 
                 <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center text-white shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[85%]">
                       {previewTitle && (
                         <div className="font-bold text-slate-900 text-sm mb-1">{previewTitle}</div>
                       )}
                       <div className="text-sm text-slate-800 whitespace-pre-wrap leading-snug">
                          {previewBody || '...'}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {!hasEmail && !hasChat && (
           <div className="flex flex-col items-center justify-center h-64 text-slate-400">
             <Smartphone className="w-12 h-12 mb-3 opacity-20" />
             <p className="text-sm">请选择至少一个渠道以查看预览</p>
           </div>
        )}
      </div>
    </div>
  );
}