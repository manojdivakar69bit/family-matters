import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, ScanLine, Phone } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header — white background, full-width logo */}
      <div className="w-full flex flex-col items-center justify-center py-10 px-4 bg-card">
        <img
          src="/logo.png"
          alt="Call My Family"
          className="w-full max-w-md h-auto mb-6"
        />
        <p
          className="text-lg font-bold italic text-center px-4"
          style={{ color: "#0D1B2A" }}
        >
          Every Life Matters. Every Second Counts. Just Scan and Call.
        </p>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Card className="card-shadow">
            <CardContent className="py-4 flex flex-col items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium">Secure</span>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardContent className="py-4 flex flex-col items-center gap-2">
              <ScanLine className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium">Quick Scan</span>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardContent className="py-4 flex flex-col items-center gap-2">
              <Phone className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium">Call Family</span>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Link to="/login?role=admin">
            <Button className="w-full" size="lg">Admin Panel</Button>
          </Link>
          <Link to="/login?role=agent">
            <Button className="w-full mt-3" variant="outline" size="lg">Agent Panel</Button>
          </Link>
        </div>

        <div className="text-center pt-4">
          <Link to="/privacy" className="text-xs text-muted-foreground hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
