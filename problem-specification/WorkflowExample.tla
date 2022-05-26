-------------------------- MODULE WorkflowExample --------------------------

WorkflowExample == INSTANCE WorkflowExample WITH
    Tasks <-
    {   [ name |-> "EVI", repeatable |-> FALSE, group |-> "non-destructive" ]
    ,   [ name |-> "SEM", repeatable |-> FALSE, group |-> "non-destructive" ]
    ,   [ name |-> "XRAY_MIC", repeatable |-> FALSE, group |-> "non-destructive" ]
    ,   [ name |-> "EPT", repeatable |-> FALSE, group |-> "non-destructive" ]

    ,   [ name |-> "DECAP", repeatable |-> FALSE, group |-> "destructive" ]
    ,   [ name |-> "IVI", repeatable |-> FALSE, group |-> "destructive" ]

    ,   [ name |-> "STRIP", repeatable |-> TRUE, group |-> "destructive" ]
    ,   [ name |-> "XRAY_SPEC", repeatable |-> TRUE, group |-> "destructive" ]
    ,   [ name |-> "SAM", repeatable |-> TRUE, group |-> "destructive" ]
    ,   [ name |-> "TEM", repeatable |-> TRUE, group |-> "destructive" ]
    },
    Connections <-
    {   [ name |-> "has_predecessor", srcName |-> "SEM", dstName |-> "EVI" ]
    ,   [ name |-> "has_predecessor", srcName |-> "XRAY_MIC", dstName |-> "EVI" ]
    ,   [ name |-> "has_predecessor", srcName |-> "EPT", dstName |-> "SEM" ]
    ,   [ name |-> "has_predecessor", srcName |-> "EPT", dstName |-> "XRAY_MIC" ]

    ,   [ name |-> "has_predecessor", srcName |-> "DECAP", dstName |-> "EPT" ]
    ,   [ name |-> "has_mandatory_successor", srcName |-> "DECAP", dstName |-> "IVI" ]
    ,   [ name |-> "has_mandatory_predecessor", srcName |-> "IVI", dstName |-> "DECAP" ]
    
    ,   [ name |-> "has_mandatory_predecessor", srcName |-> "STRIP", dstName |-> "IVI" ]
    ,   [ name |-> "has_mandatory_predecessor", srcName |-> "XRAY_SPEC", dstName |-> "STRIP" ]
    ,   [ name |-> "has_mandatory_predecessor", srcName |-> "SEM", dstName |-> "STRIP" ]
    ,   [ name |-> "has_mandatory_predecessor", srcName |-> "TEM", dstName |-> "STRIP" ]
    ,   [ name |-> "has_predecessor", srcName |-> "SEM", dstName |-> "XRAY_SPEC" ]
    ,   [ name |-> "has_predecessor", srcName |-> "TEM", dstName |-> "XRAY_SPEC" ]
    },
    Workflow <-
    << "EVI", "EPT", "DECAP", "IVI", "STRIP", "SEM", "STRIP", "XRAY_SPEC", "TEM" >>

=============================================================================
