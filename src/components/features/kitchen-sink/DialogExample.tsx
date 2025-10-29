import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function DialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="tinted">Otwórz dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Przykładowy dialog</DialogTitle>
          <DialogDescription>Opis działania dialogu</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="gray">Anuluj</Button>
          <Button variant="filled">OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
