# LotTraveler: Problem specification

## Description

Contains the input & output encodings and describes the properties of "workflow validation and repair" in a formal, tool-agnostic way.
This specification is then used primarily in the master thesis to describe the problem in an unambiguous way, but also to compare and verify the inner workings of the "workflow validation and repair" reasoner implementation.

## Install

- [tla+ toolbox v1.7.1](https://lamport.azurewebsites.net/tla/toolbox.html#obtaining)
- [tla+ community modules v202009162135](https://github.com/tlaplus/CommunityModules/releases/tag/202009162135)
- [tla+ proof system v1.4.5](https://tla.msr-inria.inria.fr/tlaps/content/Download/Binaries.html)

## Running TLA specifications

- The TLA+ specifications can be run from the TLA+ Toolbox GUI, namely from the `ModelCheck` view.
  The toolbox project needs to be configured to evaluate the constant expressions `ValidationTests` and `RepairTests` when run.
  Moreover, the downloaded `CommunityModules.jar` need to be added as an external TLA+ library in the appropriate Toolbox preferences dialog first, under `File > Preferences > TLA+ Preferences > TLA+ library path locations`.

- Alternatively, one may run the test suite `MetaModelReasonerTest` directly via the command line
  `$ java -cp /PATH/TO/CommunityModules.jar:/PATH/TO/toolbox/tla2tools.jar tlc2.TLC MetaModelReasonerTest.tla`
