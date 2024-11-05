const form = document.getElementById("contact-form");
const fName = document.getElementById("fName");
const fEmail = document.getElementById("fEmail");
const fMessage = document.getElementById("fMessage");

form.addEventListener("submit", (e) => {
	e.preventDefault();
	if (fName.value === "") {errorField(fName);}
	else if (fEmail.value === "") {errorField(fEmail);}
	else if (fMessage.value === "") {errorField(fMessage);}
	else {
		const url = `https://docs.google.com/forms/d/e/1FAIpQLSdJmv7jU49t4FcWpbdjcycWiGO0sx9xPji1Q8s8QfLva4yc6w/formResponse?submit=Submit&usp=pp_url&entry.1137438515=${fName.value}&entry.32220053=${fEmail.value}&entry.1023053542=${fMessage.value}`;
		window.open(url, "_blank").focus();

		fName.value = "";
		fEmail.value = "";
		fMessage.value = "";
	}
});

const timeouts = {};
function errorField(field) {
	if (timeouts[field.id]) {clearTimeout(timeouts[field.id]);}
	field.classList.add("error");
	timeouts[field.id] = setTimeout(() => {
		field.classList.remove("error");
	}, 5000);
}