# Windows native project picker

This fork adds a native Electron folder picker for projects. The selected absolute Windows path is kept in the private project-path index (`usr/projects/.a0-external-projects.json`), while project metadata remains in the selected folder under `.a0proj`.

The change is intentionally isolated to the Windows-native integration. Existing projects under `usr/projects` continue to work unchanged. Deleting an external project removes only its Agent Zero registration; it does not delete the selected folder.

After updating from upstream, reapply the changes in this document's commit (Electron IPC, project UI, and `helpers/projects.py`) and resolve conflicts if upstream changed those same areas. The native fork has no Docker sandbox, so only choose folders the agent is allowed to access.
