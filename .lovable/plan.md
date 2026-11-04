## Status: sending results to the external panel

Right now no finished record has a send error. Every finished record with a request ID shows as sent, including Jordan Irobun, Karin Langhoff, Joyce Weber and Klaudia Keller Czerwinski (re-sent successfully at 12:03).

### Why the 400 came up so often before
The external panel rejected the whole message when:
1. A field was sent empty (a missing IDnow link, PDF or e-mail). This is fixed: empty fields are now left out.
2. The request ID was not in the expected format. That has to be fixed on the external panel.

### If the 400 still shows up
Your server is probably still running the old version, which sends empty fields. Run on the server:
`git pull; npm install; npm run build; pm2 restart prepare-panel`

### Optional next step (only if it keeps happening)
- Write down the external panel's exact reply for each failed send and show it in the record's detail window, so the cause is visible right away.
