**Task:** Create a basic spaced repetition study feature using the `ts-fsrs` library.

**1. Data Schema Enrichment**
Discard the existing `flashcard_progress` table. Create new tables for `Card` and `ReviewLog` that strictly map to the `ts-fsrs` interfaces.

- **Card Table:** Must include `due` (Date), `stability` (number), `difficulty` (number), `elapsed_days` (number), `scheduled_days` (number), `reps` (number), `lapses` (number), `state` (State enum: New, Learning, Review, Relearning), and `last_review` (Date).
- **ReviewLog Table:** Must include `rating` (Rating enum: Again, Hard, Good, Easy), `scheduled_days` (number), `elapsed_days` (number), `review` (Date), and `state` (State enum).
- **Relationship:** Each `Card` belongs to a `Flashcard` entity. Each `ReviewLog` belongs to a `Card`.

**2. FSRS Configuration & Parameters**
When initializing the FSRS algorithm, use the `generatorParameters` function or a `Parameters` object. Ensure the following defaults from the documentation are accessible and can be overridden by future profile settings:

- `request_retention`: Default to `0.9` (This represents the probability of recall the user aims for).
- `maximum_interval`: Default to `36500` days.
- `w`: Use the default FSRS weights (a 17-element array).
- `enable_fuzz`: Set to `true` (This prevents "card clusters" by adding small random offsets to intervals).

**3. Study Logic & UI Flow**

- **Dashboard:** On login, query the database for cards where `due <= current_date`. If the count > 0, display a "Study" button prominently.
- **Session Initialization:** When a session starts, fetch the "due" cards. Allow for a `limit` parameter (e.g., "Daily Study Limit") to restrict the batch size.
- **The Review Loop:** \* For the current card, use `fsrs.repeat(card, now)` to generate four `SchedulingInfo` objects (one for each Rating: Again, Hard, Good, Easy).
- The UI should display these four options with their corresponding "Next Review" intervals (calculated from the `scheduled_days` in the result).
- Upon user selection, update the `Card` state and create a new `ReviewLog` entry in a single transaction.

**4. Code Reference**
When implementing the service, remember that `ts-fsrs` functions are pure. You must pass the current `Card` object and the current `Date` to the scheduler to receive the updated card state.
