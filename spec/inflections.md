Now that the inflections Lambda has been implemented, create the UI.
First, validate the route against the OpenAPI spec and verify that all responses are handled as intended.
Specifically, check for proper handling of user errors, i.e. the 400 response documented in the spec.
Adjust the route if required.

Then, create the page. The user should be able to input a single word.
The word should be retrieved, and in the case of a success, the inflected forms should be displayed in a table.
Display the root word (infinitive/nominative) above the table.
For both noun-like and verb-like words, display two columns, singular and plural.
For noun-like words, display the nominative in the first row.
For verb-like words, display the inflections in the following order: 1st person, 2nd person, 3rd person.
In the case of an error, display an appropriate error message (user error vs system error).

Finally, ensure the page is styled appropriately and is responsive.
