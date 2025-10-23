# Draggable Grading Components Feature - Implementation Summary

## ✅ Features Implemented

### 1. **Drag and Drop Functionality**
- Each grading component is individually draggable in **both Grid and List views**
- Real-time visual feedback during drag operations
- Smooth animations and transitions
- Position persists across page reloads using localStorage
- **Grid View**: Drag entire component cards
- **List View**: Drag component column headers

### 2. **Visual Indicators**
- **Grip Handle Icon** (⋮⋮) on each component (both views)
- **Cursor Changes**:
  - `cursor: grab` when idle
  - `cursor: grabbing` while dragging
- **Visual Feedback**:
  - **Grid View**: 
    - Being dragged: Scale up (105%), shadow glow, primary ring
    - Other components: Fade to 50% opacity
  - **List View**:
    - Being dragged: Brighter background, ring effect
    - Other columns: Fade to 50% opacity
  - Hover: Visual highlight

### 3. **Persistence**
- Component order saved to `localStorage` with key: `component-order-{class_id}`
- Automatically loads saved order on page load
- Falls back to default database order if no saved order exists
- **Works in both Grid and List views**

### 4. **Smooth UX**
- 300ms transitions for smooth animations
- Visual scaling when picked up (Grid view)
- User-select disabled for clean dragging
- No text selection interference
- Consistent order between Grid and List views

---

## 🎨 Visual Design

### **Component States**

**Normal State**:
```
┌─────────────────────────────────┐
│ ⋮⋮ Quizzes          30% [Add] │
│ ────────────────────────────── │
│  [Grade table content]          │
└─────────────────────────────────┘
cursor: grab
shadow: md
```

**While Dragging (Active)**:
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ⋮⋮ Quizzes          30% [Add] ┃ ← Scale 105%, Ring
┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ┃    Shadow XL
┃  [Grade table content]          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
cursor: grabbing
opacity: 50%
```

**Other Components (During Drag)**:
```
┌─────────────────────────────────┐
│ ⋮⋮ Assignments      40% [Add]  │ ← Faded (50%)
│ ────────────────────────────── │
│  [Grade table content]          │
└─────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### **State Management**

```typescript
// Drag and drop state
const [draggedComponent, setDraggedComponent] = useState<number | null>(null)
const [componentOrder, setComponentOrder] = useState<number[]>([])
const [isDragging, setIsDragging] = useState<boolean>(false)
```

### **localStorage Integration**

```typescript
// Load saved order on mount
useEffect(() => {
  const storageKey = `component-order-${classData.class_id}`
  const savedOrder = localStorage.getItem(storageKey)
  
  if (savedOrder) {
    try {
      const parsed = JSON.parse(savedOrder)
      setComponentOrder(parsed)
    } catch (e) {
      // Fallback to default order
      const defaultOrder = classData.gradeComponents.map(c => c.component_id)
      setComponentOrder(defaultOrder)
    }
  } else {
    // Initialize with default order
    const defaultOrder = classData.gradeComponents.map(c => c.component_id)
    setComponentOrder(defaultOrder)
  }
}, [classData.class_id, classData.gradeComponents])

// Save order to localStorage whenever it changes
useEffect(() => {
  if (componentOrder.length > 0) {
    const storageKey = `component-order-${classData.class_id}`
    localStorage.setItem(storageKey, JSON.stringify(componentOrder))
  }
}, [componentOrder, classData.class_id])
```

### **Drag Event Handlers**

```typescript
const handleDragStart = (e: React.DragEvent, componentId: number) => {
  setDraggedComponent(componentId)
  setIsDragging(true)
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
  
  // Visual feedback
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.style.opacity = '0.5'
  }
}

const handleDragEnd = (e: React.DragEvent) => {
  setDraggedComponent(null)
  setIsDragging(false)
  
  if (e.currentTarget instanceof HTMLElement) {
    e.currentTarget.style.opacity = '1'
  }
}

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}

const handleDrop = (e: React.DragEvent, targetComponentId: number) => {
  e.preventDefault()
  
  if (draggedComponent === null || draggedComponent === targetComponentId) {
    return
  }

  const newOrder = [...componentOrder]
  const draggedIndex = newOrder.indexOf(draggedComponent)
  const targetIndex = newOrder.indexOf(targetComponentId)

  // Reorder: remove from old position, insert at new position
  newOrder.splice(draggedIndex, 1)
  newOrder.splice(targetIndex, 0, draggedComponent)

  setComponentOrder(newOrder)
}
```

### **Sorting Components**

```typescript
const getSortedComponents = React.useCallback(() => {
  if (!componentOrder || componentOrder.length === 0) {
    return classData.gradeComponents
  }

  return componentOrder
    .map(id => classData.gradeComponents.find(c => c.component_id === id))
    .filter((c): c is GradeComponent => c !== undefined)
}, [componentOrder, classData.gradeComponents])
```

### **Card Component with Drag Attributes**

```tsx
<Card 
  key={gradeComponent.component_id}
  className={`mb-6 transition-all duration-300 ${
    isBeingDragged ? 'scale-105 shadow-2xl ring-2 ring-primary' : 'shadow-md hover:shadow-lg'
  } ${isDragging && !isBeingDragged ? 'opacity-50' : 'opacity-100'}`}
  draggable
  onDragStart={(e) => handleDragStart(e, gradeComponent.component_id)}
  onDragEnd={handleDragEnd}
  onDragOver={handleDragOver}
  onDrop={(e) => handleDrop(e, gradeComponent.component_id)}
  style={{
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none'
  }}
>
  <CardHeader>
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="flex items-center text-muted-foreground hover:text-primary transition-colors">
          <GripVertical className="h-6 w-6" />
        </div>
        <div>
          <CardTitle className="flex items-center gap-2">
            {gradeComponent.component_name}
            <Badge variant="outline">{gradeComponent.weight_percentage}%</Badge>
          </CardTitle>
        </div>
      </div>
      {/* Buttons */}
    </div>
  </CardHeader>
  {/* Card content */}
</Card>
```

---

## 📊 User Workflow

### **Reordering Components**

```
1. Professor views gradebook in Grid View
   ↓
2. Sees grip handle (⋮⋮) icon on each component
   ↓
3. Hovers over component
   - Cursor changes to "grab" (✋)
   ↓
4. Clicks and holds on component
   - Cursor changes to "grabbing" (✊)
   - Component scales up (105%)
   - Adds shadow and primary ring
   - Other components fade to 50%
   ↓
5. Drags component to new position
   - Real-time visual feedback
   ↓
6. Drops component on target position
   - Components reorder instantly
   - Smooth transition animation
   ↓
7. Order automatically saved to localStorage
   ↓
8. Refreshes page later
   - Custom order persists ✓
```

---

## 🎯 Benefits

### **For Professors**:
1. ✅ Personalize dashboard layout
2. ✅ Prioritize important components
3. ✅ Group related components together
4. ✅ Order persists across sessions
5. ✅ Intuitive drag-and-drop UX
6. ✅ Clear visual feedback

### **For System**:
1. ✅ No database changes needed
2. ✅ localStorage for persistence
3. ✅ Per-class customization
4. ✅ Falls back gracefully
5. ✅ Smooth performance
6. ✅ Native HTML5 drag API

---

## 🚀 Optional Enhancements (Future)

- [ ] **Grid Snapping** - Components snap to grid positions
- [ ] **Undo/Redo** - Revert order changes
- [ ] **Reset to Default** - Button to restore original order
- [ ] **Keyboard Shortcuts** - Arrow keys to reorder
- [ ] **Drag Preview** - Custom drag image
- [ ] **Touch Support** - Mobile drag-and-drop
- [ ] **Animations** - More elaborate transitions
- [ ] **Drag Zones** - Visual drop zones
- [ ] **Bulk Actions** - Move multiple components
- [ ] **Templates** - Save/load custom layouts

---

## 📝 Storage Format

### **localStorage Key**:
```
component-order-{class_id}
```

### **Value Format** (JSON):
```json
[12, 15, 13, 14, 16]
```
Where numbers are `component_id` values in desired order.

### **Example**:
```javascript
localStorage.setItem('component-order-42', '[12, 15, 13, 14, 16]')
```

---

## 🎨 CSS Classes Used

### **Transitions**:
- `transition-all` - Smooth transitions for all properties
- `duration-300` - 300ms transition time

### **Scaling**:
- `scale-105` - Scale up to 105% when dragging

### **Shadows**:
- `shadow-md` - Normal state
- `shadow-lg` - Hover state
- `shadow-2xl` - Dragging state

### **Rings**:
- `ring-2 ring-primary` - 2px primary color ring when dragging

### **Opacity**:
- `opacity-100` - Normal state
- `opacity-50` - Faded state (non-dragged components)

### **Cursors** (inline styles):
- `cursor: grab` - Idle state
- `cursor: grabbing` - Dragging state
- `user-select: none` - Prevent text selection

---

## 🧪 Testing Checklist

- [x] Drag component to new position
- [x] Visual feedback (scale, shadow, ring)
- [x] Cursor changes (grab → grabbing)
- [x] Other components fade during drag
- [x] Drop updates order
- [x] Order saved to localStorage
- [x] Page refresh loads saved order
- [x] Works in Grid view
- [x] Grip icon visible and styled
- [x] Smooth animations (300ms)
- [x] No text selection during drag
- [x] Multiple classes have independent orders
- [x] Fallback to default order if localStorage empty
- [x] Works with all components (attendance, quizzes, etc.)

---

## 💡 Technical Notes

### **Why localStorage?**
- **Pros**:
  - No database schema changes needed
  - Instant persistence
  - Per-user, per-browser customization
  - No API calls required
  - Simple implementation

- **Cons**:
  - Not synced across devices
  - Cleared when browser data is cleared
  - Limited storage (but sufficient for this use case)

### **Why HTML5 Drag API?**
- **Pros**:
  - Native browser support
  - No external dependencies
  - Lightweight and fast
  - Works with mouse and keyboard
  - Standard W3C API

- **Cons**:
  - Limited mobile support (would need touch events)
  - Less control over drag preview
  - Browser-specific behavior differences

---

## 🔍 Browser Compatibility

✅ **Supported**:
- Chrome/Edge 90+
- Firefox 85+
- Safari 14+
- Opera 75+

⚠️ **Limited Support**:
- Mobile browsers (touch events needed)
- Internet Explorer (not supported)

---

## 🎓 Code Quality

- ✅ TypeScript for type safety
- ✅ React hooks (useState, useEffect, useCallback)
- ✅ Proper event handling
- ✅ Clean separation of concerns
- ✅ Memoization for performance
- ✅ Error handling (try-catch for JSON parsing)
- ✅ Fallback mechanisms
- ✅ User-friendly visual feedback

---

**Status**: ✅ **Fully Implemented and Tested**
**Last Updated**: Current Session
**Applies To**: Both Grid View and List View

---

## 📋 **List View Implementation**

### **Visual Design**

**Component Header - Normal State**:
```
┌──────────────────────────────────────────┐
│ ⋮⋮ Quizzes     30%    5 items           │ ← Draggable header
├──────────────────────────────────────────┤
│ Quiz 1 | Quiz 2 | Quiz 3 | Avg | [+]    │
└──────────────────────────────────────────┘
cursor: grab
```

**Component Header - Being Dragged**:
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ⋮⋮ Quizzes     30%    5 items           ┃ ← Bright bg, ring
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Quiz 1 | Quiz 2 | Quiz 3 | Avg | [+]    ┃ ← Brighter
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
cursor: grabbing
```

**Other Components During Drag**:
```
┌──────────────────────────────────────────┐
│ ⋮⋮ Assignments 40%    3 items           │ ← Faded (50%)
├──────────────────────────────────────────┤
│ Assign 1 | Assign 2 | Avg | [+]          │ ← Faded
└──────────────────────────────────────────┘
```

### **Technical Differences from Grid View**

**Grid View**:
- Drags entire `<Card>` component
- Uses `scale-105` for visual lift
- Card-level opacity changes

**List View**:
- Drags `<th>` header with `colSpan`
- All cells in that component's columns fade
- Background color intensifies instead of scaling
- Maintains table structure during drag

### **Implementation Details**

```typescript
// Component header with drag handlers
<th 
  colSpan={group.items.length + 2} 
  className={`transition-all duration-300 ${
    isBeingDragged 
      ? 'bg-primary/30 scale-105 shadow-lg ring-2 ring-primary' 
      : 'bg-gradient-to-r from-primary/10 to-primary/5'
  } ${
    isDragging && !isBeingDragged ? 'opacity-50' : 'opacity-100'
  }`}
  draggable
  onDragStart={(e) => handleDragStart(e, group.gradeComponent.component_id)}
  onDragEnd={handleDragEnd}
  onDragOver={handleDragOver}
  onDrop={(e) => handleDrop(e, group.gradeComponent.component_id)}
  style={{
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none'
  }}
>
  <div className="flex items-center justify-center gap-2">
    <GripVertical className="h-4 w-4" />
    <span>{group.gradeComponent.component_name}</span>
    {/* Badges */}
  </div>
</th>

// All child cells also react to drag state
<TableCell className={`${
  isBeingDragged ? 'bg-primary/20' : 'bg-primary/5'
} ${
  isDragging && !isBeingDragged ? 'opacity-50' : 'opacity-100'
}`}>
  {/* Cell content */}
</TableCell>
```

### **User Experience in List View**

1. ✅ Drag component header to reorder columns
2. ✅ All related cells (items, average, add button) move together
3. ✅ Separator columns remain fixed between components
4. ✅ Visual feedback shows entire column group
5. ✅ Order syncs with Grid view automatically
6. ✅ Smooth transitions maintain readability

---

## 🔄 **View Synchronization**

### **How It Works**:
```
1. Professor reorders components in Grid View
   ↓
2. Order saved to localStorage
   ↓
3. Switch to List View
   ↓
4. List View reads same localStorage key
   ↓
5. Components appear in same order ✓
```

### **Shared State**:
- Both views use `getSortedComponents()`
- Same `componentOrder` state array
- Same localStorage key
- Same drag handlers
- **Result**: Consistent ordering across views

---

