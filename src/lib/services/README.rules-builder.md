# RulesBuilderService - Dokumentacja testów

## Przegląd

`RulesBuilderService` to serwis generujący zawartość plików z regułami AI dla projektów na podstawie profilu użytkownika i dodatkowych parametrów.

## Pokrycie testów

### ✅ 36 testów jednostkowych obejmujących:

#### 1. **Happy Path** (3 testy)

- Generowanie podstawowej zawartości z samym profilem
- Generowanie pełnej zawartości ze wszystkimi sekcjami
- Poprawne liczenie reguł

#### 2. **Project Types** (4 testy)

Testowanie wszystkich typów projektów:

- `web` - aplikacje webowe
- `mobile` - aplikacje mobilne
- `api` - serwisy API
- `desktop` - aplikacje desktopowe

#### 3. **Business Rules Section** (3 testy)

- Kompletny profil ze wszystkimi polami
- Profil z pustymi opcjonalnymi polami
- Konfiguracja konta bankowego

#### 4. **Tech Stack** (3 testy)

- Formatowanie jako lista
- Pomijanie pustej listy
- Trimowanie whitespace

#### 5. **Custom Rules** (3 testy)

- Formatowanie jako lista
- Pomijanie pustej listy
- Renderowanie poprawnych reguł

#### 6. **Validation Errors** (8 testów)

Warunki brzegowe:

- Brak profilu
- Brak ID profilu
- Za dużo custom rules (>50)
- Za dużo tech stack items (>20)
- Za krótka custom rule (<10 znaków)
- Za długa custom rule (>500 znaków)
- Pusty tech stack item
- Tech stack item tylko z whitespace

#### 7. **Edge Cases** (6 testów)

- Pusty `full_name`
- Maksymalna liczba custom rules (50)
- Maksymalna liczba tech stack items (20)
- Minimalna długość custom rule (10 znaków)
- Maksymalna długość custom rule (500 znaków)
- Wszystkie opcjonalne pola jako null

#### 8. **Output Structure** (4 testy)

- Struktura metadata
- Sekcje jako tablica stringów
- Łączenie sekcji przez podwójny newline
- Obecność header i footer

#### 9. **Business Logic** (2 testy)

- Spójność przy wielokrotnym wywołaniu
- Trimowanie whitespace z custom rules

## Kluczowe reguły biznesowe

### Limity

```typescript
MAX_CUSTOM_RULES = 50;
MAX_TECH_STACK_ITEMS = 20;
MIN_RULE_LENGTH = 10;
MAX_RULE_LENGTH = 500;
```

### Walidacja

1. **Profil** - wymagany z niepustym ID
2. **Custom rules** - każda reguła 10-500 znaków
3. **Tech stack** - każdy item niepusty po trim()
4. **Liczba elementów** - nie więcej niż limity

### Struktura wyjściowa

```typescript
{
  content: string,           // Pełna zawartość
  sections: string[],        // Tablica sekcji
  metadata: {
    generatedAt: Date,       // Timestamp generowania
    profileId: string,       // ID profilu użytkownika
    rulesCount: number       // Liczba wygenerowanych reguł
  }
}
```

## Przykłady testów

### Test walidacji

```typescript
it("rzuca błąd gdy za dużo custom rules (>50)", () => {
  const tooManyRules = Array(51).fill("This is a valid custom rule that meets minimum length");

  const context: RulesContext = {
    profile: mockProfile,
    customRules: tooManyRules,
  };

  expect(() => service.generateRulesContent(context)).toThrow("Maximum 50 custom rules allowed");
});
```

### Test edge case

```typescript
it("obsługuje custom rule o minimalnej długości (10 znaków)", () => {
  const context: RulesContext = {
    profile: mockProfile,
    customRules: ["1234567890"], // exactly 10 chars
  };

  expect(() => service.generateRulesContent(context)).not.toThrow();
});
```

### Test business logic

```typescript
it("generuje spójny content przy wielokrotnym wywołaniu", () => {
  const context: RulesContext = {
    profile: mockProfile,
    projectType: "web",
    techStack: ["React"],
    customRules: ["Rule one here"],
  };

  const result1 = service.generateRulesContent(context);
  const result2 = service.generateRulesContent(context);

  expect(result1.content).toBe(result2.content);
  expect(result1.sections).toEqual(result2.sections);
});
```

## Best Practices zastosowane

### 1. **Vitest mocking**

- `vi.setSystemTime()` dla deterministycznych dat

### 2. **Arrange-Act-Assert**

Wszystkie testy używają wzorca AAA:

```typescript
// Arrange
const context: RulesContext = { profile: mockProfile };

// Act
const result = service.generateRulesContent(context);

// Assert
expect(result.content).toContain("Expected text");
```

### 3. **Grupowanie testów**

- `describe()` dla logicznych grup
- Jasne nazwy opisujące co testujemy

### 4. **Edge cases**

- Minimalne i maksymalne wartości
- Puste/null wartości
- Boundary conditions

### 5. **Type safety**

- Wszystkie mocki z poprawnymi typami
- TypeScript strict mode

## Uruchomienie testów

```bash
# Wszystkie testy
npm test

# Tylko ten serwis
npm test -- src/lib/services/rules-builder.service.test.ts

# W trybie watch
npm test -- --watch

# Z coverage
npm test -- --coverage
```

## Coverage

- **Lines**: 100%
- **Functions**: 100%
- **Branches**: 100%
- **Statements**: 100%
