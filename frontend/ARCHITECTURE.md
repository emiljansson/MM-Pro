# MathMaster Pro - Kod Arkitektur

## Mappstruktur

```
frontend/
├── app/                    # Expo Router skärmar
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Hemskärm
│   ├── game.tsx           # Spelskärm
│   ├── login.tsx          # Inloggning
│   ├── register.tsx       # Registrering
│   ├── forgot-password.tsx # Lösenordsåterställning
│   ├── profile.tsx        # Användarprofil
│   ├── admin.tsx          # Admin-panel
│   ├── achievements.tsx   # Prestationer
│   ├── leaderboard.tsx    # Topplista
│   ├── groups.tsx         # Grupper
│   ├── history.tsx        # Spelhistorik
│   ├── settings.tsx       # Inställningar
│   └── results.tsx        # Spelresultat
│
├── src/
│   ├── components/        # Återanvändbara UI-komponenter
│   │   ├── admin/        # Admin-specifika komponenter
│   │   │   └── AdminDashboard.tsx
│   │   ├── CategoryGrid.tsx
│   │   ├── Header.tsx
│   │   ├── StartButton.tsx
│   │   ├── DifficultySelector.tsx
│   │   ├── QuestionCountSelector.tsx
│   │   ├── NumericKeyboard.tsx
│   │   ├── LanguageSelector.tsx
│   │   ├── OperationCard.tsx
│   │   └── index.ts
│   │
│   ├── constants/         # App-konstanter
│   │   └── index.ts       # ALL_CATEGORIES, DIFFICULTY_LEVELS, etc.
│   │
│   ├── contexts/          # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── index.ts
│   │
│   ├── hooks/             # Custom React hooks
│   │   └── useTheme.ts    # Tema och översättnings-hooks
│   │
│   ├── i18n/              # Internationalisering
│   │   └── translations.ts # Fallback-översättningar
│   │
│   ├── services/          # API-tjänster
│   │   ├── api.ts
│   │   └── index.ts
│   │
│   ├── stores/            # Zustand state stores
│   │   ├── gameStore.ts   # Spel-state
│   │   ├── translationStore.ts # Översättnings-state
│   │   └── index.ts
│   │
│   ├── types/             # TypeScript typer
│   │   └── index.ts
│   │
│   └── utils/             # Hjälpfunktioner
│       └── theme.ts       # Tema-färger (retro 50-tal)
│
└── assets/
    └── images/            # App-ikoner och bilder
```

## Nyckelkoncept

### State Management (Zustand)
- `gameStore` - Spelinställningar, frågor, poäng
- `translationStore` - Språk och översättningar

### Tema
Retro 50-tals design med:
- Ljust tema: Krämfärgad bakgrund, turkos accent
- Mörkt tema: Marinblå bakgrund, neon-mint accent

### Komponenter
Alla UI-komponenter är:
- Temamedvetna (använder useTheme hook)
- Kompakta på små skärmar
- Flerspråkiga (använder t() funktion)

## Import-exempel

```typescript
// Komponenter
import { CategoryGrid, Header, StartButton } from '../src/components';

// Konstanter
import { ALL_CATEGORIES, DIFFICULTY_LEVELS } from '../src/constants';

// Stores
import { useGameStore, useTranslationStore } from '../src/stores';

// Hooks
import { useTheme, useTranslation } from '../src/hooks/useTheme';
```
