/* Меню на телефоне */
(function () {
    var header = document.querySelector(".header"), btn = document.querySelector(".menu-btn");
    btn.addEventListener("click", function () {
        var open = !header.classList.contains("menu-open");
        header.classList.toggle("menu-open", open);
        btn.setAttribute("aria-expanded", String(open));
    });
    header.querySelectorAll(".nav a").forEach(function (a) { a.addEventListener("click", function () { header.classList.remove("menu-open"); btn.setAttribute("aria-expanded", "false"); }); });
}());

/* Формы: отправка в ту же Google-таблицу, что и на сайте */
(function () {
    var URL = "https://script.google.com/macros/s/AKfycbwK2kSDBcCFO8w0WPVliFtK9-MaoYmVkWJ_Dxjnv35Oj252KOxLpaQ0PXgIZOIWqrfY/exec";
    var ok = {
        membership: "Заявка отправлена. Мы свяжемся с вами после рассмотрения.",
        feedback: "Вопрос отправлен. Ответим на указанный e-mail.",
        forumRegistration: "Заявка отправлена. Оргкомитет свяжется с вами для подтверждения участия.",
        knowledgeAccess: "Запрос отправлен. Мы свяжемся с вами по указанной почте."
    };
    document.querySelectorAll(".js-sheet").forEach(function (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            if (!form.checkValidity()) { form.reportValidity(); return; }
            var status = form.querySelector(".form-status"), btn = form.querySelector("button[type=submit]"), label = btn.textContent;
            var guard = window.MAFB_GUARD ? window.MAFB_GUARD.check(form) : { ok: true };
            if (!guard.ok) {
                status.className = "form-status " + (guard.silent ? "success" : "error");
                status.textContent = guard.silent ? ok[form.dataset.formType] : guard.message;
                return;
            }
            var data = new FormData(form); data.set("pageUrl", location.href);
            btn.disabled = true; btn.textContent = "Отправляем…"; status.textContent = ""; status.className = "form-status";
            try {
                await fetch(URL, { method: "POST", mode: "no-cors", body: new URLSearchParams(data) });
                var keep = form.querySelector("[data-keep]"), kept = keep ? keep.value : null; form.reset(); if (keep) keep.value = kept; status.textContent = ok[form.dataset.formType]; status.classList.add("success");
            } catch (err) {
                status.textContent = "Не удалось отправить. Напишите на av@iafs.ru."; status.classList.add("error");
            } finally { btn.disabled = false; btn.textContent = label; if (window.MAFB_GUARD) window.MAFB_GUARD.after(form); }
        });
    });
}());
