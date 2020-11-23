---
name: Bug report
about: Create a report to help us improve

---

**Park**
Which park/resort has this issue?

**Context**
- themeparks version used:
- Operating System:

How to find your themeparks version:
Linux: npm list --depth=0 | grep themeparks
Windows CMD: npm list | find "themeparks"
PowerShell: npm list | sls themeparks

**Describe the bug**
A clear and concise description of what the bug is. Please provide sample code if you feel it is relevant.

**Output**
Sample output with NODE_DEBUG=themeparks environment variable set.
Eg. if this is an issue with a specific park, run the following to run an online test of that park with debugging enabled:
PARKID=WaltDisneyWorldMagicKingdom NODE_DEBUG=themeparks PRINTDATA=true npm run testonline
