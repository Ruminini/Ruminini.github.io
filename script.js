const form = document.getElementById("contact-form");
const fName = document.getElementById("fName");
const fEmail = document.getElementById("fEmail");
const fMessage = document.getElementById("fMessage");

form.addEventListener("submit", (e) => {
	e.preventDefault();
	console.log(fName.value, fEmail.value, fMessage.value);
	if (fName.value === "" || fEmail.value === "" || fMessage.value === "") {
		alert("Please fill out all fields.");
	} else {
		const url = `https://docs.google.com/forms/d/e/1FAIpQLSdJmv7jU49t4FcWpbdjcycWiGO0sx9xPji1Q8s8QfLva4yc6w/formResponse?submit=Submit&usp=pp_url&entry.1137438515=${fName.value}&entry.32220053=${fEmail.value}&entry.1023053542=${fMessage.value}`;
		window.open(url, "_blank").focus();

		fName.value = "";
		fEmail.value = "";
		fMessage.value = "";
	}
});
