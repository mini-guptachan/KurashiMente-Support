/* 「実施済みとして記録 → 次の予定日が決まる」見本。次の予定日は、記録した日に項目の間隔を足した日
   （月・年は同じ日付、その日がない月は月末）。このページの中だけで動き、保存も送信もしない。 */
(function () {
  "use strict";
  var root = document.querySelector("[data-demo]");
  if (!root) return;
  var WEEK = ["日", "月", "火", "水", "木", "金", "土"];
  var today = new Date(); today.setHours(0, 0, 0, 0);

  function addDays(date, n) { var d = new Date(date); d.setDate(d.getDate() + n); return d; }
  function addMonths(date, n) {
    var d = new Date(date.getFullYear(), date.getMonth() + n, 1);
    var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(date.getDate(), last));
    return d;
  }
  function next(from, interval) {
    var value = parseInt(interval, 10), unit = interval.slice(-1);
    if (unit === "d") return addDays(from, value);
    if (unit === "w") return addDays(from, value * 7);
    if (unit === "m") return addMonths(from, value);
    return addMonths(from, value * 12);
  }
  function short(date) {
    var text = (date.getMonth() + 1) + "/" + date.getDate() + "(" + WEEK[date.getDay()] + ")";
    return date.getFullYear() === today.getFullYear() ? text : date.getFullYear() + "/" + text;
  }
  function long(date) { return date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + date.getDate() + "日(" + WEEK[date.getDay()] + ")"; }
  function label(select) { return select.options[select.selectedIndex].text; }

  var live = root.querySelector("[data-live]");
  var history = root.querySelector("[data-history]");
  var emptyText = history.querySelector(".empty").textContent;
  var tiles = { overdue: root.querySelector("[data-count=overdue]"), today: root.querySelector("[data-count=today]"), soon: root.querySelector("[data-count=soon]") };
  var dateOut = root.querySelector("[data-today]");
  if (dateOut) dateOut.textContent = long(today);

  var tasks = Array.prototype.map.call(root.querySelectorAll("[data-task]"), function (el) {
    var select = el.querySelector("select");
    return {
      el: el, name: el.querySelector("h4").textContent, place: el.getAttribute("data-place"), offset: Number(el.getAttribute("data-offset")),
      select: select, initial: select.value, status: el.querySelector("[data-status]"), nextOut: el.querySelector("[data-next]"),
      meta: el.querySelector("[data-meta]"), preview: el.querySelector("[data-preview]"), button: el.querySelector("[data-record]"),
      buttonText: el.querySelector("[data-record] span"), recordText: el.querySelector("[data-record] span").textContent, done: false, due: null
    };
  });

  function render() {
    var count = { overdue: 0, today: 0, soon: 0 };
    tasks.forEach(function (t) {
      t.meta.textContent = t.place + "・" + label(t.select);
      var diff = Math.round((t.due - today) / 86400000);
      t.status.className = "status";
      if (t.done) {
        t.status.classList.add("s-done"); t.status.textContent = "本日記録済み";
      } else if (diff < 0) {
        count.overdue++; t.status.classList.add("s-overdue"); t.status.textContent = "予定日を" + (-diff) + "日過ぎています";
      } else if (diff === 0) {
        count.today++; t.status.classList.add("s-today"); t.status.textContent = "今日の予定です";
      } else {
        t.status.classList.add("s-soon"); t.status.textContent = "あと" + diff + "日";
      }
      if (!t.done && diff > 0 && diff <= 7) count.soon++;
      if (t.done && diff > 0 && diff <= 7) count.soon++;
      t.nextOut.textContent = short(t.due);
      t.el.classList.toggle("is-done", t.done);
      t.button.setAttribute("aria-disabled", t.done ? "true" : "false");
      t.buttonText.textContent = t.done ? "記録しました" : t.recordText;
      t.select.disabled = t.done;
      t.preview.textContent = t.done ? "履歴に追加し、次回予定日を更新しました。" : "今日記録すると、次回は " + short(next(today, t.select.value)) + " になります。";
    });
    tiles.overdue.textContent = count.overdue; tiles.today.textContent = count.today; tiles.soon.textContent = count.soon;
  }

  function reset() {
    tasks.forEach(function (t) { t.done = false; t.select.value = t.initial; t.due = addDays(today, t.offset); });
    history.innerHTML = ""; var li = document.createElement("li"); li.className = "empty"; li.textContent = emptyText; history.appendChild(li);
    live.textContent = "";
    render();
  }

  tasks.forEach(function (t) {
    t.select.addEventListener("change", render);
    t.button.addEventListener("click", function () {
      if (t.done) return;
      t.done = true; t.due = next(today, t.select.value);
      var empty = history.querySelector(".empty"); if (empty) empty.remove();
      var li = document.createElement("li"), b = document.createElement("b");
      b.textContent = t.name; li.appendChild(b);
      li.appendChild(document.createTextNode("実施日：" + short(today) + "　次の予定日：" + short(t.due)));
      history.insertBefore(li, history.firstChild);
      live.textContent = t.name + "を記録しました。次の予定日は" + long(t.due) + "です。";
      render();
    });
  });
  root.querySelector("[data-reset]").addEventListener("click", reset);
  document.documentElement.classList.add("js");
  reset();
})();
