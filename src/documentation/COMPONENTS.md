# Components Documentation

## Main Components

### App Component
The primary component that serves as the application shell.

#### State Management
```typescript
interface Item {
  id: string;
  description: string;
  amount: string;
}

interface PartyInfo {
  details: string;
}

// Key State Variables
const [items, setItems] = useState<Item[]>([...])
const [companyInfo, setCompanyInfo] = useState<PartyInfo>({...})
const [recipientInfo, setRecipientInfo] = useState<PartyInfo>({...})
const [selectedCurrency, setSelectedCurrency] = useState('USD')
```

#### Key Methods

1. **Item Management**
   ```typescript
   const addItem = () => {
     if (isReadOnly) return;
     setItems(prev => [...prev, {
       id: crypto.randomUUID(),
       description: '',
       amount: ''
     }]);
   };
   ```

2. **Amount Formatting**
   ```typescript
   const formatNumber = (value: string) => {
     const num = parseFloat(value);
     if (isNaN(num)) return '';
     return num.toLocaleString('en-US', {
       minimumFractionDigits: 2,
       maximumFractionDigits: 2
     });
   };
   ```

### CryptoPreferencesModal Component
Handles cryptocurrency payment preferences.

#### Props Interface
```typescript
interface CryptoPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  setWalletAddress: (address: string) => void;
  selectedTokens: string[];
  setSelectedTokens: (tokens: string[]) => void;
  selectedChains: string[];
  setSelectedChains: (chains: string[]) => void;
  onSave: () => void;
}
```

#### Key Features
- Token selection with "All Tokens" option
- Network selection with major chains
- Wallet address input with validation
- Responsive design for mobile and desktop

## Utility Components

### ThemeProvider
Provides theme context throughout the application.

```typescript
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

## Modal Components

### Share URL Modal
Displays invoice sharing options.

#### Features
- URL shortening for display
- Copy to clipboard functionality
- Tooltip for full URL
- Social preview metadata updates

### Payment Modal
Handles payment flow integration.

#### Features
- Payment amount display
- Token and network information
- Yodl.me iframe integration
- Payment status updates

## Form Components

### Invoice Details Section
Handles company and recipient information.

#### Features
- Expandable sections on mobile
- Required field validation
- Auto-collapse on completion
- Read-only mode support

### Items Section
Manages invoice line items.

#### Features
- Dynamic item addition/removal
- Amount formatting
- Currency selection
- Total calculation

## Styling System

### Theme Classes
The application uses Tailwind CSS with custom theme classes:

```typescript
const themeClasses = {
  light: {
    background: 'bg-gradient-to-br from-[#4834d4] to-[#686de0]',
    card: 'bg-white/95 text-gray-900',
    input: 'bg-white border-[#4834d4]/20'
  },
  dark: {
    background: 'bg-gradient-to-br from-gray-900 to-gray-800',
    card: 'bg-gray-800/95 text-gray-100',
    input: 'bg-gray-700 border-gray-600 text-gray-100'
  }
};
```

### Responsive Design
- Mobile-first approach
- Breakpoint system
- Flexible layouts
- Touch-friendly interactions