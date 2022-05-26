# Disregard erroneous paragraph in ASP positive rule definition

The paragraph states how the semantics of a FOL implication `a <- b` are different from the semantics of a NLP rule `a :- b`.
Looking at the rule in isolation, this is not entirely true.
While adding `-b` as a fact does not derive `-a` automatically in ASP, this is due to strongly negated atoms not being linked semantically to their positive counterparts.
Adding the default negation of `b` instead via `:- b`, the NLP properly infers `not a`, as evidenced by the unsatisfiability of the following NLP:

```prolog
a :- b.
:- b.
:- not a.
```

The paragraph should be removed so to not confuse the reader.
Classical (strong) negation is explored in a later subsection in more detail.
