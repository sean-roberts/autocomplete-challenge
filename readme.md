## Autocomplete input challenge

### To Launch:

- `npm install` - if you have not already done so
- `npm start`
- navigate browser to `http://localhost:35472`

### Using the library:
- add `autocomplete-users` attribute to the contenteditable element that resides as the
comment box.


### Decisions Made
- Decided to use usernames as the primary selection method. It is assumed to be
more unique than actual names and would keep the consistency of how users reference
each other.
- Implementation of how we should render/store this data was not in scope, but I
would push that we track the user in the comment by id. On render we pull out the
up-to-date value for the username. Allowing links to not become stale. Note, I updated
the data to included id in the sample data.
- The search suggestion sorting algorithm is not implemented with the scope of this
project. I use a very primitive check to drill down suggestions but I believe proper
suggestions (Levenshtein distance calculation, mispellings, approximate matching, etc.)
would be behind a backend service.
- Responsiveness and mobile readiness did not make it into the work of this phase 1.
- The library is initiated on load - as it assumes the html is ready and available. I think
that is usually a bad practice. But, for the sake of this project, it's not a bad requirement.
Easy to change to have an api to trigger this initialization.


### What I Left Out Of Scope
- Frameworks. This is entirely framework agnostic and can be adapted to any if needed.
- Build process. I could have used Babel, Gulp, LESS, etc. but I felt the scale of
what needed to be done did not warrant that need and would make it a little more complex
than it might need for this.
- The testing has not been set up for this project. Considering how low level some
pieces of the code touch, I would push for some sort of webdriver/selenium based
integration testing to get the interactions properly vetted. Take those tests
and put them on a continuous testing pipeline with SauceLabs to do XBrower regression
testing.
