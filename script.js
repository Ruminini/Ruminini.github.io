import { TextWriter } from "./TextWriter.js";

const form = document.getElementById("contact-form");
const fName = document.getElementById("fName");
const fEmail = document.getElementById("fEmail");
const fMessage = document.getElementById("fMessage");
const title = document.getElementById("fTitle");
const writer = new TextWriter(title);

form.addEventListener("submit", (e) => {
	e.preventDefault();
	!fName.value && errorField(fName);
	!fEmail.value && errorField(fEmail);
	!fMessage.value && errorField(fMessage);
	if (!fName.value || !fEmail.value || !fMessage.value) return;
	const writing = writer.write("Getting in touch . . .");
	changeContacting();
	const url = `https://docs.google.com/forms/d/e/1FAIpQLSdJmv7jU49t4FcWpbdjcycWiGO0sx9xPji1Q8s8QfLva4yc6w/formResponse?submit=Submit&usp=pp_url&entry.1137438515=${fName.value}&entry.32220053=${fEmail.value}&entry.1023053542=${fMessage.value}`;
	fetch(url, { mode: "no-cors" })
		.then(() => {
			writing.then(() => {
				writer.write("Thanks for getting in touch!");
				changeContacted();
			});
		})
		.catch((error) => {
			writing.then(() => {
				writer.write("Couldn't get in touch :(").finally(changeContacted);
			});
			console.error("Error submitting form:", error);
		});
});
form.addEventListener("reset", (e) => {
	e.preventDefault();
	fMessage.value = "";
	const writing = writer.write("Get in touch");
	changeContacting();
	setTimeout(changeReset, 500);
	writing.finally(() => writer.clearCursor());
});

const timeouts = {};
function errorField(field) {
	if (timeouts[field.id]) {
		clearTimeout(timeouts[field.id]);
	}
	field.classList.add("error");
	timeouts[field.id] = setTimeout(() => {
		field.classList.remove("error");
	}, 5000);
}

function changeContacting() {
	[...form.children].forEach((child) => (child.hidden = child.id !== "fTitle"));
	form.setAttribute("view", "only-title");
}
function changeContacted() {
	[...form.children].forEach(
		(child) => (child.hidden = child.id !== "fTitle" && child.id !== "fReset"),
	);
	form.setAttribute("view", "title-and-again");
}
function changeReset() {
	[...form.children].forEach((child) => (child.hidden = child.id == "fReset"));
	form.removeAttribute("view");
}
