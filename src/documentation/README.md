# Slipstream Documentation

{/* Previous content */}

## QR Code Feature

The application now includes QR code generation for invoice sharing:

### QR Code Modal
- Displays a QR code for the current invoice
- Shows the full invoice URL
- Provides copy and open functionality
- Responsive design for all screen sizes

### Implementation Details
```typescript
// QR Code generation
<QRCodeSVG
  value={invoiceUrl}
  size={200}
  level="H"
  includeMargin={true}
/>
```

### Features
- High error correction level (H)
- 200x200px size for optimal scanning
- Margin included for better readability
- Copy to clipboard functionality
- Direct open in new tab option

{/* Rest of the documentation */}