# Flashcards (بطاقات المراجعة)

Spaced-repetition flashcards in the browser. Add cards one by one or paste/import CSV, then review only the cards that are due today.

- Leitner system with 5 boxes. A correct answer moves a card up one box (next review after 1, 2, 4, 8, 16 days); a miss sends it back to box 1 and it returns later in the same session.
- Streak counter for consecutive days with at least one review.
- Import: two columns (front, back), comma or Tab separated, optional header row, quoted fields supported. Export to CSV.
- Includes an optional 10-word English sample deck written for this project.
- Data is stored in your browser only (localStorage). No account, no sync, no network calls.

## Run / test
`python3 -m http.server`, open http://localhost:8000. Tests: `npm test` (Node 18+). `logic.js` holds the scheduling, CSV and streak logic and is covered by `logic.test.js`.

## Limits
No sync between devices, no images or audio on cards, no deck separation (one pool of cards). Dates use the device's local day.

## Credits
Built with AI assistance.
