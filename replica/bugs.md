# Bugs

| ID | sev | found by | what | status |
| --- | --- | --- | --- | --- |
| B01 | S3 | e2e F01 | The current lesson node bobbed up and down forever, so it was a moving click target (Playwright: "element is not stable"); also fought the pressed-state transform. | fixed: the pulse moved to a halo (`::after`), the button stays still |
| B02 | S4 | e2e F01 | The sentence bubble included the 🔊 button's text, so anything reading the prompt (screen readers, tests) got "🔊 Hello…". | fixed: prompt in its own element |

Open S1/S2: none.

To check: background buttons stay in the accessibility tree while a modal is open (aria-modal is set, but focus is not trapped).
