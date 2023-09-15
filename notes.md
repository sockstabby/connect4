notes

system relies on a quick twice to remove a animated token

1. playerA click creates the animation item.

   current is null

   notify the other player of the move

   increment plays

   playerB creates the animation item because it is null for it

both player A and B have a current token
plays should be incremented in both so its player B's turn

2.  player B clicks once to delete animation item

    ***

    current is not null so we move it to state and delete the current token

    current is null

    !!!! somehow we need to tell player A to delete its token and replace it with one thats in state

    second click creates the animation item.

    notify the other player of the move

        Player A creates a animation item because its null

both player A and B have a current token
plays should be incremented in both so its player B's turn

rinse lather repeat
