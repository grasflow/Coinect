# Komponenty HIG — Dokumentacja

Zestaw komponentów React + Tailwind zgodnych z **Apple Human Interface Guidelines** (HIG).

## Lokalizacja

Wszystkie komponenty znajdują się w `src/components/ui/`:

- **Layout**: `container.tsx`, `navbar.tsx`
- **Typografia**: `typography.tsx`
- **Kontrolki**: `button.tsx`, `input.tsx`, `textarea.tsx`, `form-field.tsx`
- **Wyświetlanie danych**: `card.tsx`, `list.tsx`, `progress.tsx`, `badge.tsx`
- **Dialogi**: `dialog.tsx`
- **Feedback**: `toast.tsx`

---

## 1. Layout

### Container

Responsywny kontener z maksymalną szerokością i paddingami.

```tsx
import { Container } from "@/components/ui/container";

<Container>{/* Treść */}</Container>;
```

### Stack

Układ flex kolumnowy z odstępami.

```tsx
import { Stack } from "@/components/ui/container";

<Stack>
  <div>Element 1</div>
  <div>Element 2</div>
</Stack>;
```

### Navbar

Sticky pasek nawigacji z blur i trzema sekcjami (leading, title, trailing).

```tsx
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";

<Navbar
  title="Ekran"
  leading={<Button variant="plain">Wstecz</Button>}
  trailing={<Button variant="plain">Edytuj</Button>}
/>;
```

---

## 2. Typografia

### H1, H2, H3

Nagłówki zgodne z Dynamic Type (semibold, tracking tight).

```tsx
import { H1, H2, H3 } from "@/components/ui/typography"

<H1>Tytuł główny</H1>
<H2>Sekcja</H2>
<H3>Podsekcja</H3>
```

### Text, Muted

Body i pomocniczy tekst.

```tsx
import { Text, Muted } from "@/components/ui/typography"

<Text>Treść paragraf.</Text>
<Muted>Informacja pomocnicza</Muted>
```

---

## 3. Button

Warianty zgodne z HIG: **filled**, **tinted**, **gray**, **plain**, **outline**, **destructive**.

```tsx
import { Button } from "@/components/ui/button"

<Button variant="filled">Primary</Button>
<Button variant="tinted">Tinted</Button>
<Button variant="gray">Secondary</Button>
<Button variant="plain">Plain</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>

{/* Rozmiary */}
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>
```

**Props**:

- `variant`: `filled | tinted | gray | plain | outline | destructive`
- `size`: `sm | default | lg | icon`
- `asChild`: bool — renderuj jako slot (Radix pattern)

---

## 4. Input / Textarea

Wyraźny focus ring, minimalne cienie, komfortowe wysokości.

```tsx
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

<Input type="text" placeholder="Nazwa" />
<Textarea placeholder="Opis" rows={4} />
```

**Props** (standard HTML + className).

---

## 5. FormField

Wrapper dla kontrolek z labelką, helper text i komunikatem błędu (ARIA compliant).

```tsx
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

<FormField label="Email" required helperText="Używamy go do logowania" errorText={errors.email} htmlFor="email">
  <Input id="email" type="email" />
</FormField>;
```

**Props**:

- `label?`: string
- `helperText?`: string
- `errorText?`: string — automatycznie ustawia `aria-invalid`
- `required?`: bool — dodaje `*`
- `htmlFor?`: string
- `children`: React node (kontrolka)

---

## 6. Card

Powierzchnia z lekkim obramowaniem i cienkim cieniem.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

<Card>
  <CardHeader>
    <CardTitle>Tytuł</CardTitle>
    <CardDescription>Opis</CardDescription>
  </CardHeader>
  <CardContent>Treść karty</CardContent>
  <CardFooter>
    <Button variant="gray">Anuluj</Button>
    <Button variant="filled">Zapisz</Button>
  </CardFooter>
</Card>;
```

---

## 7. List / ListItem

Lista z item'ami (leading/trailing icons, title/subtitle).

```tsx
import { List, ListItem } from "@/components/ui/list";
import { Badge } from "@/components/ui/badge";

<List>
  <ListItem title="Pozycja A" subtitle="Szczegóły" />
  <ListItem title="Pozycja B" subtitle="Szczegóły" trailing={<Badge>3</Badge>} onClick={() => console.log("clicked")} />
</List>;
```

**Props ListItem**:

- `title?`: ReactNode
- `subtitle?`: ReactNode
- `leading?`: ReactNode (np. ikona)
- `trailing?`: ReactNode (np. badge)
- `onClick?`: callback

---

## 8. Dialog

Modal z overlay (scrim), focus trap, ARIA.

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog>
  <DialogTrigger asChild>
    <Button variant="filled">Otwórz</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Tytuł dialogu</DialogTitle>
      <DialogDescription>Opis</DialogDescription>
    </DialogHeader>
    <div>Treść dialogu</div>
    <DialogFooter>
      <Button variant="gray">Anuluj</Button>
      <Button variant="filled">OK</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

**Uwaga**: w Astro użyj `client:load` lub `client:visible`.

---

## 9. Progress

Pasek postępu (linear) z ARIA.

```tsx
import { Progress } from "@/components/ui/progress";

<Progress value={42} />;
```

**Props**:

- `value`: number (0–100)

---

## 10. Badge

Neutralny, zaokrąglony badge.

```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Nowe</Badge>
<Badge>3</Badge>
```

---

## 11. Toast

Kontekst do wyświetlania powiadomień (toast).

```tsx
import { ToastProvider, useToast } from "@/components/ui/toast";

// W głównym layoutzie:
<ToastProvider>{children}</ToastProvider>;

// W komponencie:
const { show } = useToast();
show({ title: "Zapisano", description: "Zmiany zostały zapisane" });
```

---

## Tokeny HIG

W `src/styles/global.css` dodane zmienne CSS:

```css
--hig-corner-small: 0.5rem; /* 8px */
--hig-corner-medium: 0.75rem; /* 12px */
--hig-corner-large: 1rem; /* 16px */
--hig-control-height-sm: 2.25rem; /* 36px */
--hig-control-height-md: 2.5rem; /* 40px */
--hig-control-height-lg: 2.75rem; /* 44px */
--hig-focus-ring-width: 3px;
--hig-state-hover: 0.08;
--hig-state-pressed: 0.12;
--hig-elevation-0: ...;
--hig-elevation-1: ...;
--hig-elevation-2: ...;
```

---

## Kitchen Sink

Strona demonstracyjna wszystkich komponentów: `/kitchen-sink`

```sh
npm run dev
# Otwórz http://localhost:4321/kitchen-sink
```

---

## Dostępność (a11y)

- Focus ring 3px, widoczny dla użytkowników klawiatury.
- ARIA: `aria-invalid`, `aria-describedby`, `role="progressbar"`, `role="status"`.
- Minimalna wysokość kontrolek ~40–44px (touch targets).
- Kontrast kolorów spełnia WCAG AA.

---

## Wskazówki

1. **Astro + React**: komponenty interaktywne wymagają `client:load` lub `client:visible`.
2. **Dark mode**: komponenty respektują `dark:` warianty Tailwind (przełącznik w aplikacji).
3. **Extend**: możesz rozszerzyć warianty w `buttonVariants` (CVA) lub dodać nowe tokeny CSS.

---

Powodzenia! 🚀
