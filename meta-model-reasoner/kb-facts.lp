%%%
% list of all tasks:
%
% non-destructive group of tasks - any task from this group may come before any task from destructive group
% destructive group of tasks - any task from this group may come after any task from non-destructive group
%
% list any task that may come after another task
%   the predecessor (if present) must be done before successor task (if present)
% list any task that must come before another task
%   the predecessor task must be done before the sucessor task
%   predecessor task must be present for the sucessor task to be executed
% list any tasks that must come in tandem
%
% all tasks are non-repeatable by default, unless otherwise noted
%%%

task("EVI").
group_non_destructive(task("EVI")).

task("SEM").
group_non_destructive(task("SEM")).
has_predecessor(task("SEM"), task("EVI")).

task("XRAY_MIC").
group_non_destructive(task("XRAY_MIC")).
has_predecessor(task("XRAY_MIC"), task("EVI")).

task("EPT").
group_non_destructive(task("EPT")).
has_predecessor(task("EPT"), task("SEM")).
has_predecessor(task("EPT"), task("XRAY_MIC")).

task("DECAP").
group_destructive(task("DECAP")).
has_predecessor(task("DECAP"), task("EPT")).
has_mandatory_successor(task("DECAP"), task("IVI")).

task("IVI").
group_destructive(task("IVI")).
has_mandatory_predecessor(task("IVI"), task("DECAP")).

task("STRIP").
group_destructive(task("STRIP")).
repeatable(task("STRIP")).
has_mandatory_predecessor(task("STRIP"), task("IVI")).

task("XRAY_SPEC").
group_destructive(task("XRAY_SPEC")).
repeatable(task("XRAY_SPEC")).
has_mandatory_predecessor(task("XRAY_SPEC"), task("STRIP")).

task("SAM").
group_destructive(task("SAM")).
repeatable(task("SAM")).
has_mandatory_predecessor(task("SAM"), task("STRIP")).
has_predecessor(task("SAM"), task("XRAY_SPEC")).

task("TEM").
group_destructive(task("TEM")).
repeatable(task("TEM")).
has_mandatory_predecessor(task("TEM"), task("STRIP")).
has_predecessor(task("TEM"), task("XRAY_SPEC")).
