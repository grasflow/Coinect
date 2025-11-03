/**
 * Oblicza sumę faktury z podatkiem
 */
export function calculateInvoiceTotal(subtotal: number, taxRate: number) {
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    subtotal,
    taxAmount,
    total,
  };
}

/**
 * Formatuje numer faktury według szablonu
 */
export function formatInvoiceNumber(template: string, counter: number, date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const number = String(counter).padStart(3, "0");

  return template.replace("{YYYY}", String(year)).replace("{MM}", month).replace("{NN}", number);
}

/**
 * Sprawdza czy faktura jest przeterminowana
 */
export function isInvoiceOverdue(dueDate: string, status: string): boolean {
  if (status === "paid") return false;

  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return due < now;
}

/**
 * Znajduje pierwszy dostępny numer faktury dla danego miesiąca
 * Wypełnia luki pozostawione po usuniętych fakturach
 * @param existingNumbers - tablica numerów faktur z danego miesiąca (np. ["FV/2024/10/001", "FV/2024/10/003"])
 * @param year - rok faktury
 * @param month - miesiąc faktury (01-12)
 * @returns następny dostępny numer faktury
 */
export function findNextInvoiceNumber(existingNumbers: string[], year: number, month: string): string {
  if (existingNumbers.length === 0) {
    return `FV/${year}/${month}/001`;
  }

  // Wyciągnij numery sekwencyjne i posortuj
  const sequentialNumbers = existingNumbers
    .map((num) => {
      const parts = num.split("/");
      if (parts.length === 4) {
        return parseInt(parts[3], 10);
      }
      return 0;
    })
    .filter((num) => num > 0)
    .sort((a, b) => a - b);

  // Znajdź pierwszą lukę
  for (let i = 0; i < sequentialNumbers.length; i++) {
    const expectedNumber = i + 1;
    if (sequentialNumbers[i] !== expectedNumber) {
      // Znaleziono lukę
      return `FV/${year}/${month}/${String(expectedNumber).padStart(3, "0")}`;
    }
  }

  // Brak luk - użyj następnego numeru po maksymalnym
  const nextNumber = sequentialNumbers[sequentialNumbers.length - 1] + 1;
  return `FV/${year}/${month}/${String(nextNumber).padStart(3, "0")}`;
}

/**
 * Generuje numer faktury w formacie: FV/YYYY/MM/NNN
 * @param lastInvoiceNumber - ostatni numer faktury w danym miesiącu (np. "FV/2024/10/005")
 * @param invoiceDate - data faktury (używana do określenia roku i miesiąca)
 * @returns nowy numer faktury
 * @deprecated Użyj findNextInvoiceNumber() zamiast tej funkcji dla lepszej obsługi luk
 */
export function generateInvoiceNumber(lastInvoiceNumber: string | null, invoiceDate: Date): string {
  const year = invoiceDate.getFullYear();
  const month = String(invoiceDate.getMonth() + 1).padStart(2, "0");

  // Jeśli nie ma ostatniej faktury lub jest z innego miesiąca, zaczynamy od 001
  if (!lastInvoiceNumber) {
    return `FV/${year}/${month}/001`;
  }

  // Parsowanie ostatniego numeru
  const parts = lastInvoiceNumber.split("/");
  if (parts.length !== 4) {
    return `FV/${year}/${month}/001`;
  }

  const [, lastYear, lastMonth, lastNumber] = parts;

  // Jeśli nowy miesiąc, zaczynamy od 001
  if (lastYear !== String(year) || lastMonth !== month) {
    return `FV/${year}/${month}/001`;
  }

  // Inkrementacja numeru
  const nextNumber = parseInt(lastNumber, 10) + 1;
  return `FV/${year}/${month}/${String(nextNumber).padStart(3, "0")}`;
}

/**
 * Konwertuje kwotę na słowa (po polsku)
 * @param amount - kwota do konwersji
 * @param currency - waluta (PLN, EUR, USD)
 * @returns kwota słownie
 */
export function amountToWords(amount: number, currency: string): string {
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  const integerWords = numberToWords(integerPart);
  const decimalWords = String(decimalPart).padStart(2, "0");

  const currencyName = getCurrencyName(currency, integerPart);
  const subunitName = getSubunitName(currency);

  return `${integerWords} ${currencyName} ${decimalWords}/100 ${subunitName}`;
}

function numberToWords(num: number): string {
  if (num === 0) return "zero";

  const ones = ["", "jeden", "dwa", "trzy", "cztery", "pięć", "sześć", "siedem", "osiem", "dziewięć"];
  const teens = [
    "dziesięć",
    "jedenaście",
    "dwanaście",
    "trzynaście",
    "czternaście",
    "piętnaście",
    "szesnaście",
    "siedemnaście",
    "osiemnaście",
    "dziewiętnaście",
  ];
  const tens = [
    "",
    "",
    "dwadzieścia",
    "trzydzieści",
    "czterdzieści",
    "pięćdziesiąt",
    "sześćdziesiąt",
    "siedemdziesiąt",
    "osiemdziesiąt",
    "dziewięćdziesiąt",
  ];
  const hundreds = [
    "",
    "sto",
    "dwieście",
    "trzysta",
    "czterysta",
    "pięćset",
    "sześćset",
    "siedemset",
    "osiemset",
    "dziewięćset",
  ];

  if (num < 10) {
    return ones[num];
  }

  if (num < 20) {
    return teens[num - 10];
  }

  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    return tens[ten] + (one > 0 ? " " + ones[one] : "");
  }

  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    return hundreds[hundred] + (rest > 0 ? " " + numberToWords(rest) : "");
  }

  if (num < 1000000) {
    const thousand = Math.floor(num / 1000);
    const rest = num % 1000;
    const thousandWord = getThousandWord(thousand);
    return numberToWords(thousand) + " " + thousandWord + (rest > 0 ? " " + numberToWords(rest) : "");
  }

  // Dla większych liczb
  return String(num);
}

function getThousandWord(num: number): string {
  if (num === 1) return "tysiąc";
  if (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20)) {
    return "tysiące";
  }
  return "tysięcy";
}

function getCurrencyName(currency: string, amount: number): string {
  if (currency === "PLN") {
    if (amount === 1) return "złoty";
    if (amount % 10 >= 2 && amount % 10 <= 4 && (amount % 100 < 10 || amount % 100 >= 20)) {
      return "złote";
    }
    return "złotych";
  }

  if (currency === "EUR") {
    if (amount === 1) return "euro";
    return "euro";
  }

  if (currency === "USD") {
    if (amount === 1) return "dolar";
    if (amount % 10 >= 2 && amount % 10 <= 4 && (amount % 100 < 10 || amount % 100 >= 20)) {
      return "dolary";
    }
    return "dolarów";
  }

  return currency;
}

function getSubunitName(currency: string): string {
  if (currency === "PLN") return "groszy";
  if (currency === "EUR") return "centów";
  if (currency === "USD") return "centów";
  return "centów";
}
