import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

const PrintHistoryCard = () => {
  const { data: history = [] } = useQuery({
    queryKey: ["print_history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("print_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Print History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {history.map((entry: any) => (
          <div key={entry.id} className="flex justify-between items-center border-b pb-2">
            <div>
              <span className="font-medium">{entry.count} stickers</span>
              <p className="text-sm text-muted-foreground">
                {entry.code_from && entry.code_to ? `${entry.code_from} → ${entry.code_to}` : "Bulk print"}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>{entry.printed_by}</div>
              <div>{new Date(entry.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No print history yet</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PrintHistoryCard;
