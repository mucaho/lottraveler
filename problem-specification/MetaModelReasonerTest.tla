----------------------- MODULE MetaModelReasonerTest -----------------------
EXTENDS WorkflowValidationTest, WorkflowRepairTest
LOCAL INSTANCE TLC

ASSUME PrintT(<<ValidationTests, RepairTests>>)
=============================================================================
