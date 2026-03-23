import React, { useState, useEffect, useRef } from "react";
import { useZxing } from "react-zxing";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContext";

const ScanTable = () => {
  const navigate = useNavigate();

  const { startNewSession } = useSession();

  const [loading, setLoading] = useState(true);
  const scanLock = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

const handleScan = async (result: any) => {
  if (result && !scanLock.current) {
    const scannedUrl = result.getText();
    if (scannedUrl) {
      scanLock.current = true;
      try {
        const urlObj = new URL(scannedUrl);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        const restaurantId = pathSegments[pathSegments.length - 1];
        const tableNumber = urlObj.searchParams.get("table");

        if (!restaurantId || !tableNumber) throw new Error("Invalid QR Code");

        toast.info("Connecting to table...");
        const res = await startNewSession(restaurantId, tableNumber);
        
        if (res) {
          toast.success("Connected! Opening menu...");
          setTimeout(() => navigate("/menu"), 500);
        }
      } catch (err: any) {
        toast.error(err.message || "Scan failed");
        scanLock.current = false; // Allow re-scanning on error
      }
    }
  }
};

  const { ref } = useZxing({
    onDecodeResult(result) {
      handleScan(result);
    },
    constraints: {
      video: {
        facingMode: "environment"
      }
    }
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* --- HEADER --- */}
      <div className="p-4 flex items-center justify-between border-b bg-white z-20 shadow-sm sticky top-0">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:bg-gray-100 rounded-full h-10 w-10 p-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-gray-900 font-bold text-lg flex items-center gap-2">
          <QrCode className="w-5 h-5 text-orange-500" />
          Scan QR Code
        </h1>
        <div className="w-10"></div>
      </div>

      {/* --- CAMERA SECTION --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">

        {/* Camera Container */}
        <div className="relative w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-gray-200">

          {/* Loading Spinner */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-zinc-900 text-white">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-2" />
              <p className="text-xs text-zinc-400">Starting Camera...</p>
            </div>
          )}

          {/* The Actual Camera */}
          <video
            ref={ref}
            className="w-full h-full object-cover"
          />

          {/* Scanner Overlay (Visual Only) */}
          <div className="absolute inset-0 border-[40px] border-black/30 pointer-events-none flex items-center justify-center">
            <div className="w-full h-full border-2 border-white/50 relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-orange-500 -mt-1 -ml-1"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-orange-500 -mt-1 -mr-1"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-orange-500 -mb-1 -ml-1"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-orange-500 -mb-1 -mr-1"></div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center space-y-2">
          <p className="font-semibold text-gray-900">Align QR code within the frame</p>
          <p className="text-sm text-gray-500">
            You will be redirected automatically
          </p>
        </div>

      </div>
    </div>
  );
};

export default ScanTable;