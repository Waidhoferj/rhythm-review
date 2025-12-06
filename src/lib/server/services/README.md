# Item Selection Strategies

The item selection system uses a strategy pattern to allow different algorithms for choosing the next move or pattern to practice.

## Available Strategies

### Sequential
Practice items in order, one after another. When you reach the end, it loops back to the beginning.

```typescript
import { getNextItem } from './item-selection';

const nextItem = await getNextItem(userId, practiceSetId, 'sequential');
```

### Random
Selects items completely randomly from the practice set.

```typescript
const nextItem = await getNextItem(userId, practiceSetId, 'random');
```

### Weighted Random
Randomly selects items, but gives more weight to items you struggle with. Items with lower success rates appear more frequently.

```typescript
const nextItem = await getNextItem(
    userId, 
    practiceSetId, 
    'weighted-random',
    sessionId  // Required for tracking success rates
);
```

### SM-2 (Spaced Repetition)
Uses the SM-2 algorithm to schedule reviews based on your performance. Items due for review get priority.

```typescript
const nextItem = await getNextItem(userId, practiceSetId, 'sm2');
```

### Repeat Failed
Immediately retries items you fail until you succeed, then moves to the next item sequentially.

```typescript
const nextItem = await getNextItem(
    userId,
    practiceSetId,
    'repeat-failed',
    undefined,  // sessionId (optional)
    {           // previousItem (required for this strategy)
        itemType: 'move',
        itemId: 123,
        success: false
    }
);
```

## Usage Example

```typescript
import { getNextItem, getAllStrategyInfo } from '$lib/server/services/item-selection';
import { recordExecution } from '$lib/server/services/practice-sessions';
import { updateSM2Data } from '$lib/server/services/sm2-service';
import { swipeToQuality } from '$lib/utils/sm2-algorithm';

// Start a practice session
const session = await startSession(userId, practiceSetId);

// Get the first item using your chosen strategy
let currentItem = await getNextItem(userId, practiceSetId, 'sm2', session.id);

// User practices and swipes
const success = true; // or false based on user swipe

// Record the execution
await recordExecution(session.id, 'move', currentItem.id, success);

// Update SM-2 data if using SM-2 strategy
if (strategyName === 'sm2') {
    const quality = swipeToQuality(success);
    await updateSM2Data(userId, 'move', currentItem.id, quality);
}

// Get next item with context
const nextItem = await getNextItem(
    userId,
    practiceSetId,
    'sm2',
    session.id,
    {
        itemType: 'move',
        itemId: currentItem.id,
        success
    }
);
```

## Getting Strategy Information

```typescript
import { getAllStrategyInfo, getStrategyInfo } from '$lib/server/services/item-selection';

// Get all available strategies
const allStrategies = getAllStrategyInfo();
// Returns: [{ name: 'sequential', description: '...' }, ...]

// Get info about a specific strategy
const sm2Info = getStrategyInfo('sm2');
console.log(sm2Info.name); // 'sm2'
console.log(sm2Info.description); // 'Spaced repetition algorithm...'
```

## Creating Custom Strategies

You can add new strategies by implementing the `SelectionStrategy` interface:

```typescript
import type { SelectionStrategy, SelectionContext } from './selection-strategies';

export class MyCustomStrategy implements SelectionStrategy {
    name = 'my-custom';
    description = 'My custom selection algorithm';

    selectNext(context: SelectionContext): DanceMove | Pattern | null {
        // Your selection logic here
        // Access context.availableItems, context.previousItem, context.sessionHistory
        return context.availableItems[0].item;
    }
}

// Register it in SELECTION_STRATEGIES in selection-strategies.ts
```
