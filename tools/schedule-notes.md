# Schedule notes

Decisions about how channels are scheduled, to carry over when the schedule engine is reworked.

## Soaps channel (decided 2026-11-11)

* Every soap we track goes on the Soaps channel, as well as on its own broadcaster's channel (BBC or ITV).
* The big soaps keep their fixed evening slots: Neighbours 13:45 and 17:35, Crossroads 17:00, Home and Away 18:05,
  Emmerdale 19:00, EastEnders 19:30, Coronation Street 20:00.
* They are **also** in the daytime and late-night mix, so tuning in to Soaps at any hour can land on EastEnders,
  Neighbours and the rest. Before this, only the smaller soaps and Crossroads were in the daytime mix.
* Known trade-off: EastEnders, Neighbours and Crossroads have far more episodes than the small soaps, so they fill most
  of the unscheduled hours. When the schedule engine is rebuilt, give each soap an even share of those hours (rotate by
  show, then by episode) instead of picking from one big pool.
