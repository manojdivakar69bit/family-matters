import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, ScanLine, Phone } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const TAGLINE_LINE1 = "Every Life Matters. Every Second Counts.";
const TAGLINE_LINE2 = "Just Scan and Call.";

const useTypewriter = (text: string, speed = 50, startDelay = 0) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(delayTimer);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, started]);

  return { displayed, done, started };
};

const Index = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const line1 = useTypewriter(TAGLINE_LINE1, 45, 800);
  const line2 = useTypewriter(TAGLINE_LINE2, 45, 800 + TAGLINE_LINE1.length * 45 + 300);
  const allTyped = line1.done && line2.done;

  return (
    <div
      className="min-h-screen bg-background transition-opacity duration-700"
      style={{ opacity: loaded ? 1 : 0 }}
    >
      {/* Header */}
      <div className="w-full flex flex-col items-center justify-center py-10 px-4 bg-card">
        <img
          src="/logo.png"
          alt="Call My Family"
          className="w-full max-w-lg h-auto mb-6 transition-all duration-1000 ease-out"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "scale(1)" : "scale(0.7)",
            animation: loaded ? "heartbeat 2.5s ease-in-out infinite 1.5s" : "none",
          }}
        />
        <div
          className="text-lg md:text-xl font-bold italic text-center px-4 min-h-[3.5rem]"
          style={{ color: "#0D1B2A" }}
        >
          <div>
            {line1.started && line1.displayed}
            {line1.started && !line1.done && <span className="animate-blink">|</span>}
          </div>
          <div>
            {line2.started && line2.displayed}
            {line2.started && !allTyped && <span className="animate-blink">|</span>}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div
          className="grid grid-cols-3 gap-3 text-center transition-all duration-700 ease-out"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(30px)",
            transitionDelay: "0.4s",
          }}
        >
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

        <div
          className="space-y-3 transition-all duration-700 ease-out"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(30px)",
            transitionDelay: "0.7s",
          }}
        >
          <Link to="/login?role=admin">
            <Button className="w-full" size="lg">Admin Panel</Button>
          </Link>
          <Link to="/login?role=agent">
            <Button className="w-full mt-3" variant="outline" size="lg">Agent Panel</Button>
          </Link>
        </div>

        <div
          className="text-center pt-4 transition-opacity duration-700"
          style={{ opacity: loaded ? 1 : 0, transitionDelay: "1s" }}
        >
          <Link to="/privacy" className="text-xs text-muted-foreground hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
