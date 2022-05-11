# DI (Dependency Injection)

Dependency injection takes a whole feature set
and provides those features to a module.

```
       Module 1
T1  P1                   P1  T1
 ┌─┬───►  Self─►DoAThing1 ─┬─┐
 │ │                       │ │
 ├─┼───►  Self─►DoAThing2 ─┼─┤
 │ │                       │ │
 │ │   Production (P1)     │ │
 │ │                       │ │
 │ ├───── DoAThing1   ◄────┤ │
 │ │                       │ │
 │ └───── DoAThing2   ◄────┴─┤
 │                           │
 │     Test Module (T1)      │
 │                           │
 ├─────── DoTest1     ◄──────┤
 │                           │
 └─────── DoTest2     ◄──────┘
```


If you want to change whole feature sets, 
a different set can be provided
through the same standard interface.




Give it a try!


TODO: Need something that demonstrates how an
Action can be performed locally, or singly, 
in a web-worker, and also in paralell, in cloud.
Using the same code to right ->

