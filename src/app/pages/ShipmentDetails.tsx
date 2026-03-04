import { useState } from 'react';
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Anchor, 
  Box, 
  FileText,
  Activity,
  Container
} from 'lucide-react';
import { Button, Badge } from '../components/ui/basic';
import ShipmentMonitorDrawer from '../components/shipment/ShipmentMonitorDrawer';

export default function ShipmentDetails() {
  const [isMonitorDrawerOpen, setIsMonitorDrawerOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb / Back Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <ArrowLeft className="w-4 h-4 cursor-pointer hover:text-slate-800" />
        <span>海运订单</span>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-900">Job #J-2023-8942</span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          
          {/* Main Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">MBL: COSU62738492</h1>
              <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                运输中 (In Transit)
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Anchor className="w-4 h-4 text-indigo-500" />
                <span className="font-medium">COSCO SHIPPING / 045E</span>
              </div>
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-indigo-500" />
                <span>1 x 40'HC</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Ref: ACME-PO-992</span>
              </div>
            </div>
          </div>

          {/* Actions - The Trigger is here */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => setIsMonitorDrawerOpen(true)}
              className="group border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 shadow-sm"
            >
              <Activity className="w-4 h-4 mr-2 text-indigo-600 group-hover:animate-pulse" />
              异常监控
            </Button>
            <Button variant="secondary" className="bg-slate-100 border-slate-200">
              <MoreHorizontal className="w-4 h-4 text-slate-600" />
            </Button>
          </div>
        </div>

        {/* Route Visualization (Placeholder for context) */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between relative px-10">
          {/* Line */}
          <div className="absolute left-10 right-10 top-1/2 h-0.5 bg-slate-200 -z-10"></div>
          <div className="absolute left-10 right-1/2 top-1/2 h-0.5 bg-emerald-500 -z-10"></div>

          {/* Points */}
          <div className="flex flex-col items-center gap-2 bg-white px-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></div>
            <div className="text-center">
              <div className="text-xs font-bold text-slate-900">CNSHA</div>
              <div className="text-[10px] text-slate-500">Shanghai</div>
              <div className="text-[10px] text-slate-400 mt-1">Oct 12</div>
            </div>
          </div>

           <div className="flex flex-col items-center gap-2 bg-white px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 z-10">
              <Container className="w-4 h-4" />
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-indigo-700">In Transit</div>
              <div className="text-[10px] text-slate-500">Indian Ocean</div>
            </div>
          </div>

           <div className="flex flex-col items-center gap-2 bg-white px-2">
            <div className="w-3 h-3 rounded-full bg-slate-300 ring-4 ring-slate-100"></div>
            <div className="text-center">
              <div className="text-xs font-bold text-slate-500">NLRTM</div>
              <div className="text-[10px] text-slate-400">Rotterdam</div>
              <div className="text-[10px] text-slate-400 mt-1">Nov 04 (Est)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid (Placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {/* Details Section */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
             <h3 className="text-lg font-semibold text-slate-900 mb-4">订单详情</h3>
             <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                   <div className="text-slate-500">发货人 (Shipper)</div>
                   <div className="font-medium">Shanghai Trading Co., Ltd.</div>
                </div>
                <div className="space-y-1">
                   <div className="text-slate-500">收货人 (Consignee)</div>
                   <div className="font-medium">Euro Retail Group GmbH</div>
                </div>
                 <div className="space-y-1">
                   <div className="text-slate-500">船公司 (Carrier)</div>
                   <div className="font-medium">COSCO SHIPPING LINES</div>
                </div>
                 <div className="space-y-1">
                   <div className="text-slate-500">订舱号 (Booking No)</div>
                   <div className="font-medium">SHA0981234</div>
                </div>
             </div>
           </div>
        </div>

        <div className="space-y-6">
           {/* Documents Section */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h3 className="text-lg font-semibold text-slate-900 mb-4">相关单证</h3>
             <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-slate-700">Bill of Lading</span>
                   </div>
                   <span className="text-xs text-emerald-600 font-medium">Verified</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-slate-700">Packing List</span>
                   </div>
                   <span className="text-xs text-slate-500">Pending</span>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* The Drawer Component */}
      <ShipmentMonitorDrawer 
        isOpen={isMonitorDrawerOpen} 
        onClose={setIsMonitorDrawerOpen} 
        shipmentId="COSU62738492"
      />
    </div>
  );
}