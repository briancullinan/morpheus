# Middleware

Middleware pattern puts functionality in-between scopes.
This allows us to switch out @Before/@After-style 
results without the use of attributes or [Aspects]().

```
           Middleware 1

 In ──────►  DoAThing1  ─────┐
                             │
       ┌──►  DoAThing2 ───┐  │
       │                  │  │
       │   Middleware 2   │  │
       │                  │  │
Out ◄──┼──── DoAnother1 ◄─┘  │
       │                     │
       └──── DoOther2  ◄─────┘
```


Give it a try:



TODO: Show something that express does really neatly.
Adding a little compression, maybe swapping out compression,
alorithms for in game compresion and vice-versa?

