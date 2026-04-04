import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, AlertTriangle, User, Car, Droplets, MapPin, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MASKED_CALL_NUMBER = "09513886363";

const CallStatusBanner = ({ status, name }: { status: "idle" | "connecting" | "success" | "error"; name: string }) => {
  if (status === "idle") return null;
  const config = {
    connecting: { icon: <Loader2 className="h-5 w-5 animate-spin" />, text: `Connecting to ${name}...`, bg: "bg-muted" },
    success: { icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, text: `Call to ${name} connected!`, bg: "bg-green-50" },
    error: { icon: <XCircle className="h-5 w-5 text-destructive" />, text: `Call to ${name} failed`, bg: "bg-destructive/10" },
  }[status];
  return (
    <div className={`${config.bg} rounded-lg p-3 flex items-center gap-2`}>
      {config.icon}
      <span className="text-sm">{config.text}</span>
    </div>
  );
};

const EmergencyPage = () => {
  const { code } = useParams<{ code: string }>();
  const [callStatus, setCallStatus] = useState<{ status: "idle" | "connecting" | "success" | "error"; name: string }>({ status: "idle", name: "" });

  const callMutation = useMutation({
    mutationFn: async ({ phone, name }: { phone: string; name: string }) => {
      setCallStatus({ status: "connecting", name });
      await supabase.from("call_logs").insert({
        qr_code: code || "",
        contact_phone: phone,
        contact_name: name,
        status: "initiated",
      });
      window.location.href = `tel:${phone}`;
      return { phone, name };
    },
    onSuccess: ({ name }) => {
      setCallStatus({ status: "success", name });
    },
    onError: (_, { name }) => {
      setCallStatus({ status: "error", name });
      toast.error("Failed to initiate call");
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["emergency", code],
    queryFn: async () => {
      const { data: qr, error: qrError } = await supabase
        .from("qr_codes")
        .select("id, code, status")
        .eq("code", code!)
        .maybeSingle();
      if (qrError) throw qrError;
      if (!qr) throw new Error("QR code not found");

      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("qr_code_id", qr.id)
        .maybeSingle();

      const { data: contacts } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("qr_code_id", qr.id);

      return { qr, customer, contacts: contacts || [] };
    },
    enabled: !!code,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-8">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold">Not Found</h2>
            <p className="text-muted-foreground">This QR code does not exist or has not been activated.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { customer, contacts } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="emergency-gradient p-6 text-center text-primary-foreground">
        <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
        <h1 className="text-2xl font-bold">EMERGENCY</h1>
        <p className="text-sm opacity-90">QR Code: {code}</p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        <CallStatusBanner status={callStatus.status} name={callStatus.name} />

        {customer && (
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{customer.name}</span></div>
              <div className="flex items-center gap-2"><Car className="h-4 w-4 text-muted-foreground" /><span>{customer.vehicle_number}</span></div>
              <div className="flex items-center gap-2"><Droplets className="h-4 w-4 text-muted-foreground" /><span>Blood: {customer.blood_group}</span></div>
              {customer.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{customer.address}</span></div>}
            </CardContent>
          </Card>
        )}

        <h2 className="font-bold text-lg">Emergency Contacts</h2>
        {contacts.map((contact: any, i: number) => (
          <Card key={i}>
            <CardContent className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{contact.name}</div>
                <div className="text-sm text-muted-foreground">{contact.relationship}</div>
              </div>
              <Button
                className="emergency-gradient text-primary-foreground"
                onClick={() => callMutation.mutate({ phone: contact.phone, name: contact.name })}
                disabled={callMutation.isPending}
              >
                <Phone className="mr-2 h-4 w-4" /> Call
              </Button>
            </CardContent>
          </Card>
        ))}

        {contacts.length === 0 && !customer && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">This QR code has not been activated yet.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="py-3">
            <Button className="w-full" variant="outline" onClick={() => callMutation.mutate({ phone: MASKED_CALL_NUMBER, name: "Helpline" })}>
              <Phone className="mr-2 h-4 w-4" /> Call Helpline ({MASKED_CALL_NUMBER})
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmergencyPage;
