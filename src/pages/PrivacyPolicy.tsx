import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full p-4" style={{ backgroundColor: "#1B2A4A" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/"><ArrowLeft className="h-5 w-5 text-primary-foreground" /></Link>
          <h1 className="text-primary-foreground font-bold text-lg">Privacy Policy</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 prose prose-sm dark:prose-invert">
        <p className="text-muted-foreground text-sm">Last updated: April 4, 2026</p>

        <h2>1. Introduction</h2>
        <p>Call My Family ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application and related services.</p>

        <h2>2. Information We Collect</h2>
        <ul>
          <li><strong>Personal Information:</strong> Name, phone number, vehicle number, blood group, and address provided during registration.</li>
          <li><strong>Emergency Contacts:</strong> Names, phone numbers, and relationships of contacts you designate.</li>
          <li><strong>Usage Data:</strong> QR code scans, call logs, and app interaction data.</li>
          <li><strong>Device Information:</strong> Device type, operating system, and unique identifiers.</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To display emergency contact information when your QR code is scanned.</li>
          <li>To facilitate emergency calls to your designated contacts.</li>
          <li>To generate and print QR code stickers linked to your profile.</li>
          <li>To improve our services and user experience.</li>
        </ul>

        <h2>4. Data Sharing</h2>
        <p>We do not sell your personal information. Your emergency information is only displayed when your unique QR code is scanned. We may share data with:</p>
        <ul>
          <li>Emergency responders when your QR code is scanned in an emergency.</li>
          <li>Service providers who assist in operating our platform (e.g., cloud hosting).</li>
          <li>Law enforcement when required by law.</li>
        </ul>

        <h2>5. Data Security</h2>
        <p>We implement industry-standard security measures including encrypted data transmission, secure cloud storage, and access controls to protect your information.</p>

        <h2>6. Data Retention</h2>
        <p>We retain your data as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting us.</p>

        <h2>7. Your Rights</h2>
        <ul>
          <li>Access, update, or delete your personal information.</li>
          <li>Opt out of non-essential data collection.</li>
          <li>Request a copy of your data.</li>
          <li>Withdraw consent at any time.</li>
        </ul>

        <h2>8. Children's Privacy</h2>
        <p>Our service is not directed to children under 13. We do not knowingly collect personal information from children.</p>

        <h2>9. Changes to This Policy</h2>
        <p>We may update this policy from time to time. We will notify you of significant changes through the app or via email.</p>

        <h2>10. Contact Us</h2>
        <p>If you have questions about this Privacy Policy, contact us at:</p>
        <p><strong>Email:</strong> support@callmyfamily.com</p>

        <div className="mt-8">
          <Link to="/">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
