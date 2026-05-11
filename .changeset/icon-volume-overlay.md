---
"volume-master": minor
---

Overlay volume percent on toolbar icon for the active tab

The browser-action icon now shows the current volume on top of the base
icon when a tab's volume differs from 100%. Mute shows "M" in red, boost
(>100%) shows the percent in amber, and values over 999 clamp to "999+".
Only the active tab gets the overlay; switching tabs reapplies it to
survive service-worker restarts.
