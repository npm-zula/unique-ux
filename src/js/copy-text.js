document.querySelectorAll(".copy-content").forEach((item, index) => {
	item.addEventListener("click", async (event) => {
		if (!navigator.clipboard) {
			// Clipboard API not available
			return;
		}
		try {
			await navigator.clipboard.writeText(event.target.innerText);
			
			var tooltip = document.getElementById("myTooltip");
  tooltip.innerHTML = "Copied"
			
		} catch (err) {
			console.error("Failed to copy!", err);
		}
	});
});