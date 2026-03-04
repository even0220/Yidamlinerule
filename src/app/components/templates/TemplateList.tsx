import { useState } from 'react';
import {
  Plus, Search, Mail, Bell, MessageSquare,
  Copy, Trash2, MoreVertical, FileText,
  Users, ChevronRight, Languages
} from 'lucide-react';
import { clsx } from 'clsx';

export type TemplateLang = 'zh-CN' | 'en' | 'zh-TW' | 'ja';

export const LANG_OPTIONS: { id: TemplateLang; label: string; flag: string; short: string }[] = [
  { id: 'zh-CN', label: '简体中文', flag: '🇨🇳', short: '中' },
  { id: 'en',    label: 'English',  flag: '🇺🇸', short: 'EN' },
  { id: 'zh-TW', label: '繁體中文', flag: '🇭🇰', short: '繁' },
  { id: 'ja',    label: '日本語',   flag: '🇯🇵', short: 'JA' },
];

export interface TemplateItem {
  id: string;
  name: string;
  language: TemplateLang;
  channels: string[];
  recipients: string[];
  title: string;
  body: string;
  updatedAt: string;
  usedByRules: number;
  status: 'active' | 'draft';
}

const CHANNEL_ICONS: Record<string, { icon: typeof Mail; label: string; color: string }> = {
  email: { icon: Mail, label: '邮件', color: 'text-blue-500' },
  system: { icon: Bell, label: '站内信', color: 'text-amber-500' },
  wecom: { icon: MessageSquare, label: '企微/钉钉', color: 'text-emerald-500' },
};

interface TemplateListProps {
  templates: TemplateItem[];
  selectedId: string | null;
  onSelect: (template: TemplateItem) => void;
  onCreateNew: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TemplateList({
  templates,
  selectedId,
  onSelect,
  onCreateNew,
  onDuplicate,
  onDelete,
}: TemplateListProps) {
  const [search, setSearch] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const filtered = templates.filter(t =>
    search === '' ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-slate-100 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-sm">通知模板</h3>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
            {templates.length} 个
          </span>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索模板..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Template Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.map(template => {
          const isSelected = template.id === selectedId;
          return (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
              className={clsx(
                "relative rounded-lg p-3 cursor-pointer transition-all group border",
                isSelected
                  ? "bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-500/20"
                  : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
              )}
            >
              {/* Row 1: Name + status */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className={clsx(
                  "text-xs font-semibold leading-snug line-clamp-2 flex-1",
                  isSelected ? "text-indigo-900" : "text-slate-800"
                )}>
                  {template.name}
                </h4>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={clsx(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    template.status === 'active' ? "bg-emerald-500" : "bg-slate-300"
                  )} />
                  {/* Context menu trigger */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === template.id ? null : template.id);
                    }}
                    className="p-0.5 rounded text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: Channel icons + rule count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const lang = LANG_OPTIONS.find(l => l.id === template.language);
                    return lang ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        <span>{lang.flag}</span>
                        <span>{lang.short}</span>
                      </span>
                    ) : null;
                  })()}
                  {template.channels.map(ch => {
                    const info = CHANNEL_ICONS[ch];
                    return info ? (
                      <info.icon key={ch} className={clsx("w-3 h-3", info.color)} />
                    ) : null;
                  })}
                </div>
                <div className="flex items-center gap-2">
                  {template.usedByRules > 0 && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5" />
                      {template.usedByRules} 条规则引用
                    </span>
                  )}
                </div>
              </div>

              {/* Row 3: Updated time */}
              <p className="text-[10px] text-slate-400 mt-1.5">{template.updatedAt}</p>

              {/* Active indicator */}
              {isSelected && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                </div>
              )}

              {/* Context menu dropdown */}
              {menuOpenId === template.id && (
                <div
                  className="absolute right-2 top-8 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-32"
                  onMouseLeave={() => setMenuOpenId(null)}
                >
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDuplicate(template.id);
                      setMenuOpenId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Copy className="w-3 h-3" /> 复制模板
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDelete(template.id);
                      setMenuOpenId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> 删除模板
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            {search ? '无匹配结果' : '暂无模板'}
          </div>
        )}
      </div>

      {/* Create Button */}
      <div className="p-3 border-t border-slate-100 shrink-0">
        <button
          onClick={onCreateNew}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 font-medium hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
        >
          <Plus className="w-4 h-4" />
          新建模板
        </button>
      </div>
    </div>
  );
}