import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User } from "lucide-react";

interface InvoicePartiesPanelProps {
  issuer: {
    name: string;
    tax_id?: string;
    address?: string;
    city?: string;
    postal_code?: string;
  };
  recipient: {
    name: string;
    tax_id?: string;
    address?: string;
    city?: string;
    postal_code?: string;
  };
}

export function InvoicePartiesPanel({ issuer, recipient }: InvoicePartiesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Strony faktury</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wystawca */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-semibold">Wystawca</h4>
          </div>
          <div className="text-sm space-y-1 text-muted-foreground">
            <div className="font-medium text-foreground">{issuer.name}</div>
            {issuer.tax_id && <div>NIP: {issuer.tax_id}</div>}
            {issuer.address && <div>{issuer.address}</div>}
            {(issuer.postal_code || issuer.city) && (
              <div>
                {issuer.postal_code} {issuer.city}
              </div>
            )}
          </div>
        </div>

        {/* Nabywca */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-semibold">Nabywca</h4>
          </div>
          <div className="text-sm space-y-1 text-muted-foreground">
            <div className="font-medium text-foreground">{recipient.name}</div>
            {recipient.tax_id && <div>NIP: {recipient.tax_id}</div>}
            {recipient.address && <div>{recipient.address}</div>}
            {(recipient.postal_code || recipient.city) && (
              <div>
                {recipient.postal_code} {recipient.city}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
