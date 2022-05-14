/*
Powershell has this concept that everything is an object.
I should expand on that, everything is a template?

Somehting like writing 
tostring
.string
+ ""
string.string
tostring()
toString()

If all of these things can be detected by syntax completion
how many 1,000s of hours will we waste on syntax completion
instead of just taking these common directives entirely
out of the language?

TODO: need a warning with the Quine system for taking
a string of a function. Otherwise assume they meant
tostring by default and call it nomatter if it has
parens() for a function call, transorms all string
related syntax to `left + ''` in any language.

Thats the transformer, still need a utility to use it.
I was thinking something along the lines of LINQ and
SQL injection. demonstrate how parameterized queries
are generated lazily by LINQ query code and evaluated
on usage, this translates to either SQL or ADO.


*/


