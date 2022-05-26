----------------------------- MODULE Utilities -----------------------------
EXTENDS FiniteSetsExt, Sequences, SequencesExt, Functions, Bags, Relation, Naturals, Integers

(***************************)
(*Utility helpers for Sets *)
(***************************)

ChooseOne(S, P(_)) == CHOOSE x \in S : P(x) /\ \A y \in S : P(y) => y = x

ChooseOrDefault(S, P(_), D) == IF \E s \in S : P(s)
    THEN
        CHOOSE s \in S : P(s)
    ELSE
        D

AnyOf(S) == CHOOSE s \in S : TRUE

Min(S) == CHOOSE min \in S : \A other \in S : min =< other
Max(S) == CHOOSE max \in S : \A other \in S : max >= other

Abs(x) == Max({x, -x})

(********************************)
(*Utility helpers for Functions *)
(********************************)

DOM(f) == DOMAIN f
RAN(f) == { f[x] : x \in DOMAIN f }

RestrictRange(f,S) ==
    LET
        DomainForRange == { x \in DOMAIN f : f[x] \in S }
    IN
        Restrict(f, DomainForRange)

RestrictRangeWithPredicate(f, P(_)) ==
    LET
        DomainForRange == { x \in DOMAIN f : P(f[x]) }
    IN
        Restrict(f, DomainForRange)

(********************************)
(*Utility helpers for Sequences *)
(********************************)
Indexes(xs, x) == { i \in DOMAIN xs : xs[i] = x }

Index(xs, x) ==
    IF
        IsInjective(xs) \* index non-sensical in non-injective sequences
    THEN
        CHOOSE i \in 1..Len(xs) : xs[i] = x
    ELSE
        CHOOSE b \in BOOLEAN : b \notin BOOLEAN

FirstIndex(xs, x) ==
    IF
        \E i \in 1..Len(xs) : xs[i] = x \* index non-sensical iff x not in xs
    THEN
        CHOOSE i \in 1..Len(xs) :
            /\ xs[i] = x
            /\ \A j \in 1..Len(xs) : xs[j] = x => j >= i
    ELSE
        CHOOSE b \in BOOLEAN : b \notin BOOLEAN

LastIndex(xs, x) ==
    IF
        \E i \in 1..Len(xs) : xs[i] = x \* index non-sensical iff x not in xs
    THEN
        CHOOSE i \in 1..Len(xs) :
            /\ xs[i] = x
            /\ \A j \in 1..Len(xs) : xs[j] = x => j <= i
    ELSE
        CHOOSE b \in BOOLEAN : b \notin BOOLEAN

Count(xs, x) ==
    LET
        Cnt[i \in 1..Len(xs)] ==
            LET
                Eq == IF xs[i] = x THEN 1 ELSE 0
            IN
                IF i = 1 THEN Eq ELSE Eq + Cnt[i - 1]
    IN
        IF xs = <<>> THEN 0 ELSE Cnt[Len(xs)]

SumSeq(xs) == ReduceSeq(LAMBDA x, acc: acc + x, xs, 0)

ReduceSeqPairs(op(_, _), xs, acc) ==
    LET ReduceSeqPairs[i \in 1..Len(xs)] ==
        IF i = 2
        THEN op(<<xs[i-1], xs[i]>>, acc)
        ELSE op(<<xs[i-1], xs[i]>>, ReduceSeqPairs[i - 2])
    IN
        IF xs = <<>> \/ Len(xs) % 2 # 0 THEN acc ELSE ReduceSeqPairs[Len(xs)]

\* see https://learntla.com/tla/functions/
PermutationKey(n) == {key \in [1..n -> 1..n] : Range(key) = 1..n}
PermutationsOf(T) == { [x \in 1..Len(T) |-> T[P[x]]] : P \in PermutationKey(Len(T))}

(***************************)
(*Utility helpers for Bags *)
(***************************)

SeqToBag(xs) == [x \in RAN(xs) |-> Count(xs, x)]

(********************************)
(*Utility helpers for Relations *)
(********************************)

Is2Acyclic(R, S) == \A x \in S : ~(\E y \in S : x # y /\ R[x,y] /\ R[y,x])

=============================================================================
