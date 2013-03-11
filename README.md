##We are refactoring!!!

- this is a fork for NSS
- work done by Amanda McCadams
- and
- Christopher Fryman

####Refactoring work done

-"clicker" and "win per" no longer global functions, removed global functions ("league array" "results array" and "sched" are local copies of server data)

-scores automatically updating properly (the biggest thing we did)

-separated js and html page and reorganized js file in a logical manner

-form validation prevents team creation if incomplete

####Not addressed:

-deleting a team from middle of array

-score validation and ties


##Dustin and Shay's readme

####Phase 1

-using Bootstrap - done.

-min/max team limits - in place. Season can't start without at least 4 teams, trying to add an 8th team will bring up an alert telling you league is full.

-add teams - working.

-save team info to server - working.

-show team info on hover - working.

####Phase 2

-uses pre-defined schedule; differentiates automatically depending on league size. Accounts for bye week. Working.

-capture scores by week: working. 

*	On saving scores, Schedule and save scores modal update with MANUAL page refresh. Work in progress.

-Win/Loss calculated automatically on score entry, standings update dynamically without manual refresh.

-Standings sortable by column by manually clicking table head.

##WHAT ISN'T WORKING --

*	After saving a round of scores, you __need to manually refresh page__. Everything is saved properly, but schedule table and save scores modal will not be properly updated until the next manual page refresh. 

*	If you delete a team from the middle of the teams list, score assignments will be off. Just don't delete a team from middle of field.

*	Validation not preventing form submit. 

*	Score submit form has no current validation; does not prevent ties.
