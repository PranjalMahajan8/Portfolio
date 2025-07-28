console.log("JS loaded");

var typed = new Typed("#element", {
  strings: [" Web Developer"],
  once:true,
  typeSpeed: 60,
  loop: false,
});
window.addEventListener("load", function () {
  document.body.classList.add("fade-in");
});
AOS.init({
  duration: 800,
  easing: "ease-in-out",
  once: false,
  offset: 150,
  mirror: true,
});

document
  .getElementById("contact-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value;

    try {
      const res = await fetch("/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const result = await res.json();

      if (res.ok) {
        alert("✅ " + result.message);
      } else {
        alert("❌ " + result.message);
      }
    } catch (err) {
      alert("❌ Error sending message.");
      console.error(err);
    }
  });
