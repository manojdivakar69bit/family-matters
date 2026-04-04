import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintableStickerProps {
  code: string;
  vehicleNumber?: string;
  bloodGroup?: string;
  baseUrl: string;
  stickerWidth?: number;
  stickerHeight?: number;
}

const PrintableSticker = ({ code, baseUrl, stickerWidth = 6, stickerHeight = 8 }: PrintableStickerProps) => {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const url = `${baseUrl}/emergency/${code}`;
    const wCm = stickerWidth;
    const hCm = stickerHeight;

    printWindow.document.write(`
      <html><head><title>QR Sticker - ${code}</title>
      <style>
        @page { size: ${wCm}cm ${hCm}cm; margin: 0; }
        body { margin: 0; display: flex; align-items: center; justify-content: center; width: ${wCm}cm; height: ${hCm}cm; font-family: sans-serif; }
        .sticker { text-align: center; }
        svg { width: ${Math.min(wCm, hCm) * 0.6}cm; height: ${Math.min(wCm, hCm) * 0.6}cm; }
        .code { font-size: 10pt; margin-top: 4px; font-weight: bold; }
      </style></head><body>
      <div class="sticker">
        <div id="qr"></div>
        <div class="code">${code}</div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
      <script>
        QRCode.toCanvas(document.createElement('canvas'), '${url}', { width: 200 }, function(err, canvas) {
          if (!err) document.getElementById('qr').appendChild(canvas);
          window.print();
        });
      <\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const url = `${baseUrl}/emergency/${code}`;

  return (
    <div className="border rounded-lg p-4 text-center space-y-2">
      <QRCodeSVG value={url} size={120} />
      <p className="font-mono text-sm font-bold">{code}</p>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" /> Print
      </Button>
    </div>
  );
};

export default PrintableSticker;
