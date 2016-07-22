## Autocomplete input challenge

### To Launch:

- `npm install` - if you have not already done so
- `npm start`
- navigate browser to `http://localhost:35472`


### To Test:
- `npm install` - if you have not already done so
- `npm test`


### Considerations Made
- Decided to use usernames as the primary selection method. It is assumed to be
more unique than actual names and would keep the consistency of how users reference
each other.
- Implementation of how we should render/store this data was not in scope, but I
would push that we track the user in the comment by id. On render we pull out the
up-to-date value for the username. Allowing links to not become stale.
- The search suggestions sorting algorithm is not implemented in the scope of this
project. I use a very primitive check to drill down suggestions but I believe proper
suggestions (Levenshtein distance calculation, mispellings, approximate matching, etc.)
would be behind a service backend.
