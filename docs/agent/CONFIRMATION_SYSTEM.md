# Confirmation Dialog System

An elegant, context-based confirmation dialog system that eliminates the need for state management in components that
need user confirmation.

## Architecture

This implementation follows React composition patterns and best practices:

- **Context Provider Pattern**: Lifts dialog state out of consuming components
- **Imperative API**: Simple `useConfirm()` hook for easy usage
- **Decoupled State Management**: Dialog state is managed entirely by the provider
- **Async Support**: Handles async operations with loading states automatically

## Setup

The `ConfirmationProvider` is already added to the root layout in `src/app/layout.tsx`:

```tsx
<ConfirmationProvider>
    {/* Your app content */}
</ConfirmationProvider>
```

## Usage

### Basic Example

```tsx
import {useConfirm} from "@/components/ui/confirmation-provider";

function MyComponent() {
    const confirm = useConfirm();

    const handleDelete = (item: Item) => {
        confirm({
            title: "Delete Item",
            description: `Are you sure you want to delete "${item.name}"?`,
            confirmText: "Delete",
            confirmVariant: "destructive",
            onConfirm: async () => {
                await deleteItem(item.id);
                toast.success("Item deleted!");
            },
        });
    };

    return <Button onClick={() => handleDelete(item)}>Delete</Button>;
}
```

### Advanced Example with JSX Description

```tsx
const handleDangerousAction = () => {
    confirm({
        title: "Dangerous Action",
        description: (
            <>
                This will permanently delete <strong>all your data</strong>.
                This action cannot be undone.
            </>
        ),
        confirmText: "I understand, delete everything",
        cancelText: "Keep my data",
        confirmVariant: "destructive",
        onConfirm: async () => {
            await performDangerousAction();
        },
    });
};
```

### Error Handling

The provider automatically handles errors from async `onConfirm` handlers. If an error is thrown:

1. The dialog stays open (so users can retry)
2. The loading state is cleared
3. The error is re-thrown for you to handle

```tsx
confirm({
    title: "Save Changes",
    description: "Save your changes?",
    onConfirm: async () => {
        try {
            await saveChanges();
            toast.success("Saved!");
        } catch (error) {
            toast.error("Failed to save. Please try again.");
            // Error is caught here, but dialog stays open for retry
        }
    },
});
```

## API Reference

### `useConfirm()`

Returns a function that shows a confirmation dialog.

### Confirmation Options

| Property         | Type                                                 | Required | Default         | Description                     |
|------------------|------------------------------------------------------|----------|-----------------|---------------------------------|
| `title`          | `string`                                             | ✓        | -               | Dialog title                    |
| `description`    | `string \| React.ReactNode`                          | ✓        | -               | Dialog description (can be JSX) |
| `confirmText`    | `string`                                             |          | `"Confirm"`     | Text for confirm button         |
| `cancelText`     | `string`                                             |          | `"Cancel"`      | Text for cancel button          |
| `confirmVariant` | `"default" \| "destructive" \| "outline" \| "ghost"` |          | `"destructive"` | Button style variant            |
| `onConfirm`      | `() => void \| Promise<void>`                        | ✓        | -               | Function to call when confirmed |

## Benefits Over Direct Dialog Usage

### Before (with direct ConfirmationDialog)

```tsx
function MyComponent() {
    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            await deleteItem(itemToDelete.id);
            toast.success("Deleted!");
            setItemToDelete(null);
        } catch (error) {
            toast.error("Failed");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Button onClick={() => setItemToDelete(item)}>Delete</Button>
            <ConfirmationDialog
                open={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleDelete}
                title="Delete Item"
                description={`Delete "${itemToDelete?.name}"?`}
                isLoading={isDeleting}
            />
        </>
    );
}
```

### After (with useConfirm hook)

```tsx
function MyComponent() {
    const confirm = useConfirm();

    const handleDelete = (item: Item) => {
        confirm({
            title: "Delete Item",
            description: `Delete "${item.name}"?`,
            onConfirm: async () => {
                await deleteItem(item.id);
                toast.success("Deleted!");
            },
        });
    };

    return <Button onClick={() => handleDelete(item)}>Delete</Button>;
}
```

**Key improvements:**

- ✅ No state management needed
- ✅ No loading state tracking
- ✅ Cleaner, more declarative code
- ✅ Easier to test
- ✅ Less boilerplate (60% less code)

## Design Patterns Used

This implementation follows best practices from `.github/skills/composition-patterns/`:

1. **Lift State into Provider Components** - Dialog state is managed by the provider, not individual components
2. **Decouple State Management from UI** - Components don't know how confirmation state is managed
3. **Generic Context Interfaces** - The `useConfirm` hook provides a simple, reusable interface

## Real-World Example

See `src/components/flashcards/deck-management.tsx` for a complete example of multiple confirmation dialogs in a single
component without any dialog-related state management.

