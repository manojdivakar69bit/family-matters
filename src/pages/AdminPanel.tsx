import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { QrCode, Users, Package, Plus, Trash2, ArrowLeft, LogOut, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PrintableSticker from "@/components/PrintableSticker";
import BulkStickerPrintCard from "@/components/BulkStickerPrintCard";
import PrintHistoryCard from "@/components/PrintHistoryCard";

const AdminPanel = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [qrCount, setQrCount] = useState(10);
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [assignFrom, setAssignFrom] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [assignAgentId, setAssignAgentId] = useState("");

  const { data: qrCodes = [] } = useQuery({
    queryKey: ["qr_codes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("qr_codes").select("*, agents(name)").order("code", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*");
      if (error) throw error;
      return data;
    },
  });

  const pendingAgents = agents.filter((a: any) => a.approval_status === "pending");
  const approvedAgents = agents.filter((a: any) => a.approval_status === "approved");

  const generateQrMutation = useMutation({
    mutationFn: async (count: number) => {
      const { data: existing } = await supabase
        .from("qr_codes")
        .select("code")
        .order("code", { ascending: false })
        .limit(1);
      let maxNum = 0;
      if (existing && existing.length > 0) {
        const match = existing[0].code.match(/EMR-(\d+)/);
        if (match) maxNum = parseInt(match[1], 10);
      }
      const codes = [];
      for (let i = 1; i <= count; i++) {
        codes.push({ code: `EMR-${String(maxNum + i).padStart(4, "0")}` });
      }
      const { error } = await supabase.from("qr_codes").insert(codes);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr_codes"] });
      toast.success("QR codes generated!");
    },
    onError: () => toast.error("Failed to generate QR codes"),
  });

  const approveAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase.from("agents").update({ approval_status: "approved" }).eq("id", agentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent approved!");
    },
  });

  const rejectAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase.from("agents").update({ approval_status: "rejected" }).eq("id", agentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent rejected");
    },
  });

  const addAgentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agents").insert({
        name: agentName,
        phone: agentPhone,
        email: agentEmail || "",
        approval_status: "approved",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      setAgentName(""); setAgentPhone(""); setAgentEmail("");
      toast.success("Agent added!");
    },
    onError: () => toast.error("Failed to add agent"),
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent removed");
    },
  });

  const assignQrMutation = useMutation({
    mutationFn: async () => {
      if (!assignAgentId || !assignFrom || !assignTo) throw new Error("Missing fields");
      const { error } = await supabase
        .from("qr_codes")
        .update({ assigned_agent_id: assignAgentId, status: "assigned" })
        .gte("code", assignFrom.toUpperCase())
        .lte("code", assignTo.toUpperCase())
        .eq("status", "available");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr_codes"] });
      setAssignFrom(""); setAssignTo(""); setAssignAgentId("");
      toast.success("QR codes assigned to agent!");
    },
    onError: () => toast.error("Failed to assign QR codes"),
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("cmf_role");
    localStorage.removeItem("cmf_email");
    navigate("/login");
  };

  const available = qrCodes.filter((q: any) => q.status === "available").length;
  const assigned = qrCodes.filter((q: any) => q.status === "assigned").length;
  const activated = qrCodes.filter((q: any) => q.status === "activated").length;
  const baseUrl = window.location.origin;

  const getAgentStats = (agentId: string) => {
    const agentQrs = qrCodes.filter((q: any) => q.assigned_agent_id === agentId);
    return { total: agentQrs.length, used: agentQrs.filter((q: any) => q.status === "activated").length };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full p-4" style={{ backgroundColor: "#1B2A4A" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-primary-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-primary-foreground font-bold text-lg">Admin Panel</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground hover:text-primary-foreground/80">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total QR Codes", value: qrCodes.length },
            { label: "Available", value: available },
            { label: "Assigned", value: assigned },
            { label: "Activated", value: activated },
          ].map((s) => (
            <Card key={s.label} className="card-shadow">
              <CardContent className="py-3 text-center">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Agent Approvals */}
        {pendingAgents.length > 0 && (
          <Card className="border-warning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <Clock className="h-5 w-5" /> Pending Agent Approvals ({pendingAgents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingAgents.map((agent: any) => (
                <div key={agent.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="font-medium">{agent.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{agent.email}</span>
                    <span className="text-xs text-muted-foreground ml-2">{agent.phone || "No phone"}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveAgentMutation.mutate(agent.id)} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => rejectAgentMutation.mutate(agent.id)}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> Generate QR Codes</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Input type="number" value={qrCount} onChange={(e) => setQrCount(Number(e.target.value))} className="w-24" />
            <Button onClick={() => generateQrMutation.mutate(qrCount)} disabled={generateQrMutation.isPending}>
              <Plus className="mr-2 h-4 w-4" /> Generate
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assign QR Range to Agent</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="From code" value={assignFrom} onChange={(e) => setAssignFrom(e.target.value)} />
              <Input placeholder="To code" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} />
            </div>
            <Select value={assignAgentId} onValueChange={setAssignAgentId}>
              <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
              <SelectContent>
                {approvedAgents.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => assignQrMutation.mutate()} disabled={!assignFrom || !assignTo || !assignAgentId}>Assign</Button>
          </CardContent>
        </Card>

        <BulkStickerPrintCard baseUrl={baseUrl} printableCount={available + assigned} />
        <PrintHistoryCard />

        <Card>
          <CardHeader><CardTitle>QR Codes ({qrCodes.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {qrCodes.map((qr: any) => (
              <div key={qr.id} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{qr.code}</span>
                  {qr.agents?.name && <span className="text-xs text-muted-foreground">→ {qr.agents.name}</span>}
                </div>
                <Badge variant={qr.status === "available" ? "secondary" : qr.status === "activated" ? "default" : "outline"}>
                  {qr.status}
                </Badge>
              </div>
            ))}
            {qrCodes.length === 0 && <p className="text-center text-muted-foreground py-4">No QR codes yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Agents ({approvedAgents.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Name" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
              <Input placeholder="Phone" value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} />
              <Input placeholder="Email" value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)} />
            </div>
            <Button onClick={() => addAgentMutation.mutate()} disabled={!agentName || !agentPhone}>
              <Plus className="mr-2 h-4 w-4" /> Add Agent
            </Button>
            {approvedAgents.map((agent: any) => {
              const stats = getAgentStats(agent.id);
              return (
                <div key={agent.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <span className="font-medium">{agent.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{agent.phone}</span>
                    <span className="text-xs text-muted-foreground ml-2">QRs: {stats.total} (used: {stats.used})</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteAgentMutation.mutate(agent.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Customers ({customers.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {customers.map((c: any) => (
              <div key={c.id} className="border-b pb-2">
                <span className="font-medium">{c.name}</span>
                <span className="text-sm text-muted-foreground ml-2">{c.vehicle_number}</span>
                <span className="text-sm text-muted-foreground ml-2">Blood: {c.blood_group}</span>
              </div>
            ))}
            {customers.length === 0 && <p className="text-center text-muted-foreground py-4">No customers yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
