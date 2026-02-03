# HRMS Frontend Design System

## Typography Scale

### Font Families
- **Sans**: Inter (primary)
- **Serif**: Source Serif 4 (headings, emphasis)
- **Mono**: JetBrains Mono (code, data)

### Font Sizes
- **xs**: 0.75rem (12px) - Small labels, captions
- **sm**: 0.875rem (14px) - Body text, form labels
- **base**: 1rem (16px) - Default body text
- **lg**: 1.125rem (18px) - Subheadings
- **xl**: 1.25rem (20px) - Section headings
- **2xl**: 1.5rem (24px) - Page headings
- **3xl**: 1.875rem (30px) - Hero headings
- **4xl**: 2.25rem (36px) - Main titles

### Font Weights
- **normal**: 400 - Body text
- **medium**: 500 - Emphasis, labels
- **semibold**: 600 - Headings, buttons
- **bold**: 700 - Strong emphasis

### Line Heights
- **tight**: 1.25 - Headings
- **normal**: 1.5 - Body text
- **relaxed**: 1.75 - Long-form content

## Color Palette

### Primary Colors
- **Blue-600**: #1e40af - Primary actions, links
- **Blue-700**: #1e3a8a - Hover states
- **Blue-50**: #eff6ff - Light backgrounds

### Semantic Colors
- **Success**: #10b981 (Green-500)
- **Warning**: #f59e0b (Amber-500)
- **Error**: #ef4444 (Red-500)
- **Info**: #3b82f6 (Blue-500)

### Neutrals
- **Gray-50**: #f9fafb - Light backgrounds
- **Gray-100**: #f3f4f6 - Borders, dividers
- **Gray-200**: #e5e7eb - Disabled states
- **Gray-400**: #9ca3af - Placeholder text
- **Gray-600**: #4b5563 - Secondary text
- **Gray-700**: #374151 - Primary text
- **Gray-900**: #111827 - Headings

## Spacing System

Use Tailwind's default spacing scale (0.25rem base):
- **xs**: 0.5rem (8px)
- **sm**: 0.75rem (12px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)
- **3xl**: 4rem (64px)

## Component Patterns

### Buttons

#### Primary Button
```tsx
<Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm">
  Primary Action
</Button>
```

#### Secondary Button
```tsx
<Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-6 py-2.5 rounded-lg">
  Secondary Action
</Button>
```

#### Ghost Button
```tsx
<Button variant="ghost" className="text-gray-700 hover:bg-gray-100 font-medium px-4 py-2 rounded-lg">
  Ghost Action
</Button>
```

### Cards

#### Standard Card
```tsx
<Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
  <CardHeader className="pb-3">
    <CardTitle className="text-lg font-semibold text-gray-900">Title</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content */}
  </CardContent>
</Card>
```

#### Stats Card
```tsx
<Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
  <CardContent className="pt-6">
    <div className="text-3xl font-bold text-blue-900">{value}</div>
    <p className="text-sm text-blue-700 mt-1">{label}</p>
  </CardContent>
</Card>
```

### Form Elements

#### Input Field
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">Label</label>
  <Input 
    className="h-11 px-4 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    placeholder="Enter value..."
  />
  <p className="text-xs text-gray-500">Helper text</p>
</div>
```

#### Select Field
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">Label</label>
  <Select>
    <SelectTrigger className="h-11 px-4 rounded-lg border-gray-300">
      <SelectValue placeholder="Select option..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1">Option 1</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Tables

```tsx
<Table className="border border-gray-200 rounded-lg">
  <TableHeader className="bg-gray-50">
    <TableRow>
      <TableHead className="font-semibold text-gray-700">Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell className="text-gray-900">Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Badges

```tsx
<Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-medium">
  Active
</Badge>

<Badge variant="outline" className="border-gray-300 text-gray-700">
  Pending
</Badge>

<Badge className="bg-green-100 text-green-800 border-green-200">
  Success
</Badge>
```

## Layout Patterns

### Page Layout
```tsx
<div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Page header */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Page Title</h1>
      <p className="text-gray-600 mt-2">Description</p>
    </div>
    
    {/* Main content */}
    <div className="space-y-6">
      {/* Content sections */}
    </div>
  </div>
</div>
```

### Dashboard Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

## Animation & Transitions

- **Hover states**: `hover:scale-105 transition-transform duration-200`
- **Fade in**: `animate-in fade-in duration-300`
- **Slide in**: `animate-in slide-in-from-bottom-4 duration-300`
- **Shadow transition**: `transition-shadow duration-200`

## Accessibility

- Always include proper labels for form elements
- Use semantic HTML elements
- Ensure sufficient color contrast (WCAG AA minimum)
- Include focus states for interactive elements
- Use aria-labels for icon-only buttons

## Best Practices

1. **Consistency**: Use the same spacing, colors, and components throughout
2. **Hierarchy**: Use size, weight, and color to establish visual hierarchy
3. **Whitespace**: Don't be afraid of empty space - it improves readability
4. **Feedback**: Always provide visual feedback for user actions
5. **Loading states**: Show loading indicators for async operations
6. **Error handling**: Display clear, actionable error messages
7. **Mobile-first**: Design for mobile and enhance for larger screens
8. **Performance**: Optimize images and minimize re-renders

## Common Patterns

### Empty States
```tsx
<div className="text-center py-12">
  <Icon className="mx-auto h-12 w-12 text-gray-400" />
  <h3 className="mt-4 text-lg font-medium text-gray-900">No data yet</h3>
  <p className="mt-2 text-sm text-gray-500">Get started by creating a new item.</p>
  <Button className="mt-6">Create New</Button>
</div>
```

### Loading States
```tsx
<div className="flex items-center justify-center py-12">
  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
  <span className="ml-3 text-gray-600">Loading...</span>
</div>
```

### Error States
```tsx
<div className="rounded-lg bg-red-50 border border-red-200 p-4">
  <div className="flex">
    <AlertCircle className="h-5 w-5 text-red-600" />
    <div className="ml-3">
      <h3 className="text-sm font-medium text-red-800">Error occurred</h3>
      <p className="mt-1 text-sm text-red-700">Error message here</p>
    </div>
  </div>
</div>
```
