import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { H1, Text, Muted } from "@/components/ui/typography";
import { ClientForm } from "./ClientForm";
import { DeleteClientDialog } from "./DeleteClientDialog";
import { Search, Building2, Mail, Phone, MapPin, LoaderIcon } from "lucide-react";
import { useState } from "react";
import type { ClientDTO } from "@/types";
import QueryProvider from "@/components/QueryProvider";

async function fetchClients(): Promise<ClientDTO[]> {
  const response = await fetch("/api/clients", {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać klientów");
  }

  return response.json();
}

function ClientsListContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const {
    data: clients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <Muted className="mt-2">Ładowanie klientów...</Muted>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Text className="text-destructive">Wystąpił błąd podczas ładowania klientów</Text>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["clients"] })} className="mt-2">
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <H1>Klienci</H1>
          <Muted>Zarządzaj swoimi klientami</Muted>
        </div>
        <ClientForm />
      </div>

      <Card className="shadow-sm transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="flex items-center gap-2 leading-none font-semibold">
              <Building2 className="h-5 w-5" />
              Lista klientów ({filteredClients.length})
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Szukaj klientów..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <Text className="font-medium mb-2">{searchTerm ? "Nie znaleziono klientów" : "Brak klientów"}</Text>
              <Muted className="mb-4">
                {searchTerm ? "Spróbuj zmienić kryteria wyszukiwania" : "Dodaj pierwszego klienta, aby rozpocząć pracę"}
              </Muted>
              {!searchTerm && <ClientForm />}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Kontakt</TableHead>
                    <TableHead>Adres</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Stawka</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {client.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.street && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              {client.street}
                            </div>
                          )}
                          {(client.city || client.postal_code) && (
                            <div className="text-sm text-gray-600">
                              {client.postal_code} {client.city}
                            </div>
                          )}
                          {client.country && client.country !== "Polska" && (
                            <div className="text-sm text-gray-600">{client.country}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.tax_id ? (
                          <span className="font-mono text-sm">{client.tax_id}</span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.default_hourly_rate ? (
                          <span className="font-medium">
                            {client.default_hourly_rate} {client.default_currency}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <ClientForm client={client} />
                          <DeleteClientDialog clientId={client.id} clientName={client.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ClientsList() {
  return (
    <QueryProvider>
      <ClientsListContent />
    </QueryProvider>
  );
}
