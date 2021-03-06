## Autocomplete input challenge

### To Launch:

- `npm install` - if you have not already done so
- `npm start`
- navigate browser to `http://localhost:35472`

### Using the library:
- `window.autocomplete` is globally available when you add the library to a page. Using the
`window.autocomplete.init( {ContentEditableNode} )` function will initiate the autocomplete bindings.
- Users simply need to type `@` then the user they are trying to match.


### Decisions Made
- We are using a contenteditable element as the base for our text editing. What it allowed that
textarea or input[type=text] did not, was the ability to markup elements inside of itself. This
allows us to style the elements and identify the user tags when we process the content on the backend.
- Decided to use usernames as the primary selection method. It is assumed to be
more unique than actual names and would keep the consistency of how users reference
each other. Meaning, regardless of how you searched for your suggestion, you will see the
username filled into the content when selected.
- Implementation of how we should render/store this data was not in scope, but I
would push that we track the user in the comment by id. On render we pull out the
up-to-date value for the username. Allowing links to not become stale. Note, I updated
the data to included id in the sample data.
- The search suggestion sorting algorithm is not implemented with the scope of this
project. I use a very primitive check to drill down suggestions but I believe proper
suggestions (Levenshtein distance calculation, mispellings, approximate matching, etc.)
would be behind a backend service.
- Responsiveness and mobile readiness did not make it into the work of this phase 1.


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
