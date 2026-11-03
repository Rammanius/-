/* МАФБ — защита форм от ботов.
 *
 * 1. Невидимая защита (работает всегда):
 *    скрытое поле-ловушка, проверка скорости заполнения и контрольный код.
 * 2. Яндекс SmartCaptcha (включается, когда вставлен ключ ниже).
 *
 * Чтобы включить капчу: вставьте «Ключ клиента» из Яндекс Cloud в SMARTCAPTCHA_SITEKEY,
 * а «Ключ сервера» — в Google-скрипт (SMARTCAPTCHA_SERVER_KEY).
 */
var SMARTCAPTCHA_SITEKEY = "";

window.MAFB_GUARD = (function () {
    var MIN_FILL_MS = 3000; // человек не заполнит форму быстрее трёх секунд
    var widgets = new WeakMap();

    // Тот же алгоритм, что в Google-скрипте (expectedToken_).
    function token(started) {
        return "m" + (started % 9973).toString(36) + (started % 97).toString(36);
    }

    function hidden(form, name) {
        var input = form.querySelector('input[name="' + name + '"]');
        if (!input) {
            input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            form.appendChild(input);
        }
        return input;
    }

    function arm(form) {
        if (!form.querySelector('input[name="website"]')) {
            // Ловушка: спрятана от людей и экранных дикторов, но видна ботам.
            var trap = document.createElement("div");
            trap.setAttribute("aria-hidden", "true");
            trap.style.cssText = "position:absolute!important;left:-10000px!important;top:auto!important;width:1px!important;height:1px!important;overflow:hidden!important;";
            trap.innerHTML = '<label>Сайт компании<input type="text" name="website" tabindex="-1" autocomplete="off"></label>';
            form.appendChild(trap);
        }
        var started = Date.now();
        // setAttribute, чтобы form.reset() не стирал значения
        hidden(form, "formStarted").setAttribute("value", String(started));
        hidden(form, "botCheck").setAttribute("value", token(started));
        hidden(form, "formStarted").value = String(started);
        hidden(form, "botCheck").value = token(started);
    }

    /* ---------- Яндекс SmartCaptcha ---------- */
    var captchaReady = null;
    function loadCaptcha() {
        if (captchaReady) return captchaReady;
        captchaReady = new Promise(function (resolve) {
            window.__mafbCaptchaLoaded = resolve;
            var s = document.createElement("script");
            s.src = "https://smartcaptcha.yandexcloud.net/captcha.js?render=onload&onload=__mafbCaptchaLoaded";
            s.defer = true;
            document.head.appendChild(s);
        });
        return captchaReady;
    }
    function mountCaptcha(form) {
        if (!SMARTCAPTCHA_SITEKEY) return;
        var box = document.createElement("div");
        box.className = "captcha-box";
        box.style.cssText = "margin: 4px 0 20px; min-height: 102px;";
        var submit = form.querySelector('button[type="submit"]');
        form.insertBefore(box, submit);
        loadCaptcha().then(function () {
            if (!window.smartCaptcha) return;
            var id = window.smartCaptcha.render(box, { sitekey: SMARTCAPTCHA_SITEKEY, hl: "ru" });
            widgets.set(form, id);
        });
    }
    function captchaToken(form) {
        var t = form.querySelector('input[name="smart-token"]');
        return t ? t.value : "";
    }

    /* ---------- Проверка перед отправкой ---------- */
    function check(form) {
        var trap = form.querySelector('input[name="website"]');
        if (trap && trap.value) return { ok: false, silent: true };
        var started = Number(form.querySelector('input[name="formStarted"]').value);
        if (Date.now() - started < MIN_FILL_MS) {
            return { ok: false, message: "Форма отправлена слишком быстро. Подождите пару секунд и нажмите ещё раз." };
        }
        if (SMARTCAPTCHA_SITEKEY && !captchaToken(form)) {
            return { ok: false, message: "Подтвердите, что вы не робот." };
        }
        return { ok: true };
    }

    // После отправки: новая отметка времени и новая капча
    function after(form) {
        arm(form);
        if (widgets.has(form) && window.smartCaptcha) window.smartCaptcha.reset(widgets.get(form));
    }

    document.querySelectorAll("form").forEach(function (form) {
        if (form.getAttribute("role") === "search") return;
        arm(form);
        mountCaptcha(form);
    });

    return { check: check, after: after, arm: arm };
}());
