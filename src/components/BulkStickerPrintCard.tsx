import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Printer, QrCode } from "lucide-react";

const PRINT_OPTIONS = ["10", "20", "50", "100", "500", "1000"] as const;

const SIZE_PRESETS = [
  { label: "3×4 cm", w: 3, h: 4 },
  { label: "4×6 cm", w: 4, h: 6 },
  { label: "6×8 cm", w: 6, h: 8 },
  { label: "8×10 cm", w: 8, h: 10 },
  { label: "Custom", w: 0, h: 0 },
];

interface BulkStickerPrintCardProps {
  baseUrl: string;
  printableCount: number;
}

const openStickerPrintWindow = (codes: string[], baseUrl: string, wCm: number, hCm: number) => {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    throw new Error("Please allow popups to print stickers");
  }

  const qrSize = Math.min(wCm, hCm) * 0.6;

  const stickersMarkup = codes
    .map((code) => {
      const qrMarkup = renderToStaticMarkup(
        <QRCodeSVG value={`${baseUrl}/emergency/${code}`} size={150} />,
      );
      return `
        <div class="sticker">
          <div class="qr">${qrMarkup}</div>
          <div class="code">${code}</div>
        </div>
      `;
    })
    .join("");

  printWindow.document.write(`
    <html><head><title>Print QR Stickers</title>
    <style>
      @page { size: ${wCm}cm ${hCm}cm; margin: 0; }
      body { margin: 0; font-family: sans-serif; }
      .info { padding: 16px; text-align: center; }
      .info button { margin-top: 8px; padding: 8px 24px; font-size: 14px; cursor: pointer; }
      .sticker { page-break-after: always; display: flex; flex-direction: column; align-items: center; justify-content: center; width: ${wCm}cm; height: ${hCm}cm; }
      .sticker svg { width: ${qrSize}cm; height: ${qrSize}cm; }
      .code { font-size: 10pt; font-weight: bold; margin-top: 4px; }
      @media print { .info { display: none; } }
    </style></head><body>
    <div class="info">
      <p>${codes.length} sticker${codes.length === 1 ? "" : "s"} ready (${wCm}×${hCm} cm)</p>
      <button onclick="window.print()">Print Stickers</button>
    </div>
    ${stickersMarkup}
    </body></html>
  `);
  printWindow.document.close();
};

const BulkStickerPrintCard = ({ baseUrl, printableCount }: BulkStickerPrintCardProps) => {
  const [selectedCount, setSelectedCount] = useState<string>("10");
  const [sizePreset, setSizePreset] = useState("6×8 cm");
  const [customW, setCustomW] = useState("6");
  const [customH, setCustomH] = useState("8");

  const isCustom = sizePreset === "Custom";
  const currentSize = isCustom
    ? { w: parseFloat(customW) || 6, h: parseFloat(customH) || 8 }
    : SIZE_PRESETS.find((s) => s.label === sizePreset) || { w: 6, h: 8 };

  const printMutation = useMutation({
    mutationFn: async (count: string) => {
      const limit = Number(count);
      const { data, error } = await supabase
        .from("qr_codes")
        .select("code")
        .in("status", ["available", "assigned"])
        .order("code", { ascending: true })
        .limit(limit);

      if (error) throw error;
      if (!data?.length) throw new Error("No unlinked QR codes available for printing");
      return { requested: limit, codes: data.map((item: any) => item.code) };
    },
    onSuccess: async ({ requested, codes }) => {
      openStickerPrintWindow(codes, baseUrl, currentSize.w, currentSize.h);

      const email = localStorage.getItem("cmf_email") || "unknown";
      await supabase.from("print_history").insert({
        printed_by: email,
        count: codes.length,
        code_from: codes[0],
        code_to: codes[codes.length - 1],
      });

      if (codes.length < requested) {
        toast.success(`Only ${codes.length} unlinked stickers were available.`);
        return;
      }
      toast.success(`${codes.length} stickers are ready to print.`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> Print All Stickers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Print from existing unlinked QR codes in a sticker sheet layout.
        </p>

        <div className="space-y-1">
          <Label className="text-xs">Number of stickers</Label>
          <Select value={selectedCount} onValueChange={setSelectedCount}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRINT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>{option} stickers</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Sticker size</Label>
          <Select value={sizePreset} onValueChange={setSizePreset}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SIZE_PRESETS.map((s) => (
                <SelectItem key={s.label} value={s.label}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isCustom && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Width (cm)</Label>
              <Input type="number" value={customW} onChange={(e) => setCustomW(e.target.value)} min="1" step="0.5" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Height (cm)</Label>
              <Input type="number" value={customH} onChange={(e) => setCustomH(e.target.value)} min="1" step="0.5" />
            </div>
          </div>
        )}

        <Button className="w-full" onClick={() => printMutation.mutate(selectedCount)} disabled={printMutation.isPending || printableCount === 0}>
          <Printer className="mr-2 h-4 w-4" />
          {printMutation.isPending ? "Preparing..." : "Print Stickers"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">Unlinked QR codes ready: {printableCount}</p>
      </CardContent>
    </Card>
  );
};

export default BulkStickerPrintCard;
