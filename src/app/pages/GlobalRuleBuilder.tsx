import { useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import RuleDrawer from '../components/rules/RuleDrawer';

// Mock Data
const MOCK_RULES = [
  {
    id: 'R-001',
    name: '美线 ETA 严重延误预警',
    domains: ['sea_export'],
    condition_summary: '最新ETA 对比基准延误大于 72小时',
    status: true,
  },
  {
    id: 'R-002',
    name: '船名变更自动通知',
    domains: ['sea_export', 'sea_import'],
    condition_summary: '最新船名 不等于基准数据',
    status: true,
  },
  {
    id: 'R-003',
    name: '直达变中转预警',
    domains: ['sea_export', 'air_export'],
    condition_summary: '实际中转行为 不等于 原定中转计划(直达)',
    status: true,
  },
  {
    id: 'R-004',
    name: '进港后甩柜超时预警',
    domains: ['sea_export', 'sea_import', 'air_export', 'air_import'],
    condition_summary: 'GIPOL重箱进港 → 超过5天 → LOAD装船未发生',
    status: false,
  },
  {
    id: 'R-005',
    name: '客户节点跟进通知 (开航&到港)',
    domains: ['sea_export', 'sea_import'],
    condition_summary: '里程碑达成：DPOL起运港开航, APOD目的港抵达',
    status: true,
  },
];

const DOMAIN_LABEL: Record<string, { text: string; cls: string }> = {
  sea_export: { text: '海运出口', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  sea_import: { text: '海运进口', cls: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  air_export: { text: '空运出口', cls: 'bg-violet-50 text-violet-700 border-violet-100' },
  air_import: { text: '空运进口', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
};

export default function GlobalRuleBuilder() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [rules, setRules] = useState(MOCK_RULES);

  const handleCreateNew = () => {
    setEditingRule(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setIsDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条规则吗？')) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, status: !r.status } : r));
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-900">预警规则配置</h2>
          <p className="text-slate-500 text-sm mt-1">管理全局异常规则及自动触发条件。</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新建规则
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="搜索规则名称或编号..." 
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-600 bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
            <option>所有业务域</option>
            <option>海运出口</option>
            <option>海运进口</option>
            <option>空运出口</option>
            <option>空运进口</option>
          </select>
          <button className="p-2 border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3 w-32">规则编号</th>
                <th className="px-6 py-3 w-64">规则名称</th>
                <th className="px-6 py-3 w-48">适用业务域</th>
                <th className="px-6 py-3">触发条件概要</th>
                <th className="px-6 py-3 w-32 text-center">状态</th>
                <th className="px-6 py-3 w-24 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50 group transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-500 text-xs">{rule.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{rule.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {rule.domains.map(d => {
                        const info = DOMAIN_LABEL[d] || { text: d, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
                        return (
                          <span key={d} className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border", info.cls)}>
                            {info.text}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 truncate max-w-xs" title={rule.condition_summary}>
                    {rule.condition_summary}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => toggleStatus(rule.id)}
                      className={clsx(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                        rule.status ? 'bg-emerald-500' : 'bg-slate-200'
                      )}
                    >
                      <span
                        className={clsx(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm",
                          rule.status ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(rule)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>显示 {rules.length} 条结果</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-300 rounded hover:bg-white disabled:opacity-50">上一页</button>
            <button className="px-3 py-1 border border-slate-300 rounded hover:bg-white disabled:opacity-50">下一页</button>
          </div>
        </div>
      </div>

      <RuleDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        initialData={editingRule}
      />
    </div>
  );
}