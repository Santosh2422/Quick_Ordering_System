import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateTableQrApi, deleteTableApi, fetchTablesApi } from "@/services/qr.service";
import { useAuth } from "@/context/AuthContext";
import { Trash2, Plus, QrCode, Download, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

const TableManagement = () => {
  const { user } = useAuth();
  const [tableNumber, setTableNumber] = useState("");
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State to manage which table's QR is currently being viewed in the popup
  const [viewingTable, setViewingTable] = useState<any | null>(null);

  const fetchTables = async () => {
    if (!user?.restaurantId) return;
    try {
      setLoading(true);
      const response = await fetchTablesApi(user.restaurantId);
      if (response.data.success) {
        setTables(response.data.data || []);
      }
    } catch (error) {
      toast.error("Could not load tables.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [user?.restaurantId]);

  const generateQr = async () => {
    if (!tableNumber) {
      toast.error("Please enter table name/number");
      return;
    }
    try {
      setLoading(true);
      const res = await generateTableQrApi({ tableName: tableNumber });
      if (res.data.success) {
        toast.success(res.data.message);
        setTableNumber("");
        fetchTables(); 
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tableId: string) => {
    if (!confirm("Are you sure you want to remove this table?")) return;
    try {
      const res = await deleteTableApi(tableId);
      if (res.data.success) {
        toast.success("Table removed successfully!");
        fetchTables(); 
      }
    } catch (error) {
      toast.error("Failed to remove table.");
    }
  };

  const getMenuUrl = (table: any) => {
    if (typeof window === "undefined") return "";
    const FRONTEND_DOMAIN = window.location.origin;
    const secret = table.tableShortId || table._id; 
    return `${FRONTEND_DOMAIN}/menu/${user?.restaurantId}?table=${secret}`;
  };

  const handleDownloadQr = (table: any) => {
    const canvasId = `qr-canvas-${table._id}`;
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (canvas) {
        const pngUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `QR_${table.tableName.replace(/\s+/g, "_")}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("QR Code downloaded");
    } else {
        toast.error("Could not generate image");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8 relative pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-orange-950">
          <QrCode className="w-6 h-6 text-orange-500" /> Table Management
        </h2>
      </div>

      {/* ADD NEW TABLE FORM */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm space-y-4">
        <h3 className="text-sm md:text-lg font-semibold text-orange-900/70">Add New Table</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="e.g. Table 1, VIP Cabin"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="flex-1 h-11 rounded-xl border-orange-100"
          />
          <Button 
            onClick={generateQr} 
            disabled={loading} 
            className="h-11 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold gap-2"
          >
            {loading ? "Adding..." : <><Plus className="w-4 h-4" /> Add Table</>}
          </Button>
        </div>
      </div>

      {/* TABLES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {tables.map((table) => {
            const qrValue = getMenuUrl(table);
            return (
            <div key={table._id} className="bg-white rounded-[2rem] border border-orange-50 shadow-xl shadow-orange-900/5 flex flex-col items-center p-5 md:p-6 relative group transition-all hover:shadow-2xl">
                {/* Delete Button - Always visible on mobile for better UX */}
                <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-4 right-4 h-9 w-9 rounded-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-lg z-10"
                    onClick={() => handleDelete(table._id)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>

                {/* QR PREVIEW */}
                <div 
                    className="w-full aspect-square bg-orange-50/30 rounded-[1.5rem] border border-orange-50 flex items-center justify-center overflow-hidden mb-4 p-4 cursor-pointer active:scale-95 transition-transform duration-200"
                    onClick={() => setViewingTable(table)}
                >
                    <div className="p-2 bg-white rounded-xl shadow-md">
                        <QRCodeCanvas
                            id={`qr-canvas-${table._id}`}
                            value={qrValue}
                            size={200}
                            level={"H"}
                            includeMargin={true}
                            style={{ width: '100%', height: '100%', maxWidth: '140px', maxHeight: '140px' }}
                        />
                    </div>
                </div>

                <div className="text-center space-y-1 mb-6">
                    <h4 className="font-bold text-lg md:text-xl text-orange-950 capitalize">{table.tableName}</h4>
                    <p className="text-[10px] font-bold text-orange-300 uppercase tracking-[0.2em]">
                        {table.tableShortId || "ID"}
                    </p>
                </div>

                {/* ACTIONS */}
                <div className="w-full grid grid-cols-2 gap-2 mt-auto">
                    <Button
                        variant="outline"
                        className="h-11 rounded-xl border-orange-100 text-orange-700 hover:bg-orange-50 font-bold text-xs md:text-sm gap-2"
                        onClick={() => setViewingTable(table)}
                    >
                        <Eye className="w-4 h-4" /> View
                    </Button>
                    <Button
                        className="h-11 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold shadow-md transition-all text-xs md:text-sm gap-2 text-white"
                        onClick={() => handleDownloadQr(table)}
                    >
                        <Download className="w-4 h-4" /> Save
                    </Button>
                </div>
            </div>
            );
        })}

        {tables.length === 0 && !loading && (
          <div className="col-span-full py-16 md:py-24 text-center border-2 border-dashed border-orange-100 rounded-[2rem] bg-gray-50/50 space-y-4">
            <QrCode className="w-12 h-12 text-orange-200 mx-auto" />
            <div className="px-4">
              <p className="text-lg font-bold text-orange-950/40">No Tables Registered</p>
              <p className="text-sm text-orange-800/30">Add a table name above to generate its unique QR</p>
            </div>
          </div>
        )}
      </div>

      {/* --- QR POPUP MODAL --- */}
      {viewingTable && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-all">
            <div className="bg-white rounded-t-[2.5rem] sm:rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
                {/* Handle for mobile bottom sheet feel */}
                <div className="w-12 h-1 bg-gray-200 rounded-full mb-6 sm:hidden" />

                <button 
                    onClick={() => setViewingTable(null)}
                    className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600"
                >
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{viewingTable.tableName}</h3>
                <p className="text-[10px] text-orange-500 font-bold tracking-widest uppercase mb-6">Scan for Menu</p>
                
                <div className="p-4 border-4 border-orange-500 rounded-2xl bg-white shadow-xl mb-8">
                    <QRCodeCanvas
                        value={getMenuUrl(viewingTable)}
                        size={250}
                        level={"H"}
                        includeMargin={true}
                        style={{ width: '100%', height: '100%', maxWidth: '200px', maxHeight: '200px' }}
                    />
                </div>

                <div className="w-full flex flex-col sm:flex-row gap-3">
                    <Button 
                        className="flex-1 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold order-1 sm:order-2"
                        onClick={() => handleDownloadQr(viewingTable)}
                    >
                        <Download className="w-4 h-4 mr-2" /> Download Image
                    </Button>
                    <Button 
                        variant="ghost"
                        className="flex-1 h-12 rounded-xl text-gray-500 order-2 sm:order-1"
                        onClick={() => setViewingTable(null)}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;