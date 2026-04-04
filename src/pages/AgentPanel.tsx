import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ScanLine, ArrowLeft, CheckCircle2, LogOut, Printer } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import QrScanner from "@/components/QrScanner";
import EmergencyContactsForm, { type EmergencyContact } from "@/components/EmergencyContactsForm";
import PrintableSticker from "@/components/PrintableSticker";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const AgentPanel = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [selectedQr, setSelectedQr] = useState<{ id: string; code: string } | null>(null);
  const [form, setForm] = useState({ name: "", vehicle_number: "", blood_group: "", address: "" });
  const [contacts, setContacts] = useState<EmergencyContact[]>([{ name: "", phone: "", relationship: "" }]);
  const [success, setSuccess] = useState(false);

  const lookupQr = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .from("qr_codes")
        .select("id, code, status")
        .eq("code", code.trim().toUpperCase())
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("QR code not found");
      if (data.status === "activated") throw new Error("QR code already activated");
      return data;
    },
    onSuccess: (data) => {
      setSelectedQr(data);
      toast.success(`QR code ${data.code} found`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQr) throw new Error("No QR selected");
      const validContacts = contacts.filter((c) => c.name && c.phone);
      if (!validContacts.length) throw new Error("At least one emergency contact is required");

      const { error: custError } = await supabase.from("customers").insert({
        qr_code_id: selectedQr.id,
        name: form.name,
        vehicle_number: form.vehicle_number,
        blood_group: form.blood_group,
        address: form.address || null,
      });
      if (custError) throw custError;

      const contactRows = validContacts.map((c) => ({
        qr_code_id: selectedQr.id,
        name: c.name,
        phone: c.phone,
        relationship: c.relationship || null,
      }));
      const { error: contactError } = await supabase.from("emergency_contacts").insert(contactRows);
      if (contactError) throw contactError;

      const { error: statusError } = await supabase.from("qr_codes").update({ status: "activated" }).eq("id", selectedQr.id);
      if (statusError) throw statusError;
    },
    onSuccess: () => {
      setSuccess(true);
      toast.success("Customer registered!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("cmf_role");
    localStorage.removeItem("cmf_email");
    navigate("/login");
  };

  const baseUrl = window.location.origin;

  if (success && selectedQr) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">Registration Complete!</h2>
            <PrintableSticker code={selectedQr.code} baseUrl={baseUrl} />
            <Button onClick={() => { setSuccess(false); setSelectedQr(null); setForm({ name: "", vehicle_number: "", blood_group: "", address: "" }); setContacts([{ name: "", phone: "", relationship: "" }]); setQrCodeInput(""); }}>
              Register Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full p-4" style={{ backgroundColor: "#1B2A4A" }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link to="/" className="text-primary-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-primary-foreground font-bold text-lg flex items-center gap-2"><ScanLine className="h-5 w-5" /> Agent Panel</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground hover:text-primary-foreground/80">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {!selectedQr ? (
          <Card>
            <CardHeader><CardTitle>Scan or Enter QR Code</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <QrScanner onScan={(code) => lookupQr.mutate(code)} />
              <div className="flex gap-2">
                <Input placeholder="e.g. EMR-0001" value={qrCodeInput} onChange={(e) => setQrCodeInput(e.target.value)} />
                <Button onClick={() => lookupQr.mutate(qrCodeInput)} disabled={!qrCodeInput} className="emergency-gradient hover:opacity-90">Lookup</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Register Customer — {selectedQr.code}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Number *</Label>
                <Input value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Blood Group *</Label>
                <Select value={form.blood_group} onValueChange={(v) => setForm({ ...form, blood_group: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((bg) => (<SelectItem key={bg} value={bg}>{bg}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <EmergencyContactsForm contacts={contacts} onChange={setContacts} />
              <Button className="w-full" onClick={() => registerMutation.mutate()} disabled={!form.name || !form.vehicle_number || !form.blood_group || registerMutation.isPending}>
                {registerMutation.isPending ? "Registering..." : "Register & Activate"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AgentPanel;
