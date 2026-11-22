// === LinkedIn (nepovinné) ===
// Ak používateľ vyplnil LinkedIn URL, uložíme ho pre neskoršie použitie v chate
const linkedinInput = document.getElementById("linkedinUrl");
const linkedinUrl = linkedinInput ? linkedinInput.value.trim() : "";
if (linkedinUrl) {
  localStorage.setItem("linkedin_url", linkedinUrl);
} else {
  localStorage.removeItem("linkedin_url");
}