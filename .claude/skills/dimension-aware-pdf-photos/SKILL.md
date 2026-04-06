---
name: dimension-aware-pdf-photos
description: Use this skill when implementing photo/image handling in PDF reports generated with @react-pdf/renderer. It covers dynamic image dimension capture at upload time, proportional sizing in PDF layout, responsive photo grids (full-width vs multi-column), and aspect-ratio preservation across all photo types (single, array, conditional).
---

# Dimension-Aware PDF Photo Handling

## Context

When generating PDFs with `@react-pdf/renderer`, images have fixed dimensions by default — which distorts photos and wastes space. This pattern captures actual photo dimensions at upload time and uses them to dynamically calculate proportional heights in the PDF layout, ensuring photos display correctly regardless of orientation (portrait, landscape, square).

## Core Pattern

### 1. Capture Dimensions at Upload Time

On the client, store dimensions alongside the file path/state:

```typescript
// State to hold dimensions per photo key
const [fotoDimensoes, setFotoDimensoes] = useState<Record<string, { width: number; height: number }>>({});

// When a photo is uploaded, read its natural dimensions
const getPhotoDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = URL.createObjectURL(file);
  });
};

// Store dimensions on upload callback
onPhotoUploaded={(path, dims) => {
  setValue('fotoPath', path, { shouldValidate: true });
  if (dims) setFotoDimensoes((prev) => ({ ...prev, ['my_photo_key']: dims }));
}}
```

### 2. Dimension-Aware Height Calculator

Use this helper in the PDF component. Given the original dimensions and the available container width, calculate proportional height with an optional max:

```typescript
function calcImageHeight(
  dims: { width: number; height: number } | undefined,
  containerWidth: number,
  maxHeight: number = 400
): number {
  if (!dims) return 160; // safe fallback
  const ratio = dims.height / dims.width;
  return Math.min(containerWidth * ratio, maxHeight);
}
```

### 3. Grid Layout — Adaptive Based on Photo Count

```typescript
// 1 photo = full width
const medWidth = photoCount <= 1 ? '100%' : '48%';
const containerW = photoCount <= 1 ? 400 : 200;

<PDFImage
  src={fotoUrl}
  style={{
    width: '100%',
    height: calcImageHeight(dims, containerW, 400),
    objectFit: 'contain',
    backgroundColor: '#fafafa',
  }}
/>
```

### 4. Pass Dimensions to PDF Route

When generating the PDF, include `fotoDimensoes` in the request body:

```typescript
const resposta = await fetch('/api/generate-pdf', {
  method: 'POST',
  body: JSON.stringify({
    dados: { ...formData },
    perfil: {},
    fotosUrl: fotosUrlMap,
    fotoDimensoes, // ← critical: pass captured dimensions
  }),
});
```

### 5. PDF Route Receives and Forwards

```typescript
export async function POST(req: NextRequest) {
  const { dados, perfil, fotosUrl, fotoDimensoes } = await req.json();
  const doc = <MyPDF dados={dados} perfil={perfil} fotosUrl={fotosUrl ?? {}} fotoDimensoes={fotoDimensoes ?? {}} />;
  // ...
}
```

### 6. PDF Component Uses Dimensions

```typescript
interface MyPDFProps {
  dados: Record<string, any>;
  fotosUrl: Record<string, string>;
  fotoDimensoes: Record<string, { width: number; height: number }>;
}

// In the PDF, reference dimensions by key:
<PDFImage
  src={fotosUrl['photo_key']}
  style={{
    width: '100%',
    height: calcImageHeight(fotoDimensoes['photo_key'], 200, 350),
    objectFit: 'contain',
    borderRadius: 6,
  }}
/>
```

## Key Dimensions to Capture

| Photo Type | Storage Key | Container Width (single) | Container Width (multi) |
|---|---|---|---|
| Placa de identificação | `placa` | 225 | — |
| Manômetro | `manometro` | 225 | — |
| Exame externo (1 foto) | `exame_0` | 400 | — |
| Exame externo (2+) | `exame_externo_0` | — | 200 |
| Exame interno | `exame_interno` / `exame_1` | — | 200 |
| Medição de espessura | `medicao_0`, `medicao_1`, ... | 400 | 200 |
| Dispositivo de segurança | `dispositivo_0`, `dispositivo_1`, ... | — | 200 |
| Não conformidade | `nc_0`, `nc_1`, ... | — | — |

## Implementation Checklist

When implementing this pattern in a new project:

1. **Upload component** — must read `naturalWidth`/`naturalHeight` from the image and pass dimensions to `onPhotoUploaded` callback
2. **Client state** — `Record<string, { width: number; height: number }>` keyed by photo identifier
3. **PDF export** — include `fotoDimensoes` in the API call body
4. **API route** — extract and forward `fotoDimensoes` to the PDF component
5. **PDF component** — interface accepts `fotoDimensoes`, use `calcImageHeight` for every `<PDFImage>`
6. **Fallback** — always handle missing dimensions with a safe default (160px)

## Rules

- Never use hardcoded `height` for `PDFImage` — always calculate from dimensions
- `objectFit: 'contain'` is mandatory to prevent distortion
- Always check dims exist before calling `calcImageHeight` (returns fallback if undefined)
- For single-photo layouts, use wider container (400px) and higher max (450px)
- For multi-photo layouts, use narrower container (200px) and capped max (350px)
