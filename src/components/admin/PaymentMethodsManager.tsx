import { db } from "@/lib/db";
import {
  createPaymentMethodAction,
  updatePaymentMethodAction,
  deletePaymentMethodAction,
} from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Edit, Plus } from "lucide-react";
import { PaymentMethodDialog } from "./PaymentMethodDialog";
// Se importa el nuevo componente de eliminación
import { DeleteMethodDialog } from "./DeleteMethodDialog";

export async function PaymentMethodsManager() {
  const paymentMethods = await db.query.paymentMethods.findMany();

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Métodos de Pago
          </CardTitle>
          <CardDescription>
            Añade, edita o desactiva los métodos de pago disponibles para los clientes.
          </CardDescription>
        </div>
        <PaymentMethodDialog
          action={createPaymentMethodAction}
          triggerButton={
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Añadir Método
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead className="hidden sm:table-cell">Detalles</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentMethods.map((method) => (
              <TableRow key={method.id}>
                <TableCell className="font-medium">{method.title}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-pre-wrap max-w-xs truncate">
                  {method.details}
                </TableCell>
                <TableCell>
                  {method.isActive ? (
                    <Badge className="bg-green-100 text-green-800">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell className="flex gap-2 justify-end">
                  <PaymentMethodDialog
                    action={updatePaymentMethodAction}
                    method={method}
                    triggerButton={
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  />
                  {/* Se añade el botón de eliminar */}
                  <DeleteMethodDialog 
                    methodId={method.id} 
                    action={deletePaymentMethodAction} 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}